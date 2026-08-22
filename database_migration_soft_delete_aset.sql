-- ============================================================
-- MIGRATION: Trash / soft delete aset
-- Jalankan satu kali melalui Supabase SQL Editor.
-- ============================================================

-- Penanda aset berada di Trash dan siapa yang menghapusnya.
ALTER TABLE public.aset
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.aset.deleted_at IS
  'Waktu aset dipindahkan ke Trash; NULL berarti aset masih aktif.';
COMMENT ON COLUMN public.aset.deleted_by IS
  'User yang memindahkan aset ke Trash.';

CREATE INDEX IF NOT EXISTS idx_aset_deleted_at
  ON public.aset (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

-- Hapus permanen dilakukan melalui satu transaksi database agar seluruh
-- data turunan ikut dibersihkan dan tidak meninggalkan foreign key yatim.
CREATE OR REPLACE FUNCTION public.hapus_aset_permanen(p_aset_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autentikasi diperlukan';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.aset
    WHERE id = p_aset_id AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Aset tidak ditemukan di Trash';
  END IF;

  DELETE FROM public.dokumen_aset WHERE aset_id = p_aset_id;
  DELETE FROM public.peminjaman WHERE aset_id = p_aset_id;
  DELETE FROM public.pemindahtanganan WHERE barang_id = p_aset_id;
  DELETE FROM public.dokumen_pengguna
    WHERE pengguna_barang_id IN (
      SELECT id FROM public.pengguna_barang WHERE aset_id = p_aset_id
    );
  DELETE FROM public.pengguna_barang WHERE aset_id = p_aset_id;
  DELETE FROM public.aset WHERE id = p_aset_id AND deleted_at IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.hapus_aset_permanen(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hapus_aset_permanen(uuid) TO authenticated;

-- Endpoint publik baru khusus aset aktif. Fungsi lama tetap dipertahankan
-- agar integrasi lain yang mungkin memakainya tidak berubah.
CREATE OR REPLACE FUNCTION public.get_aset_public_aktif()
RETURNS TABLE (
  id uuid,
  kode_barang text,
  nama_barang text,
  tahun_perolehan integer,
  kondisi text,
  lokasi text,
  foto_url text,
  penanggung_jawab_nama text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id,
    a.kode_barang,
    a.nama_barang,
    a.tahun_perolehan,
    a.kondisi,
    a.lokasi,
    a.foto_url,
    COALESCE(pj.nama, a.nama_penanggung_jawab) AS penanggung_jawab_nama
  FROM public.aset AS a
  LEFT JOIN public.penanggung_jawab AS pj ON pj.id = a.penanggung_jawab_id
  WHERE a.deleted_at IS NULL;
$$;

REVOKE ALL ON FUNCTION public.get_aset_public_aktif() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_aset_public_aktif() TO anon, authenticated;
