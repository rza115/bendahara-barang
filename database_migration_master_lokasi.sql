-- Jalankan setelah database_migration_soft_delete_aset.sql di Supabase SQL Editor.
-- Seluruh perubahan dan pemetaan lokasi lama dilakukan dalam satu transaksi.
BEGIN;

CREATE OR REPLACE FUNCTION public.normalisasi_lokasi(value text)
RETURNS text LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
  SELECT btrim(regexp_replace(value, '[[:space:]]+', ' ', 'g'));
$$;

CREATE TABLE IF NOT EXISTS public.master_lokasi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama text NOT NULL UNIQUE,
  gedung text,
  keterangan text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT master_lokasi_nama_valid CHECK (
    nama <> '' AND nama = public.normalisasi_lokasi(nama) AND length(nama) <= 200
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS master_lokasi_nama_normalized
  ON public.master_lokasi (lower(public.normalisasi_lokasi(nama)));

ALTER TABLE public.master_lokasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_lokasi_authenticated ON public.master_lokasi;
CREATE POLICY master_lokasi_authenticated ON public.master_lokasi
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
REVOKE ALL ON public.master_lokasi FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_lokasi TO authenticated;

-- Termasuk lokasi aset di Trash agar pemulihan aset tetap valid.
INSERT INTO public.master_lokasi (nama)
SELECT min(public.normalisasi_lokasi(lokasi))
FROM public.aset
WHERE public.normalisasi_lokasi(lokasi) <> ''
GROUP BY lower(public.normalisasi_lokasi(lokasi))
ON CONFLICT DO NOTHING;

UPDATE public.aset SET lokasi = NULL
WHERE public.normalisasi_lokasi(lokasi) = '';
UPDATE public.aset a SET lokasi = m.nama
FROM public.master_lokasi m
WHERE lower(public.normalisasi_lokasi(a.lokasi)) = lower(m.nama)
  AND a.lokasi IS DISTINCT FROM m.nama;

-- Kolom lokasi tetap kompatibel dengan dashboard, detail, barcode, dan ekspor.
-- Mengganti nama master memperbarui lokasi seluruh aset secara atomik.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.aset'::regclass AND conname = 'aset_lokasi_master_fk') THEN
    ALTER TABLE public.aset ADD CONSTRAINT aset_lokasi_master_fk
      FOREIGN KEY (lokasi) REFERENCES public.master_lokasi(nama)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_aset_lokasi ON public.aset(lokasi);

-- Impor lama tetap dapat mengirim nama lokasi; variasi spasi/huruf dicocokkan
-- ke master. Nama yang belum terdaftar ditolak, bukan membuat duplikat ruangan.
CREATE OR REPLACE FUNCTION public.validasi_lokasi_aset()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE canonical text;
BEGIN
  NEW.lokasi := NULLIF(public.normalisasi_lokasi(NEW.lokasi), '');
  IF NEW.lokasi IS NULL THEN RETURN NEW; END IF;
  SELECT nama INTO canonical FROM public.master_lokasi
    WHERE lower(nama) = lower(NEW.lokasi);
  IF canonical IS NULL THEN
    RAISE EXCEPTION 'Lokasi "%" belum terdaftar. Tambahkan melalui Master Lokasi & KIR.', NEW.lokasi;
  END IF;
  NEW.lokasi := canonical;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS aset_validasi_lokasi ON public.aset;
CREATE TRIGGER aset_validasi_lokasi BEFORE INSERT OR UPDATE OF lokasi ON public.aset
  FOR EACH ROW EXECUTE FUNCTION public.validasi_lokasi_aset();

COMMIT;
