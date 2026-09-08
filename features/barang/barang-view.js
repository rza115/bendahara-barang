// ============================================
// features/barang/barang-view.js
// Render tabel daftar barang dan statistik ringkas
// ============================================

function renderTable(data) {
  const tbody = document.getElementById('aset-tbody');
  if (!tbody) return;
  initAsetPreview(tbody, data || []);

  if (!data?.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div><span class="material-symbols-rounded" aria-hidden="true">inventory_2</span></div>
          <p>Belum ada data aset. <a href="tambah.html">Tambah aset pertama</a></p>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = data.map((row, i) => `
    <tr class="row-clickable" data-id="${row.id}" style="cursor:pointer" title="Klik untuk lihat detail">
      <td class="td-no">${i + 1}</td>
      <td class="td-foto">
        ${row.foto_url
          ? `<img src="${escapeHtml(row.foto_url)}" alt="" class="table-aset-photo" loading="lazy">`
          : ''}
      </td>
      <td>
        <div class="nama-barang">${escapeHtml(row.nama_barang)}</div>
        ${row.merk_type   ? `<div class="sub-info">${escapeHtml(row.merk_type)}</div>`   : ''}
        ${row.kode_barang ? `<div class="kode-info">${escapeHtml(row.kode_barang)}</div>` : ''}
        ${row.id_barang !== null && row.id_barang !== undefined && row.id_barang !== ''
          ? `<div class="kode-info">ID: ${escapeHtml(String(row.id_barang))}</div>`
          : ''}
      </td>
      <td>
        <span class="kib-badge kib-${row.kib?.replace(/ /g, '-').toLowerCase()}">
          ${escapeHtml(row.kib)}
        </span>
      </td>
      <td>${row.tahun_perolehan || '-'}</td>
      <td class="td-harga">${formatRupiah(row.harga)}</td>
      <td>
        ${row.kondisi
          ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${escapeHtml(row.kondisi)}</span>`
          : '-'}
      </td>
      <td>${escapeHtml(row.lokasi) || '-'}</td>
      <td class="td-action">
        <a href="detail.html?id=${row.id}" class="btn-edit" title="" data-preview-index="${i}" aria-label="Lihat detail ${escapeHtml(row.nama_barang)}" aria-haspopup="dialog" aria-controls="aset-preview" aria-expanded="false"
           onclick="event.stopPropagation()"><span class="material-symbols-rounded" aria-hidden="true">visibility</span></a>
        <a href="edit.html?id=${row.id}" class="btn-edit" title="Edit aset" aria-label="Edit aset"
           onclick="event.stopPropagation()"><span class="material-symbols-rounded" aria-hidden="true">edit</span></a>
        <button class="btn-hapus" title="Pindahkan ke Trash" aria-label="Pindahkan ke Trash"
          data-action="trash" data-id="${row.id}" data-name="${escapeHtml(row.nama_barang)}"><span class="material-symbols-rounded" aria-hidden="true">delete</span></button>
      </td>
    </tr>`).join('');

  // Klik baris → buka detail (hanya jika bukan klik pada tombol aksi)
  tbody.onclick = e => {
    const trashButton = e.target.closest('[data-action="trash"]');
    if (trashButton) {
      hapusAsetHandler(trashButton.dataset.id, trashButton.dataset.name);
      return;
    }
    if (e.target.closest('.btn-hapus, .btn-edit, a')) return;
    const row = e.target.closest('.row-clickable');
    if (row) window.location.href = `detail.html?id=${row.dataset.id}`;
  };
}

// Satu kartu di body agar tidak terpotong oleh area tabel yang bisa di-scroll.
let asetPreviewController;

function initAsetPreview(tbody, data) {
  if (!asetPreviewController) {
    const panel = document.createElement('section');
    panel.id = 'aset-preview';
    panel.className = 'aset-preview';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-labelledby', 'aset-preview-title');
    document.body.appendChild(panel);

    let rows = [];
    let activeTrigger = null;
    let openTimer;
    let closeTimer;

    function hide() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      activeTrigger?.setAttribute('aria-expanded', 'false');
      activeTrigger = null;
      panel.hidden = true;
    }

    function keepOpen() {
      clearTimeout(closeTimer);
    }

    function scheduleClose() {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (panel.matches(':hover') || panel.contains(document.activeElement) ||
            activeTrigger === document.activeElement || activeTrigger?.matches(':hover')) return;
        hide();
      }, 180);
    }

    function position() {
      const rect = activeTrigger.getBoundingClientRect();
      const margin = 12;
      const gap = 8;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = rect.left - width - gap >= margin
        ? rect.left - width - gap
        : Math.max(margin, Math.min(rect.right + gap, window.innerWidth - width - margin));
      panel.style.left = `${left}px`;
      panel.style.top = `${Math.max(margin, Math.min(rect.top - 24, window.innerHeight - height - margin))}px`;
    }

    function show(trigger) {
      clearTimeout(openTimer);
      keepOpen();
      if (activeTrigger === trigger && !panel.hidden) return;
      const row = rows[Number(trigger.dataset.previewIndex)];
      if (!row) return;
      activeTrigger?.setAttribute('aria-expanded', 'false');
      activeTrigger = trigger;
      const value = v => escapeHtml(v == null || v === '' ? '-' : String(v));
      const fields = [
        ['ID Barang', row.id_barang], ['Kode Barang', row.kode_barang],
        ['Merk / Tipe', row.merk_type], ['Tahun Perolehan', row.tahun_perolehan],
        ['Nilai Perolehan', formatRupiah(row.harga)], ['Jumlah', row.jumlah],
        ['Lokasi', row.lokasi], ['Penggunaan', row.penggunaan],
        ['Penanggung Jawab', row.penanggung_jawab?.nama || row.nama_penanggung_jawab],
      ];
      panel.innerHTML = `
        <div class="aset-preview-heading">
          <span>Ringkasan Aset</span>
          <button type="button" class="aset-preview-close" aria-label="Tutup ringkasan"><span class="material-symbols-rounded" aria-hidden="true">close</span></button>
        </div>
        <div class="aset-preview-intro">
          ${row.foto_url ? `<img class="aset-preview-photo" src="${escapeHtml(row.foto_url)}" alt="Foto aset">`
            : '<div class="aset-preview-photo aset-preview-placeholder"><span class="material-symbols-rounded" aria-hidden="true">inventory_2</span></div>'}
          <div><h2 id="aset-preview-title">${value(row.nama_barang)}</h2>
            <p>${value(getKIBLabel(row.kib))}</p>
            ${row.kondisi ? `<span class="badge ${getKondisiBadge(row.kondisi)}">${value(row.kondisi)}</span>` : ''}
          </div>
        </div>
        <dl class="aset-preview-fields">${fields.map(([label, v]) => `<div><dt>${label}</dt><dd>${value(v)}</dd></div>`).join('')}</dl>
        <a class="aset-preview-link" href="detail.html?id=${encodeURIComponent(row.id)}">Buka detail lengkap <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span></a>`;
      panel.querySelector('.aset-preview-close').onclick = () => {
        const triggerToRestore = activeTrigger;
        triggerToRestore?.focus();
        hide();
      };
      const photo = panel.querySelector('img');
      if (photo) photo.onerror = () => { photo.hidden = true; };
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
    }

    tbody.addEventListener('pointerover', event => {
      if (event.pointerType === 'touch') return;
      const trigger = event.target.closest('[data-preview-index]');
      if (!trigger || trigger.contains(event.relatedTarget)) return;
      keepOpen();
      clearTimeout(openTimer);
      openTimer = setTimeout(() => show(trigger), 220);
    });
    tbody.addEventListener('pointerout', event => {
      const trigger = event.target.closest('[data-preview-index]');
      if (trigger && !trigger.contains(event.relatedTarget)) scheduleClose();
    });
    tbody.addEventListener('focusin', event => {
      const trigger = event.target.closest('[data-preview-index]');
      if (trigger) show(trigger);
    });
    tbody.addEventListener('focusout', scheduleClose);
    tbody.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' && event.target.closest('[data-preview-index]')) {
        event.preventDefault();
        show(event.target.closest('[data-preview-index]'));
        panel.querySelector('.aset-preview-close').focus();
      }
    });
    panel.addEventListener('pointerenter', keepOpen);
    panel.addEventListener('pointerleave', scheduleClose);
    panel.addEventListener('focusin', keepOpen);
    panel.addEventListener('focusout', scheduleClose);
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        if (panel.contains(document.activeElement)) activeTrigger?.focus();
        hide();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!panel.contains(event.target) && !event.target.closest('[data-preview-index]')) hide();
    });
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', event => {
      if (!panel.contains(event.target)) hide();
    }, true);
    asetPreviewController = nextRows => { hide(); rows = nextRows; };
  }
  asetPreviewController(data);
}

function updateSummary(data) {
  if (!data) return;
  const totalNilai = data.reduce((s, r) => s + (parseInt(r.harga) || 0), 0);
  const perKIB = { 'KIB A': 0, 'KIB B': 0, 'KIB C': 0, 'KIB E': 0 };
  data.forEach(r => { if (r.kib in perKIB) perKIB[r.kib]++; });

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setText('total-aset',  data.length);
  setText('total-nilai', formatRupiah(totalNilai));
  setText('total-kib-a', perKIB['KIB A']);
  setText('total-kib-b', perKIB['KIB B']);
  setText('total-kib-c', perKIB['KIB C']);
  setText('total-kib-e', perKIB['KIB E']);
}
