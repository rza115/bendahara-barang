# Panduan Lengkap: Implementasi Fitur Foto Barang

## Status Saat Ini

✅ **Sudah Selesai:**
- `tambah.html` - Form upload foto sudah ada
- `edit.html` - Form edit dengan preview foto existing

⚠️ **Perlu Dikerjakan:**
- Setup Supabase Storage & Database
- Update `app.js` dengan kode di bawah

---

## LANGKAH 1: Setup Supabase

### A. Buat Storage Bucket

1. Buka Supabase Dashboard → **Storage**
2. Klik **New bucket**
3. Nama: `foto-barang`
4. Public: **YES** ✅
5. Create

### B. Set Storage Policy (SQL Editor)

```sql
CREATE POLICY "Public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'foto-barang');

CREATE POLICY "Auth upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foto-barang' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foto-barang' AND auth.role() = 'authenticated');
```

### C. Tambah Kolom foto_url (SQL Editor)

```sql
ALTER TABLE aset ADD COLUMN foto_url TEXT;
```

---

## LANGKAH 2: Update app.js

Buka file `app.js` di VS Code atau editor lain.

### KODE 1: Fungsi Upload Foto
**Tambahkan setelah baris 6** (`let db = null;`):

```javascript
// FOTO BARANG - Upload ke Supabase Storage
let _fotoHapus = false;

async function uploadFoto(file) {
  const ext = file.name.split('.').pop();
  const fileName = `barang_${Date.now()}.${ext}`;
  const { data, error } = await db.storage
    .from('foto-barang')
    .upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: urlData } = db.storage.from('foto-barang').getPublicUrl(fileName);
  return urlData.publicUrl;
}

async function hapusFotoStorage(url) {
  if (!url) return;
  try {
    const path = url.split('/foto-barang/')[1];
    if (path) await db.storage.from('foto-barang').remove([path]);
  } catch (_) {}
}

function initFotoUpload(existingUrl = null) {
  const fileInput = document.getElementById('foto_file');
  const previewWrap = document.getElementById('foto-preview-wrap');
  const previewImg = document.getElementById('foto-preview');
  const existingWrap = document.getElementById('foto-existing-wrap');
  const existingImg = document.getElementById('foto-existing');
  const btnHapus = document.getElementById('btn-hapus-foto');
  _fotoHapus = false;

  if (existingUrl && existingImg) {
    existingImg.src = existingUrl;
    if (existingWrap) existingWrap.style.display = 'block';
  }

  fileInput?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran foto melebihi 2 MB!', 'error');
      this.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      if (previewImg) previewImg.src = e.target.result;
      if (previewWrap) previewWrap.style.display = 'block';
      if (existingWrap) existingWrap.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  btnHapus?.addEventListener('click', function () {
    _fotoHapus = true;
    if (existingWrap) existingWrap.style.display = 'none';
    if (previewWrap) previewWrap.style.display = 'none';
    if (fileInput) fileInput.value = '';
  });
}
```

---

### KODE 2: Update Fungsi simpanAset
**GANTI fungsi `simpanAset` yang ada** (sekitar baris 250) dengan:

```javascript
async function simpanAset(isEdit = false, id = null) {
  const data = getFormData();
  
  if (!data.nama_barang) {
    showAlert('Nama barang wajib diisi!', 'error');
    return;
  }
  if (!data.kib) {
    showAlert('Kategori KIB wajib dipilih!', 'error');
    return;
  }

  showLoading(true);
  try {
    const fotoInput = document.getElementById('foto_file');
    const fotoFile = fotoInput?.files?.[0];
    
    if (fotoFile) {
      try {
        data.foto_url = await uploadFoto(fotoFile);
      } catch (err) {
        showAlert('Gagal upload foto: ' + err.message, 'error');
        showLoading(false);
        return;
      }
    } else if (isEdit && _fotoHapus) {
      const existingImg = document.getElementById('foto-existing');
      if (existingImg?.src) await hapusFotoStorage(existingImg.src);
      data.foto_url = null;
    }

    let error;
    if (isEdit && id) {
      ({ error } = await db.from('aset').update(data).eq('id', id));
    } else {
      ({ error } = await db.from('aset').insert(data));
    }
    if (error) throw error;
    showAlert(isEdit ? 'Aset berhasil diperbarui!' : 'Aset berhasil ditambahkan!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (err) {
    showAlert('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}
```

---

### KODE 3: Update Fungsi renderTable
**GANTI fungsi `renderTable`** (sekitar baris 90) dengan:

```javascript
function renderTable(data) {
  const tbody = document.getElementById('aset-tbody');
  if (!tbody) return;
  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
      <div>📭</div>
      <p>Belum ada data aset. <a href="tambah.html">Tambah aset pertama</a></p>
      </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((row, i) => `
    <tr>
      <td class="td-no">${i + 1}</td>
      <td>
        ${row.foto_url ? `<img src="${escapeHtml(row.foto_url)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;margin-right:8px;vertical-align:middle;">` : ''}
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.merk_type ? `<div class="sub-info">${escapeHtml(row.merk_type)}</div>` : ''}
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
      </td>
      <td><span class="kib-badge kib-${row.kib.replace(' ', '-').toLowerCase()}">${escapeHtml(row.kib)}</span></td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td class="td-harga">${formatRupiah(row.harga)}</td>
      <td>${row.kondisi ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${escapeHtml(row.kondisi)}</span>` : '-'}</td>
      <td>${escapeHtml(row.lokasi || row.penggunaan || '-')}</td>
      <td class="td-action">
        <a href="edit.html?id=${row.id}" class="btn-edit" title="Edit">✏️</a>
        <button class="btn-hapus" data-id="${row.id}" data-nama="${escapeHtml(row.nama_barang)}" title="Hapus">🗑️</button>
      </td>
    </tr>
  `).join('');
  tbody.onclick = (e) => {
    const btn = e.target.closest('.btn-hapus');
    if (!btn) return;
    hapusAset(btn.dataset.id, btn.dataset.nama);
  };
}
```

---

### KODE 4: Update Init Pages
**Cari bagian init** (sekitar baris 400-420) dan **UPDATE**:

```javascript
// Page: tambah
if (page === 'tambah') {
  document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
  initHargaFormat();
  initFotoUpload(); // ← TAMBAHKAN INI
  toggleKIBFields();
  document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(false));
}

// Page: edit
if (page === 'edit') {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'index.html'; return; }
  showLoading(true);
  try {
    const data = await loadAsetById(id);
    fillForm(data);
    initHargaFormat();
    initFotoUpload(data.foto_url); // ← TAMBAHKAN INI
    document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
    document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(true, id));
  } catch (err) {
    showAlert('Data tidak ditemukan', 'error');
  } finally {
    showLoading(false);
  }
}
```

---

## SELESAI! 🎉

Sekarang fitur foto barang sudah berfungsi:
- Upload foto saat tambah aset ✅
- Preview & edit foto saat update aset ✅
- Hapus foto dari storage ✅
- Tampilkan thumbnail di tabel index ✅

**Testing:**
1. Tambah aset baru dengan foto
2. Lihat thumbnail muncul di tabel
3. Edit aset → ganti/hapus foto
4. Pastikan foto lama terhapus dari storage
