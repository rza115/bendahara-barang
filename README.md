# 📦 Inventaris Barang — Kecamatan Tenjo

Aplikasi web pencatatan inventaris aset tetap (KIB) berbasis HTML + Supabase.

---

## 🗂️ Struktur File

```
bendahara-barang/
├── index.html          ← Daftar semua aset + statistik + filter
├── tambah.html         ← Form tambah aset baru
├── edit.html           ← Form edit aset (via ?id=...)
├── style.css           ← Tampilan (no framework, pure CSS)
├── app.js              ← Logika CRUD ke Supabase
├── supabase_schema.sql ← SQL schema + data awal
└── README.md           ← Panduan ini
```

---

## 🚀 Cara Setup (Langkah per Langkah)

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → New Project
2. Isi nama project: `inventaris-tenjo`
3. Set password database (simpan!)
4. Tunggu project siap (~1 menit)

### 2. Buat Tabel di Supabase
1. Masuk ke **SQL Editor** di dashboard Supabase
2. Copy-paste isi file `supabase_schema.sql`
3. Klik **Run** → tunggu selesai
4. Cek di **Table Editor** → tabel `aset` sudah terbuat dengan data awal

### 3. Ambil API Keys
1. Di dashboard Supabase → **Settings → API**
2. Copy:
   - `Project URL` (contoh: `https://abcxyz.supabase.co`)
   - `anon / public` key (panjang, dimulai `eyJ...`)

### 4. Pasang API Keys ke app.js
Buka `app.js`, ubah baris di atas:
```javascript
const SUPABASE_URL = 'https://XXXXXXXXXXXXXXXX.supabase.co';  // ← ganti ini
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXXXXXX'; // ← ganti ini
```

### 5. Upload ke GitHub
```bash
# Buat repo baru di github.com dulu, lalu:
git init
git add .
git commit -m "Initial commit: Inventaris Kecamatan Tenjo"
git remote add origin https://github.com/USERNAME/inventaris-tenjo.git
git push -u origin main
```

### 6. Deploy ke Vercel
1. Buka [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo GitHub yang baru dibuat
3. **Framework Preset**: Other (biarkan default)
4. Klik **Deploy**
5. Selesai! URL langsung bisa diakses

---

## ✅ Fitur Aplikasi

| Fitur | Keterangan |
|-------|-----------|
| 📊 Dashboard Stats | Total aset, nilai, per KIB |
| 🔍 Pencarian | Cari nama barang real-time |
| 🏷️ Filter KIB | Filter per kategori (A/B/C/E) |
| 🎨 Filter Kondisi | Baik / Rusak Ringan / Rusak Berat |
| ➕ Tambah Aset | Form lengkap, field dinamis per KIB |
| ✏️ Edit Aset | Edit data aset yang sudah ada |
| 🗑️ Hapus Aset | Dengan konfirmasi sebelum hapus |
| 📱 Responsive | Bisa diakses dari HP |

---

## 📋 Kategori KIB

| KIB | Nama | Contoh |
|-----|------|--------|
| KIB A | Aset Tetap Tanah | Tanah Kantor |
| KIB B | Peralatan dan Mesin | Motor, Mobil, AC, Meja |
| KIB C | Gedung dan Bangunan | Gedung Kantor |
| KIB E | Aset Tetap Lainnya | Buku, Hewan Ternak |

---

## 🔐 Keamanan (Opsional)

Untuk akses internal kantor (tanpa login), RLS Supabase bisa dibiarkan off.

Jika ingin tambah autentikasi di masa depan:
1. Aktifkan RLS di Supabase
2. Tambah Supabase Auth (email/password)
3. Update `app.js` untuk handle session

---

## 🛠️ Teknologi

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (gratis)
- **Version Control**: GitHub

---

*Dibuat untuk Kecamatan Tenjo, Kabupaten Bogor — 2025*
