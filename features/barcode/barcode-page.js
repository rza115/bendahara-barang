// =============================================
// barcode-page.js — UI logic halaman barcode
// =============================================

window.initBarcodePage = async function () {
  const ready = await window._appReady;
  if (!ready) return;
  db = window._authClient;

  const SKPD = 'Kecamatan Tenjo';
  let semuaAset = [];
  let selectedIds = new Set();

  // Set tahun default = tahun berjalan
  document.getElementById('opt-tahun').value = new Date().getFullYear();

  // ── LOAD ASET ──────────────────────────────────────
  async function loadAset() {
    showLoading(true);
    try {
      semuaAset = await fetchAsetBarcode();
      renderList(semuaAset);
    } catch (err) {
      showAlert('Gagal memuat data: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── RENDER LIST ────────────────────────────────────
  function renderList(data) {
    const container = document.getElementById('aset-list');
    if (!data.length) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8">📭 Tidak ada aset ditemukan.</div>';
      return;
    }
    container.innerHTML = data.map(a => `
      <div class="aset-item ${selectedIds.has(a.id) ? 'selected' : ''}"
           data-id="${a.id}" onclick="toggleItem('${a.id}')">
        <input type="checkbox" ${selectedIds.has(a.id) ? 'checked' : ''}
               onclick="event.stopPropagation();toggleItem('${a.id}')">
        <div class="aset-item-info">
          <div class="aset-item-nama">${escH(a.nama_barang)}</div>
          <div class="aset-item-meta">${a.kode_barang || '—'} · ID: ${a.id_barang || '—'} · ${a.tahun_perolehan || '—'}</div>
        </div>
        <span class="aset-item-kib">${a.kib || '—'}</span>
      </div>
    `).join('');
    updateCount();
  }

  window.toggleItem = function (id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    const item = document.querySelector(`.aset-item[data-id="${id}"]`);
    if (item) {
      item.classList.toggle('selected', selectedIds.has(id));
      const cb = item.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = selectedIds.has(id);
    }
    updateCount();
  };

  function updateCount() {
    document.getElementById('jumlah-dipilih').textContent = selectedIds.size;
  }

  // ── FILTER ─────────────────────────────────────────
  function applyFilter() {
    const q = document.getElementById('search-aset').value.toLowerCase();
    const kib = document.getElementById('filter-kib').value;
    const filtered = semuaAset.filter(a =>
      (!q || a.nama_barang?.toLowerCase().includes(q) || a.kode_barang?.toLowerCase().includes(q)) &&
      (!kib || a.kib === kib)
    );
    renderList(filtered);
  }

  let searchTimer;
  document.getElementById('search-aset').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(applyFilter, 300);
  });
  document.getElementById('filter-kib').addEventListener('change', applyFilter);

  document.getElementById('btn-pilih-semua').addEventListener('click', () => {
    document.querySelectorAll('.aset-item').forEach(el => selectedIds.add(el.dataset.id));
    applyFilter();
  });
  document.getElementById('btn-batal-semua').addEventListener('click', () => {
    selectedIds.clear();
    applyFilter();
  });

  // ── GENERATE KODE ──────────────────────────────────
  function getKodeValue(aset) {
    const opt = document.getElementById('opt-data-kode').value;
    const base = window.location.origin + window.location.pathname.replace('barcode.html', '');
    if (opt === 'kode' || opt === 'lengkap') {
      return `${base}public/detail.html?kode=${encodeURIComponent(aset.kode_barang || aset.id)}`;
    }
    return `${base}public/detail.html?id=${aset.id}`;
  }

  function buatQR(container, value) {
    container.innerHTML = '';
    new QRCode(container, {
      text: value,
      width: 72,
      height: 72,
      colorDark: '#1e293b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  function buatBarcode(container, value) {
    container.innerHTML = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    container.appendChild(svg);
    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        width: 1.2,
        height: 36,
        displayValue: false,
        margin: 0,
        lineColor: '#1e293b',
        background: '#ffffff',
      });
    } catch (_) {
      container.innerHTML = '<span style="font-size:9px;color:#ef4444">Kode tidak valid</span>';
    }
  }

  // ── BUILD LABEL HTML ───────────────────────────────
  function buildLabel(aset, tahun) {
    const wrap = document.createElement('div');
    wrap.className = 'label-card';
    wrap.innerHTML = `
      <div class="label-inner">
        <div class="label-col1">
          <img class="label-logo" src="../assets/images/logo-bogor.png" crossorigin="anonymous">
          <div class="label-tahun-inv">INVENTARISASI<br>BMD TAHUN<br>${tahun}</div>
        </div>
        <div class="label-col2">
          <div class="label-data">
            <div class="label-row"><span class="label-key">SKPD</span><span class="label-sep">:</span><span class="label-val">${escH(SKPD)}</span></div>
            <div class="label-row"><span class="label-key">NAMA BARANG</span><span class="label-sep">:</span><span class="label-val">${escH(aset.nama_barang || '—')}</span></div>
            <div class="label-row"><span class="label-key">KODE BARANG</span><span class="label-sep">:</span><span class="label-val">${escH(aset.kode_barang || '—')}</span></div>
            <div class="label-row"><span class="label-key">ID BARANG</span><span class="label-sep">:</span><span class="label-val">${escH(String(aset.id_barang || '—'))}</span></div>
            <div class="label-row"><span class="label-key">TAHUN PEROLEHAN</span><span class="label-sep">:</span><span class="label-val">${escH(String(aset.tahun_perolehan || '—'))}</span></div>
          </div>
          <div class="label-code-wrap" id="code-${aset.id}"></div>
        </div>
      </div>
    `;
    return wrap;
  }

  // ── GENERATE SEMUA LABEL ───────────────────────────
  document.getElementById('btn-generate').addEventListener('click', () => {
    if (selectedIds.size === 0) {
      showAlert('Pilih minimal 1 aset terlebih dahulu!', 'error');
      return;
    }
    const jenisKode = document.getElementById('opt-jenis-kode').value;
    const tahun = document.getElementById('opt-tahun').value || new Date().getFullYear();
    const grid = document.getElementById('label-grid');
    grid.innerHTML = '';

    const dipilih = semuaAset.filter(a => selectedIds.has(a.id));
    dipilih.forEach(aset => {
      const labelEl = buildLabel(aset, tahun);
      grid.appendChild(labelEl);
      const codeWrap = labelEl.querySelector(`#code-${aset.id}`);
      const kodeVal = getKodeValue(aset);
      if (jenisKode === 'qrcode') buatQR(codeWrap, kodeVal);
      else buatBarcode(codeWrap, kodeVal);
      const codeText = document.createElement('div');
      codeText.className = 'label-code-text';
      codeText.textContent = kodeVal.length > 30 ? kodeVal.substring(0, 30) + '...' : kodeVal;
      codeWrap.appendChild(codeText);
    });

    showAlert(`✅ ${dipilih.length} label berhasil digenerate!`);
    document.getElementById('label-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── CETAK ──────────────────────────────────────────
  document.getElementById('btn-print').addEventListener('click', () => {
    if (!document.getElementById('label-grid').querySelector('.label-card')) {
      showAlert('Generate label terlebih dahulu!', 'error');
      return;
    }
    window.print();
  });

  // ── DOWNLOAD PDF ───────────────────────────────────
  document.getElementById('btn-pdf').addEventListener('click', async () => {
    const grid = document.getElementById('label-grid');
    if (!grid.querySelector('.label-card')) {
      showAlert('Generate label terlebih dahulu!', 'error');
      return;
    }
    showLoading(true);
    try {
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const labels = grid.querySelectorAll('.label-card');
      const margin = 10;
      const colW = (210 - margin * 2 - 6) / 2;
      let x = margin, y = margin;
      let labelH = 0;
      for (let i = 0; i < labels.length; i++) {
        const canvas = await html2canvas(labels[i], { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const imgData = canvas.toDataURL('image/png');
        const ratio = canvas.height / canvas.width;
        const h = colW * ratio;
        if (labelH === 0) labelH = h;
        if (y + h > 297 - margin) { pdf.addPage(); y = margin; }
        pdf.addImage(imgData, 'PNG', x, y, colW, h);
        if (i % 2 === 0) { x = margin + colW + 6; }
        else { x = margin; y += h + 6; }
      }
      const tahun = document.getElementById('opt-tahun').value || new Date().getFullYear();
      pdf.save(`Label_BMD_${SKPD.replace(/\s+/g, '_')}_${tahun}.pdf`);
      showAlert('✅ PDF berhasil diunduh!');
    } catch (err) {
      showAlert('Gagal generate PDF: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  });

  // ── UTILS ──────────────────────────────────────────
  function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── INIT ───────────────────────────────────────────
  await loadAset();
};