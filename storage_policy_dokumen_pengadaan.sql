-- ============================================
-- Storage Policy untuk bucket: dokumen-pengadaan
-- ============================================
-- Script ini mengatur akses ke bucket dokumen-pengadaan
-- Hanya authenticated users yang bisa upload, read, update, dan delete
-- Gunakan script ini di SQL Editor Supabase

-- 1. Policy: Allow authenticated users to UPLOAD (INSERT) dokumen
CREATE POLICY "Authenticated users can upload dokumen pengadaan"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dokumen-pengadaan'
);

-- 2. Policy: Allow authenticated users to READ (SELECT) dokumen
CREATE POLICY "Authenticated users can read dokumen pengadaan"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dokumen-pengadaan'
);

-- 3. Policy: Allow authenticated users to UPDATE dokumen
CREATE POLICY "Authenticated users can update dokumen pengadaan"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dokumen-pengadaan'
)
WITH CHECK (
  bucket_id = 'dokumen-pengadaan'
);

-- 4. Policy: Allow authenticated users to DELETE dokumen
CREATE POLICY "Authenticated users can delete dokumen pengadaan"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dokumen-pengadaan'
);

-- ============================================
-- CATATAN PENGGUNAAN:
-- ============================================
-- 1. Pastikan bucket 'dokumen-pengadaan' sudah dibuat di Supabase Storage
-- 2. Jalankan script ini di SQL Editor Supabase
-- 3. Bucket ini digunakan untuk menyimpan 5 jenis dokumen:
--    - SPK / Kontrak
--    - Surat Penawaran
--    - BAPHP (Berita Acara Pemeriksaan/Penerimaan)
--    - BAST (Berita Acara Serah Terima)
--    - Kuitansi / Faktur / Nota
-- 4. Format file yang didukung: PDF, JPG, PNG
-- 5. Ukuran maksimal per file: 5 MB (diatur di app.js)

-- ============================================
-- CARA MEMBUAT BUCKET (jika belum ada):
-- ============================================
-- 1. Buka Supabase Dashboard → Storage
-- 2. Klik 'New Bucket'
-- 3. Nama: dokumen-pengadaan
-- 4. Public bucket: NO (private)
-- 5. File size limit: 5242880 (5 MB)
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/png

-- ============================================
-- TROUBLESHOOTING:
-- ============================================
-- Jika policy sudah ada dan ingin update:
-- 1. Drop policy lama terlebih dahulu:
--    DROP POLICY IF EXISTS "nama_policy" ON storage.objects;
-- 2. Kemudian jalankan CREATE POLICY yang baru

-- Untuk melihat policy yang sudah ada:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
