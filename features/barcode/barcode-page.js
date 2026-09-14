// =============================================
// barcode-page.js — UI logic halaman barcode
// =============================================

window.initBarcodePage = async function () {
  const ready = await window._appReady;
  if (!ready) return;
  db = window._authClient;

  const SKPD = 'Dinas Kebudayaan';
  const layout = window.BarcodeLayout;
  const PAGE_MARGIN = layout.margin;
  let semuaAset = [];
  let selectedIds = new Set();

  function getPaperSize() {
    return layout.layout(document.getElementById('opt-kertas').value);
  }

  function applyPaperSize() {
    const paper = getPaperSize();
    let printStyle = document.getElementById('barcode-print-page-style');
    if (!printStyle) {
      printStyle = document.createElement('style');
      printStyle.id = 'barcode-print-page-style';
      document.head.appendChild(printStyle);
    }
    printStyle.textContent = `@media print {
      @page { size: ${paper.width}mm ${paper.height}mm; margin: ${PAGE_MARGIN}mm; }
      #print-area { width: ${paper.width - (PAGE_MARGIN * 2)}mm; }
    }`;
    const root = document.documentElement.style;
    root.setProperty('--label-width', `${layout.label.width}mm`);
    root.setProperty('--label-height', `${layout.label.height}mm`);
    root.setProperty('--label-qr', `${layout.label.qr}mm`);
    root.setProperty('--label-gap', `${layout.gap}mm`);
    root.setProperty('--barcode-columns', paper.columns);
    paginateLabels();
  }

  function paginateLabels() {
    const grid = document.getElementById('label-grid');
    const labels = [...grid.querySelectorAll('.label-card')];
    if (!labels.length) return;
    const paper = getPaperSize();
    grid.replaceChildren();
    let sheet;
    labels.forEach((label, i) => {
      if (i % paper.capacity === 0) {
        sheet = document.createElement('div');
        sheet.className = 'label-sheet';
        grid.appendChild(sheet);
      }
      sheet.appendChild(label);
    });
  }

  // Set tahun default = tahun berjalan
  document.getElementById('opt-tahun').value = new Date().getFullYear();

  function syncKodeOptions() {
    const isBpkad = document.getElementById('opt-jenis-kode').value === 'bpkad';
    document.getElementById('group-data-kode').hidden = isBpkad;
    document.getElementById('sep-data-kode').hidden = isBpkad;
  }

  document.getElementById('opt-jenis-kode').addEventListener('change', syncKodeOptions);
  document.getElementById('opt-kertas').addEventListener('change', applyPaperSize);
  syncKodeOptions();
  applyPaperSize();

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
      container.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded" aria-hidden="true">inventory_2</span><p>Tidak ada aset ditemukan.</p></div>';
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
    const q = document.getElementById('search-aset').value.trim().toLowerCase();
    const kib = document.getElementById('filter-kib').value;
    const filtered = semuaAset.filter(a =>
      (!q || [a.nama_barang, a.kode_barang, a.id_barang].some(value =>
        String(value ?? '').toLowerCase().includes(q)
      )) &&
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
    const base = window.location.origin + '/general/view.html';
    if (opt === 'kode' || opt === 'lengkap') {
      return `${base}?kode=${encodeURIComponent(aset.kode_barang || aset.id)}`;
    }
    return `${base}?id=${aset.id}`;
  }

  function buatQR(container, value) {
    container.innerHTML = '';
    const qr = new QRCode(container, {
      text: value,
      width: 336,
      height: 336,
      colorDark: '#1e293b',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
    // qrcodejs omits the quiet zone; reserve four modules on every side.
    const modules = qr._oQRCode.getModuleCount();
    container.style.setProperty('--qr-padding', `${layout.label.qr * 4 / (modules + 8)}mm`);
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
  function buildBpkadLabel(aset, tahun) {
    const wrap = document.createElement('div');
    wrap.className = 'label-card bpkad-label-card';
    wrap.innerHTML = `
      <div class="bpkad-label-inner">
        <div class="bpkad-brand">
          <img class="bpkad-logo" src="../assets/images/logo-bogor.png" crossorigin="anonymous" alt="Lambang Kabupaten Bogor">
          <div class="bpkad-inventory">INVENTARISASI<br>BMD ${escH(tahun)}</div>
        </div>
        <div class="bpkad-details">
          <div class="bpkad-row"><span class="bpkad-key">SKPD</span><span>:</span><span class="bpkad-value">${escH(SKPD).toUpperCase()}</span></div>
          <div class="bpkad-row"><span class="bpkad-key">NAMA BARANG</span><span>:</span><span class="bpkad-value">${escH(aset.nama_barang || '—')}</span></div>
          <div class="bpkad-row"><span class="bpkad-key">KODE BARANG</span><span>:</span><span class="bpkad-value">${escH(aset.kode_barang || '—')}</span></div>
          <div class="bpkad-row"><span class="bpkad-key">ID BARANG</span><span>:</span><span class="bpkad-value">${escH(String(aset.id_barang || '—'))}</span></div>
          <div class="bpkad-row"><span class="bpkad-key">TAHUN PEROLEHAN</span><span>:</span><span class="bpkad-value">${escH(String(aset.tahun_perolehan || '—'))}</span></div>
        </div>
      </div>
    `;
    return wrap;
  }

  function buildLabel(aset, tahun, jenisKode) {
    if (jenisKode === 'bpkad') return buildBpkadLabel(aset, tahun);

    const wrap = document.createElement('div');
    wrap.className = `label-card ${jenisKode === 'qrcode' ? 'qr-label-card' : 'barcode-label-card'}`;
    wrap.innerHTML = `
      <div class="label-inner">
        <div class="label-col1">
          <img class="label-logo" src="../assets/images/logo-bogor.png" crossorigin="anonymous">
          <div class="label-tahun-inv">INVENTARISASI<br>BMD TAHUN<br>${escH(tahun)}</div>
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
    if (jenisKode === 'qrcode') {
      wrap.querySelector('.label-col1').appendChild(wrap.querySelector('.label-code-wrap'));
    }
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
      const labelEl = buildLabel(aset, tahun, jenisKode);
      grid.appendChild(labelEl);

      if (jenisKode === 'bpkad') return;

      const codeWrap = labelEl.querySelector(`#code-${aset.id}`);
      const kodeVal = getKodeValue(aset);
      if (jenisKode === 'qrcode') buatQR(codeWrap, kodeVal);
      else buatBarcode(codeWrap, kodeVal);
      if (jenisKode === 'qrcode') return;
      const codeText = document.createElement('div');
      codeText.className = 'label-code-text';
      codeText.textContent = kodeVal.length > 30 ? kodeVal.substring(0, 30) + '...' : kodeVal;
      codeWrap.appendChild(codeText);
    });

    paginateLabels();

    showAlert(`${dipilih.length} label berhasil dibuat!`);
    document.getElementById('label-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── CETAK ──────────────────────────────────────────
  async function prepareLabels() {
    await document.fonts.ready;
    const grid = document.getElementById('label-grid');
    await Promise.all([...grid.querySelectorAll('img')].map(img => {
      if (img.complete) {
        if (!img.naturalWidth) throw new Error('Gambar label gagal dimuat. Coba generate ulang.');
        return Promise.resolve();
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Waktu muat gambar habis. Coba lagi.')), 10000);
        img.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
        img.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Gambar label gagal dimuat.')); }, { once: true });
      });
    }));
    for (const el of grid.querySelectorAll('.label-card, .label-col2, .label-data, .bpkad-details, .label-val, .bpkad-value')) {
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1) {
        throw new Error('Teks melebihi label 90 × 45 mm. Periksa nama/kode barang yang terlalu panjang sebelum mencetak.');
      }
    }
  }

  document.getElementById('btn-print').addEventListener('click', async () => {
    if (!document.getElementById('label-grid').querySelector('.label-card')) {
      showAlert('Generate label terlebih dahulu!', 'error');
      return;
    }
    try {
      await prepareLabels();
      window.print();
    } catch (err) {
      showAlert(err.message, 'error');
    }
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
      await prepareLabels();
      const { jsPDF } = window.jspdf;
      const paper = getPaperSize();
      const pdf = new jsPDF({ orientation: paper.orientation, unit: 'mm', format: paper.pdfFormat, compress: true });
      const labels = grid.querySelectorAll('.label-card');
      for (let i = 0; i < labels.length; i++) {
        const canvas = await html2canvas(labels[i], {
          scale: 4, useCORS: true, backgroundColor: '#fff',
          windowWidth: 1600, windowHeight: 1000,
          onclone: (doc) => {
            // Isolate the export target from scroll containers and responsive UI.
            const target = doc.querySelectorAll('#label-grid .label-card')[i];
            doc.body.replaceChildren(target);
            doc.body.style.cssText = 'margin:0;padding:0;display:block;';
            target.style.cssText = 'position:absolute;left:0;top:0;margin:0;';
          },
        });
        const imgData = canvas.toDataURL('image/png');
        const pos = layout.position(i, paper);
        if (i > 0 && i % paper.capacity === 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', pos.x, pos.y, layout.label.width, layout.label.height, undefined, 'FAST');
      }
      const tahun = document.getElementById('opt-tahun').value || new Date().getFullYear();
      const jenisKode = document.getElementById('opt-jenis-kode').value;
      const namaFile = jenisKode === 'bpkad' ? 'Label_Identitas_BPKAD' : 'Label_BMD';
      pdf.save(`${namaFile}_${SKPD.replace(/\s+/g, '_')}_${tahun}_${paper.label.replace('/', '-')}.pdf`);
      showAlert('PDF berhasil diunduh!');
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
