# 📎 Panduan Upload Dokumen Pengadaan

## Deskripsi

Fitur upload dokumen pengadaan memungkinkan Anda menyimpan dokumen-dokumen pendukung pengadaan barang secara digital. Fitur ini **opsional** dan dapat digunakan untuk keperluan audit atau dokumentasi.

## Jenis Dokumen yang Dapat Diupload

1. **SPK / Surat Pesanan / Dokumen Kontrak**  
   Surat Perintah Kerja atau dokumen kontrak dari proses pengadaan

2. **Surat Penawaran dari Penyedia**  
   Dokumen penawaran harga dari vendor/penyedia barang

3. **Berita Acara Pemeriksaan/Penerimaan (BAPHP)**  
   Dokumen pemeriksaan hasil pekerjaan sebelum penerimaan

4. **Berita Acara Serah Terima (BAST)**  
   Bukti resmi serah terima barang yang sudah diterima

5. **Kuitansi / Faktur / Nota Pembelian**  
   Bukti pembayaran atau transaksi pembelian

## Spesifikasi File

- **Format yang didukung**: PDF, JPG, JPEG, PNG
- **Ukuran maksimal**: 5 MB per file
- **Sifat**: Opsional (tidak wajib diisi)

## Cara Menggunakan

### Di Halaman Tambah Aset (`tambah.html`)

1. Isi data aset seperti biasa (nama barang, KIB, harga, dll.)
2. Scroll ke bagian **"📎 Dokumen Pengadaan"**
3. Klik tombol **"Choose File"** pada dokumen yang ingin diupload
4. Pilih file dari komputer Anda (pastikan format dan ukuran sesuai)
5. Ulangi untuk dokumen lain jika diperlukan
6. Klik **"💾 Simpan Aset"** untuk menyimpan aset beserta dokumennya

### Di Halaman Edit Aset (`edit.html`)

1. Buka halaman edit aset yang sudah ada
2. Scroll ke bagian **"📎 Dokumen Pengadaan"**
3. Upload dokumen baru atau ganti dokumen yang sudah ada
4. Klik **"💾 Simpan Perubahan"**

## Catatan Penting

⚠️ **Perhatian**:
- Dokumen yang sudah diupload akan disimpan di Supabase Storage
- Pastikan dokumen tidak mengandung informasi sensitif yang tidak boleh disimpan online
- File yang terlalu besar (> 5 MB) tidak akan bisa diupload
- Disarankan untuk mengkompress file PDF jika ukurannya terlalu besar

✅ **Tips**:
- Gunakan scanner dengan resolusi 150-200 DPI untuk dokumen fisik
- Simpan dokumen dengan nama file yang jelas sebelum upload
- Upload hanya dokumen yang benar-benar diperlukan untuk audit

## Status Implementasi

✅ UI Form sudah tersedia di `tambah.html`  
⏳ JavaScript handler untuk upload multi-file (dalam pengembangan)  
⏳ Integrasi dengan Supabase Storage (dalam pengembangan)

---

*Terakhir diupdate: 25 Maret 2026*
