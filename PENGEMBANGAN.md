# RENCANA PENGEMBANGAN — Aplikasi Bendahara Barang

> Dokumen ini mencatat alur, logika, dan prioritas fitur yang akan dikembangkan.
> Diperbarui: 26 Maret 2026

---

## STATUS FITUR SAAT INI

| Fitur | Status |
|---|---|
| Login & autentikasi | ✅ Selesai |
| Data barang (CRUD) | ✅ Selesai |
| Dokumen pengadaan | ✅ Selesai |
| Barcode barang | ✅ Selesai |
| Peminjaman barang | ✅ Selesai |
| Pengguna barang | ✅ Selesai |
| Pemindahtanganan barang | ✅ Selesai |
| Penanggung jawab barang | ✅ Selesai |
| Roles operator | 🔲 Belum |
| Roles bendahara pembantu | 🔲 Belum |
| Export laporan ke Excel | 🔲 Belum |
| Import data aset dari Excel/CSV | 🔲 Belum |
| Cetak label barang (barcode) | ✅ Selesai |
| View Scan (barcode) Public | ✅ Selesai |

---


## PROGRESS LOG

| Tanggal | Perubahan |
|---|---|
| 26 Maret 2026 | ✅ FASE 1A — Migrasi database: tabel `penanggung_jawab` dibuat (nama, NIP, jabatan, unit_kerja, no_hp, aktif) |
| 26 Maret 2026 | ✅ FASE 1B — Halaman `penanggung-jawab.html` dibuat (CRUD penanggung jawab) |
| 26 Maret 2026 | ✅ FASE 1B — Dropdown penanggung jawab di `tambah.html` dan `edit.html` terintegrasi ke database |
| 26 Maret 2026 | ✅ FASE 1B — Link navigasi `PJ Barang` ditambahkan di `nav.js` |
| 26 Maret 2026 | ✅ Kolom `penanggung_jawab_id` dan `nama_penanggung_jawab` ditambahkan ke form dan `getFormData()` di `app.js` |
| 26 Maret 2026 | ✅ FASE 1C — Tabel `pemindahtanganan` dibuat (migration SQL) dengan referensi ke `penanggung_jawab` |
| 26 Maret 2026 | ✅ FASE 1C — Halaman `pemindahtanganan.html` dibuat (form + tabel riwayat) |
| 26 Maret 2026 | ✅ FASE 1C — Fungsi `initPemindahtangananPage()` ditambahkan di `app.js` |
| 26 Maret 2026 | ✅ FASE 1C — Link navigasi `Pindahtangan` ditambahkan di `nav.js` |
## FASE 1 — Manajemen Data Barang (Prioritas Tinggi)

### 1.1 Penanggung Jawab Barang

**Tujuan:** Setiap barang memiliki penanggung jawab yang tercatat, sehingga akuntabilitas aset lebih jelas.

**Alur logika:**
1. Tambah kolom `penanggung_jawab_id` (FK ke tabel users) di tabel `barang`
2. Di halaman `tambah.html` dan `edit.html`, tambah field dropdown pilih penanggung jawab
3. Dropdown diisi dari data pengguna yang tersimpan di Supabase
4. Di halaman `detail.html`, tampilkan nama penanggung jawab beserta jabatan/unit kerjanya
5. Di halaman `index.html` (daftar barang), tambah kolom "Penanggung Jawab" di tabel

**Perubahan database:**
```sql
ALTER TABLE barang
ADD COLUMN penanggung_jawab_id uuid REFERENCES auth.users(id);

CREATE TABLE profil_pengguna (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  nama_lengkap text,
  jabatan text,
  unit_kerja text
);
```

**File yang diubah:** `tambah.html`, `edit.html`, `detail.html`, `index.html`, `app.js`

---

### 1.2 Pemindahtanganan Barang di Dokumen Barang

**Tujuan:** Mencatat riwayat perpindahan kepemilikan/pengguna barang secara resmi dengan dokumen yang terarsip.

**Alur logika:**
1. Buat tabel baru `pemindahtanganan` di Supabase:
   - `id`, `barang_id`, `dari_pengguna_id`, `ke_pengguna_id`, `tanggal`, `keterangan`, `dokumen_url`, `dibuat_oleh`, `dibuat_pada`
2. Buat halaman baru `pemindahtanganan.html` untuk:
   - List semua riwayat pemindahtanganan
   - Form input pemindahtanganan baru
3. Di halaman `detail.html` barang, tampilkan tab/section "Riwayat Pemindahtanganan"
4. Setiap pemindahtanganan otomatis memperbarui kolom `penanggung_jawab_id` di tabel `barang`
5. Dokumen fisik (SK/Berita Acara) bisa diupload ke Supabase Storage dan ditautkan

**Perubahan database:**
```sql
CREATE TABLE pemindahtanganan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barang_id uuid REFERENCES barang(id),
  dari_pengguna_id uuid,
  ke_pengguna_id uuid,
  tanggal date NOT NULL,
  keterangan text,
  dokumen_url text,
  dibuat_oleh uuid REFERENCES auth.users(id),
  dibuat_pada timestamptz DEFAULT now()
);
```

**File yang diubah/dibuat:** `pemindahtanganan.html` (baru), `detail.html`, `app.js`, `nav.js`

---

## FASE 2 — Sistem Roles & Akses (Prioritas Tinggi)

### 2.1 Roles Operator

**Tujuan:** Memisahkan akses antara operator (input data sehari-hari) dan bendahara barang (pengelola penuh).

**Alur logika:**
1. Tambah kolom `role` di tabel profil pengguna: nilai `'admin'`, `'bendahara'`, `'operator'`, `'bendahara_pembantu'`
2. Operator hanya bisa:
   - Melihat data barang (read-only)
   - Input peminjaman barang
   - Input pengguna barang
3. Operator TIDAK bisa:
   - Menghapus data barang
   - Mengedit dokumen pengadaan
   - Melihat halaman manajemen pengguna
4. Di `auth.js`, setelah login cek `role` dari profil dan simpan ke `localStorage`
5. Setiap halaman cek `role` di awal dan redirect jika tidak punya akses

**Logika pengecekan akses:**
```js
// Di setiap halaman yang perlu akses terbatas
const role = localStorage.getItem('user_role');
const allowedRoles = ['admin', 'bendahara'];
if (!allowedRoles.includes(role)) {
  window.location.href = 'index.html';
}
```

**File yang diubah:** `auth.js`, `app.js`, semua halaman HTML

---

### 2.2 Roles Bendahara Pembantu

**Tujuan:** Bendahara pembantu dapat membantu pengelolaan data namun tetap di bawah supervisi bendahara utama.

**Alur logika:**
1. Bendahara pembantu memiliki akses lebih luas dari operator, tapi terbatas dibanding bendahara utama:
   - Bisa tambah & edit barang
   - Bisa input dokumen pengadaan
   - **Tidak bisa** menghapus data
   - **Tidak bisa** manajemen pengguna/roles
   - **Tidak bisa** export laporan
2. Tabel akses berdasarkan role:

| Fitur | Admin | Bendahara | B. Pembantu | Operator |
|---|---|---|---|---|
| Lihat barang | ✅ | ✅ | ✅ | ✅ |
| Tambah/edit barang | ✅ | ✅ | ✅ | ❌ |
| Hapus barang | ✅ | ✅ | ❌ | ❌ |
| Dokumen pengadaan | ✅ | ✅ | ✅ | ❌ |
| Peminjaman | ✅ | ✅ | ✅ | ✅ |
| Pemindahtanganan | ✅ | ✅ | ❌ | ❌ |
| Manajemen pengguna | ✅ | ✅ | ❌ | ❌ |
| Export laporan | ✅ | ✅ | ❌ | ❌ |

**File yang diubah:** `auth.js`, `app.js`, semua halaman HTML

---

## FASE 3 — Laporan & Export (Prioritas Sedang)

### 3.1 Export Laporan ke Excel

**Tujuan:** Bendahara dapat mengekspor data barang, peminjaman, dan pemindahtanganan ke format Excel (.xlsx) untuk pelaporan ke dinas/instansi.

**Alur logika:**
1. Gunakan library **SheetJS (xlsx)** yang bisa diload via CDN tanpa install npm
2. Buat tombol "Export Excel" di:
   - Halaman `index.html` (export semua/filter data barang)
   - Halaman `peminjaman.html` (export daftar peminjaman)
   - Halaman `pemindahtanganan.html` (export riwayat pemindahtanganan)
3. Data diambil dari Supabase sesuai filter aktif (misalnya per tahun, per kategori)
4. Format kolom Excel disesuaikan dengan format laporan dinas

**Contoh implementasi:**
```html
<!-- Tambah di head -->
<script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>
```
```js
function exportExcel(data, namaFile) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${namaFile}.xlsx`);
}
```

**File yang diubah:** `index.html`, `peminjaman.html`, `pemindahtanganan.html` (baru), `app.js`

---

## URUTAN PENGERJAAN YANG DISARANKAN

```
FASE 1A  →  Tambah kolom penanggung_jawab di database
   ↓
FASE 1B  →  Update form tambah/edit barang (dropdown penanggung jawab)
   ↓
FASE 1C  →  Buat tabel & halaman pemindahtanganan
   ↓
FASE 2A  →  Setup sistem roles di database & auth.js
   ↓
FASE 2B  →  Implementasi akses roles operator di semua halaman
   ↓
FASE 2C  →  Implementasi akses roles bendahara pembantu
   ↓
FASE 3   →  Tambah fitur export Excel
```

---

## CATATAN TEKNIS

- **Database:** Supabase (PostgreSQL) — semua perubahan schema dibuat lewat SQL Editor Supabase
- **Auth:** Supabase Auth — roles disimpan di tabel `profil_pengguna` dan dibaca saat login
- **Storage:** Supabase Storage — untuk upload dokumen fisik pemindahtanganan
- **Frontend:** Vanilla HTML/CSS/JS — tidak ada framework, semua perubahan langsung di file HTML
- **Barcode:** JsBarcode sudah terintegrasi, tidak perlu diubah
- **RLS (Row Level Security):** Aktifkan di Supabase untuk memastikan operator/bendahara pembantu tidak bisa bypass akses lewat API langsung


---

## FASE 1D — Cetak Label Barang di barcode.html (Prioritas Tinggi)

**Tujuan:** Bendahara dapat mencetak label fisik berisi barcode dan informasi barang untuk ditempel langsung di aset, memudahkan identifikasi dan inventarisasi lapangan.

**Alur logika:**
1. Di halaman `barcode.html`, setelah barcode ditampilkan, tambahkan tombol **"Cetak Label"**
2. Klik tombol membuka tampilan print-preview khusus label yang berisi:
   - Barcode/QR code barang
   - Nama barang
   - Kode barang / nomor inventaris
   - Ruangan / lokasi barang
   - Nama instansi/unit kerja
3. Ukuran label bisa dipilih pengguna:
   - **Label kecil** (5 × 3 cm) — hanya barcode + kode barang
   - **Label sedang** (8 × 4 cm) — barcode + nama + kode
   - **Label penuh** (10 × 6 cm) — semua informasi
4. Gunakan `window.print()` dengan CSS `@media print` khusus untuk layout label
5. Semua elemen halaman lain disembunyikan saat print, hanya label yang tampil
6. Tambahkan opsi **"Cetak Semua Barang"** — generate satu halaman berisi banyak label (misal 8 label per halaman A4) untuk cetak massal

**Contoh implementasi CSS print:**
```css
@media print {
  body * { visibility: hidden; }
  #area-label, #area-label * { visibility: visible; }
  #area-label {
    position: absolute;
    top: 0;
    left: 0;
    width: 8cm;
    height: 4cm;
    border: 1px solid #000;
    padding: 4px;
    font-size: 10pt;
  }
}
```

**Contoh implementasi HTML label:**
```html
<div id="area-label">
  <p class="instansi">PEMERINTAH KABUPATEN BOGOR</p>
  <svg id="barcode-label"></svg>
  <p class="nama-barang">Laptop Lenovo ThinkPad</p>
  <p class="kode-barang">Kode: INV-2024-001</p>
  <p class="lokasi">Ruang: Subbag Umum</p>
</div>
<button onclick="window.print()">Cetak Label</button>
```

**Contoh cetak massal (banyak label per halaman):**
```js
// Ambil semua barang dari Supabase, generate grid label
async function cetakSemuaLabel() {
  const { data } = await supabase.from('barang').select('*');
  const container = document.getElementById('area-cetak-massal');
  container.innerHTML = '';
  data.forEach(barang => {
    const label = buatLabel(barang); // return elemen HTML label
    container.appendChild(label);
  });
  window.print();
}
```

**File yang diubah:** `barcode.html`

**Dependensi:** JsBarcode sudah tersedia (`JsBarcode.all.min.js`), tidak perlu library tambahan

**Urutan langkah pengerjaan:**
1. Buat div `#area-label` di `barcode.html` dengan layout label
2. Tambahkan CSS `@media print` untuk menyembunyikan elemen selain label
3. Tambahkan tombol "Cetak Label" yang memicu `window.print()`
4. Tambahkan pilihan ukuran label (radio button / dropdown)
5. Buat fungsi cetak massal dengan layout grid CSS untuk layout multi-label per halaman A4
