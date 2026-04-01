// ============================================
// features/aset-form/aset-form-page.js
// Controller halaman tambah & edit aset
// ============================================

async function simpanAset(isEdit = false, id = null) {
  const data = getFormData();

  if (!data.nama_barang) { showAlert('Nama barang wajib diisi!', 'error'); return; }
  if (!data.kib)         { showAlert('Kategori KIB wajib dipilih!', 'error'); return; }

  showLoading(true);
  try {
    // ── Foto ──────────────────────────────────────────────
    const fotoFile = document.getElementById('foto_file')?.files?.[0];
    if (fotoFile) {
      try { data.foto_url = await uploadFoto(fotoFile); }
      catch (err) { showAlert('Gagal upload foto: ' + err.message, 'error'); return; }
    } else if (isEdit && isFotoHapus()) {
      const existingImg = document.getElementById('foto-existing');
      if (existingImg?.src) await hapusFotoStorage(existingImg.src);
      data.foto_url = null;
    }

    // ── Dokumen pengadaan ─────────────────────────────────
    const uploaded = getUploadedDokumen();
    for (const [key, file] of Object.entries(uploaded)) {
      if (file === null) {
        data[key] = null;
      } else if (file instanceof File) {
        try { data[key] = await uploadDokumen(file, key.replace('_url', '')); }
        catch (err) { showAlert('Gagal upload dokumen: ' + err.message, 'error'); return; }
      }
    }

    // ── Simpan ke Supabase ────────────────────────────────
    const asetId = await saveAset(isEdit, id, data);

    // ── Upload dokumen PJ (setelah aset tersimpan) ────────
    await uploadDokumenPJ(asetId);

    showAlert(isEdit ? 'Aset berhasil diperbarui!' : 'Aset berhasil ditambahkan!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (err) {
    showAlert('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function initTambahPage() {
  await loadPenanggungJawabDropdown();
  initFotoUpload();
  initDokumenUpload();
  initHargaFormat();
  document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
  document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(false));
}

async function initEditPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { showAlert('ID aset tidak ditemukan.', 'error'); return; }

  showLoading(true);
  try {
    const data = await fetchAsetById(id);
    await loadPenanggungJawabDropdown(data.penanggungjawab_id);
    fillForm(data);
    initFotoUpload(data.foto_url);
    initDokumenPreview(data);
    initDokumenUpload();
    initHargaFormat();
    await loadDokumenPJExisting(id);
    document.getElementById('kib')?.addEventListener('change', toggleKIBFields);
    document.getElementById('btn-simpan')?.addEventListener('click', () => simpanAset(true, id));
  } catch (err) {
    showAlert('Gagal memuat data aset: ' + err.message, 'error');
  } finally {
    showLoading(false);
  }
}
