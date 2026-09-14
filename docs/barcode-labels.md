# Label inventaris 90 × 45 mm

Semua template (QR, Code128, dan BPKAD) memakai ukuran luar tetap 90 × 45 mm,
termasuk border. Konstanta dimensi ada di `features/barcode/barcode-layout.js`.
CSS memakai variabel yang dipasang dari konstanta tersebut; ukuran PDF tidak
dihitung dari rasio preview atau lebar kolom layar.

| Kertas | Margin | Jarak label | Kolom × baris | Kapasitas |
| --- | --- | --- | --- | --- |
| A4, 210 × 297 mm | 10 mm | 6 mm | 2 × 5 | 10 |
| F4, 210 × 330 mm | 10 mm | 6 mm | 2 × 6 | 12 |
| A3 landscape, 420 × 297 mm | 10 mm | 6 mm | 4 × 5 | 20 |

Preview dapat digeser horizontal pada layar kecil. Label tidak diperkecil untuk
menyesuaikan viewport. Pergantian kertas menyusun ulang halaman tanpa mengubah
ukuran atau isi label. Print memakai alur dokumen normal dan pemisah halaman
eksplisit, bukan elemen fixed yang dapat berulang pada setiap halaman.

QR ditempatkan di kolom kiri, dengan area putih 28 × 28 mm termasuk quiet zone
empat modul. qrcodejs 1.0.0 menyediakan jumlah modul melalui `_oQRCode`;
periksa integrasi ini bila mengganti library QR. Bitmap sumber 336 × 336 px,
ekspor html2canvas pada scale 4. Data URL QR tidak diubah. Teks URL terpotong
yang sebelumnya ditampilkan di bawah QR dihapus; URL lengkap tetap di QR.
Font informasi 7-8 pt. Label tidak memangkas atau mengecilkan teks otomatis:
Print/Download PDF menolak jika isi melampaui batas fisik. Gambar/font ditunggu
sebelum ekspor, dan kegagalan gambar dilaporkan.

## Cetak fisik

- Pilih kertas yang sama dengan PDF/pengaturan aplikasi.
- Gunakan 100% / Actual size, bukan Fit to page.
- Nonaktifkan header/footer browser.
- Cetak satu halaman uji, ukur label dengan penggaris, lalu pindai QR dengan HP.
- Ukuran ini untuk label potong; tidak menjanjikan kecocokan dengan semua
  lembar stiker pracetak. Sesuaikan stok label dengan ukuran dan jarak di atas.

Code128 tetap mengodekan URL seperti sebelumnya. URL panjang menghasilkan
batang sangat padat; untuk pemindaian URL pada label kecil, gunakan QR.
Pengujian fisik Code128 dengan scanner tetap diperlukan.

## Pengujian

`node --test tests/*.test.cjs` menjalankan tes unit, termasuk kapasitas,
koordinat, batas halaman dan fallback kertas.

`tests/barcode-browser.cjs` adalah tes integrasi opsional memakai Playwright
dan versi library frontend yang sama dengan halaman. Lihat instruksi instalasi
di awal file. Tes memakai data contoh/intersepsi aset lokal, tanpa Supabase.
Output PDF dan PNG ditulis ke direktori sementara atau `BARCODE_TEST_OUTPUT`.
`BARCODE_CHROMIUM_PATH` dapat menunjuk executable Chromium yang sudah tersedia.

Verifikasi perubahan ini: 21 tes unit lulus; 18 kombinasi viewport (375/1440 px),
template dan kertas lulus. Ekspor html2canvas/jsPDF diuji dari kedua viewport;
PDF A4 berisi 21 label dalam 3 halaman (10/10/1), dengan setiap gambar label
berukuran tepat 90 × 45 mm. Print A4/F4/A3 menghasilkan 3/2/2 halaman, tanpa
label hilang atau berulang. Render halaman diperiksa secara visual; satu QR
contoh berhasil didekode ke URL aset yang sama. PDF 21 label sekitar 1,9 MiB
dengan kompresi lossless. Ini bukan pengganti uji cetak/scanner fisik.
