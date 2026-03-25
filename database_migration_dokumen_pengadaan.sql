-- =====================================================
-- Database Migration: Tambah Kolom Dokumen Pengadaan
-- Tanggal: 25 Maret 2026
-- Deskripsi: Menambahkan 5 kolom untuk menyimpan URL
--            dokumen pengadaan barang ke tabel 'aset'
-- =====================================================

-- Tambahkan kolom untuk URL dokumen pengadaan
ALTER TABLE aset 
  ADD COLUMN IF NOT EXISTS dok_spk_url TEXT,
  ADD COLUMN IF NOT EXISTS dok_penawaran_url TEXT,
  ADD COLUMN IF NOT EXISTS dok_baphp_url TEXT,
  ADD COLUMN IF NOT EXISTS dok_bast_url TEXT,
  ADD COLUMN IF NOT EXISTS dok_kuitansi_url TEXT;

-- Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN aset.dok_spk_url IS 'URL dokumen SPK/Surat Pesanan/Kontrak di Supabase Storage';
COMMENT ON COLUMN aset.dok_penawaran_url IS 'URL dokumen Surat Penawaran dari Penyedia';
COMMENT ON COLUMN aset.dok_baphp_url IS 'URL dokumen Berita Acara Pemeriksaan/Penerimaan';
COMMENT ON COLUMN aset.dok_bast_url IS 'URL dokumen Berita Acara Serah Terima';
COMMENT ON COLUMN aset.dok_kuitansi_url IS 'URL dokumen Kuitansi/Faktur/Nota Pembelian';

-- Verifikasi kolom sudah ditambahkan
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'aset'
  AND column_name LIKE 'dok_%';

-- =====================================================
-- CATATAN PENTING:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Pastikan tabel 'aset' sudah ada sebelum run script
-- 3. Kolom bersifat nullable (opsional)
-- 4. Tipe data TEXT untuk menyimpan URL dari Storage
-- 5. Bucket Storage 'dokumen-pengadaan' harus sudah dibuat
-- =====================================================
