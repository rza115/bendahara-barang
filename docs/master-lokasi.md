# Master Lokasi & Kartu Inventaris Ruangan

## Aktivasi database

1. Pastikan migrasi `database_migration_soft_delete_aset.sql` sudah diterapkan.
2. Jalankan seluruh isi `database_migration_master_lokasi.sql` melalui Supabase SQL Editor.
3. Muat ulang aplikasi dan buka menu **Master Lokasi & KIR**.

Migrasi dijalankan dalam transaksi. Lokasi lama (termasuk aset di Trash) dimasukkan
ke master dan variasi huruf/spasi disatukan. Lokasi kosong menjadi NULL. Nama yang
berbeda makna/ejaan tetap terpisah dan dapat ditata melalui Edit Aset.
Migrasi dapat dijalankan ulang. Jika langkah SQL gagal, seluruh transaksi dibatalkan;
periksa pesan kesalahan sebelum mengulangi. Kode frontend membutuhkan migrasi ini
sebelum tambah/edit/impor aset digunakan.

## Penggunaan

- Tambah ruangan beserta gedung/lantai dan keterangan pada halaman master.
- Pilih lokasi dari dropdown Tambah/Edit Aset. Lokasi boleh belum ditentukan.
- Pilih ruangan di halaman KIR atau klik **Kartu** pada tabel master.
- **Cetak kartu** mencetak pilihan aktif. **Semua ruangan** memulai setiap kartu di
  halaman baru, termasuk ruangan kosong dan kelompok belum ditentukan jika ada.
- Barang dengan nama sama tetap menjadi baris terpisah untuk mempertahankan
  ID/register dan kondisi. Jumlah unit menjumlahkan kolom `jumlah`; total nilai
  menjumlahkan `harga` tiap catatan, mengikuti perhitungan dashboard.
- Ganti nama master untuk memperbarui lokasi semua aset dalam satu transaksi
  database. Lokasi yang dipakai aset aktif maupun Trash tidak bisa dihapus.
- Impor CSV/XLSX mencocokkan nama lokasi ke master (abaikan kapitalisasi dan
  variasi spasi). Lokasi yang belum terdaftar menolak proses sebelum insert pertama;
  tambahkan master terlebih dahulu atau kosongkan lokasinya.

Data ruangan disimpan di Supabase, bukan penyimpanan browser. Akses master
dibatasi ke role `authenticated`, sesuai pola halaman pengelolaan aplikasi.
Kolom `aset.lokasi` tetap berupa nama yang direferensikan ke master menggunakan
foreign key dengan `ON UPDATE CASCADE` dan `ON DELETE RESTRICT`.

## Verifikasi

Jalankan `node --test tests/lokasi.test.cjs` untuk pengelompokan, validasi impor,
paginasi >1.000 aset, kegagalan fetch, dan escaping kartu.
Setelah migrasi, cek tambah/edit lokasi, rename lokasi yang memiliki aset,
penolakan hapus lokasi terpakai, dan pratinjau cetak A4 landscape di browser.
