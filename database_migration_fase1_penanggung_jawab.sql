-- ============================================
-- MIGRATION: FASE 1 — Manajemen Data Barang
-- Tanggal: 2026-03
-- Deskripsi: Tambah tabel profil_pengguna dan
--            kolom penanggung_jawab_id di tabel aset
-- Jalankan di Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Buat tabel profil_pengguna
-- ============================================
CREATE TABLE IF NOT EXISTS profil_pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  unit_kerja TEXT,
  no_hp TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk query cepat berdasarkan user_id
CREATE INDEX IF NOT EXISTS idx_profil_pengguna_user_id ON profil_pengguna(user_id);

-- RLS: aktifkan Row Level Security
ALTER TABLE profil_pengguna ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa lihat dan edit profilnya sendiri
CREATE POLICY "Profil: baca sendiri" ON profil_pengguna
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Profil: insert sendiri" ON profil_pengguna
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Profil: update sendiri" ON profil_pengguna
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: semua user yang login bisa lihat profil orang lain
-- (untuk dropdown penanggung jawab)
CREATE POLICY "Profil: baca semua (authenticated)" ON profil_pengguna
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 2: Tambah tabel penanggung_jawab
-- (terpisah dari profil_pengguna, untuk fleksibilitas
--  data penanggung jawab tidak harus punya akun login)
-- ============================================
CREATE TABLE IF NOT EXISTS penanggung_jawab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  nip TEXT,
  jabatan TEXT,
  unit_kerja TEXT DEFAULT 'Kecamatan Tenjo',
  no_hp TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE penanggung_jawab ENABLE ROW LEVEL SECURITY;

-- Semua user login bisa baca dan kelola daftar penanggung jawab
CREATE POLICY "PJ: baca semua" ON penanggung_jawab
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "PJ: insert" ON penanggung_jawab
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "PJ: update" ON penanggung_jawab
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 3: Tambah kolom penanggung_jawab_id di tabel aset
-- ============================================
ALTER TABLE aset
  ADD COLUMN IF NOT EXISTS penanggung_jawab_id UUID REFERENCES penanggung_jawab(id) ON DELETE SET NULL;

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_aset_penanggung_jawab ON aset(penanggung_jawab_id);

-- ============================================
-- STEP 4: Tambah kolom nama_penanggung_jawab (denormalized)
-- Sebagai fallback jika penanggung jawab dihapus
-- ============================================
ALTER TABLE aset
  ADD COLUMN IF NOT EXISTS nama_penanggung_jawab TEXT;

-- ============================================
-- STEP 5: Data awal penanggung jawab (opsional)
-- Sesuaikan dengan data riil di lapangan
-- ============================================
-- INSERT INTO penanggung_jawab (nama, jabatan, unit_kerja) VALUES
--   ('Nama Camat', 'Camat', 'Kecamatan Tenjo'),
--   ('Nama Bendahara', 'Bendahara Barang', 'Kecamatan Tenjo'),
--   ('Nama Kasubag', 'Kasubag Umum', 'Kecamatan Tenjo');

-- ============================================
-- STEP 6: Trigger updated_at untuk profil_pengguna
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profil_pengguna_updated_at
  BEFORE UPDATE ON profil_pengguna
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFIKASI
-- Jalankan ini untuk cek hasilnya:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'aset' AND column_name LIKE '%penanggung%';
-- ============================================
