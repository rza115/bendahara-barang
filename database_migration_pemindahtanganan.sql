-- ============================================================
-- MIGRATION: Tabel Pemindahtanganan Barang
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat tabel pemindahtanganan
CREATE TABLE IF NOT EXISTS pemindahtanganan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id     uuid NOT NULL REFERENCES aset(id) ON DELETE CASCADE,
  dari_pj_id    uuid REFERENCES penanggung_jawab(id) ON DELETE SET NULL,
  ke_pj_id      uuid NOT NULL REFERENCES penanggung_jawab(id) ON DELETE RESTRICT,
  tanggal       date NOT NULL,
  no_dokumen    text,
  keterangan    text,
  dokumen_url   text,
  dibuat_pada   timestamptz NOT NULL DEFAULT now()
);

-- 2. Index untuk query cepat per barang dan per PJ
CREATE INDEX IF NOT EXISTS idx_pemindahtanganan_barang
  ON pemindahtanganan(barang_id);

CREATE INDEX IF NOT EXISTS idx_pemindahtanganan_dari_pj
  ON pemindahtanganan(dari_pj_id);

CREATE INDEX IF NOT EXISTS idx_pemindahtanganan_ke_pj
  ON pemindahtanganan(ke_pj_id);

CREATE INDEX IF NOT EXISTS idx_pemindahtanganan_tanggal
  ON pemindahtanganan(tanggal DESC);

-- 3. Enable Row Level Security
ALTER TABLE pemindahtanganan ENABLE ROW LEVEL SECURITY;

-- 4. Policy: semua authenticated user bisa baca & tulis
--    (sesuaikan nanti ketika sistem roles diimplementasikan)
CREATE POLICY "Authenticated can read pemindahtanganan"
  ON pemindahtanganan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert pemindahtanganan"
  ON pemindahtanganan FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update pemindahtanganan"
  ON pemindahtanganan FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete pemindahtanganan"
  ON pemindahtanganan FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- SELESAI
-- Setelah migration ini dijalankan:
-- - Tabel pemindahtanganan siap digunakan
-- - penanggung_jawab_id di tabel aset akan diupdate
--   otomatis oleh aplikasi saat pemindahtanganan disimpan
-- ============================================================
