// ============================================
// features/aset-detail/aset-detail-view.js
// Render semua field halaman detail aset
// Nama kolom DB: tanpa underscore (kodebarang, merktype, dll)
// ============================================

function renderDetail(data) {
  // Header
  const detailNama = document.getElementById('detail-nama');
  if (detailNama) detailNama.textContent = data.namabarang;

  const kibLabel = document.getElementById('detail-kib-label');
  if (kibLabel) kibLabel.textContent = getKIBLabel(data.kib);

  const btnEdit = document.getElementById('btn-edit');
  if (btnEdit) btnEdit.href = `edit.html?id=${data.id}`;

  // Foto — coba dua kemungkinan nama kolom
  const fotoWrap = document.getElementById('foto-wrap');
  const fotoUrl = data.fotourl || data.foto_url;
  if (fotoWrap) {
    fotoWrap.innerHTML = fotoUrl
      ? `<img src="${escapeHtml(fotoUrl)}" alt="Foto Barang" class="foto-box">`
      : `<div class="foto-placeholder"><span>📷</span>Tidak ada foto</div>`;
  }

  // Helper: langsung set textContent ke elemen target (bukan inject span baru)
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (v == null || v === '') {
      el.textContent = '—';
      el.classList.add('empty');
    } else {
      el.textContent = String(v);
      el.classList.remove('empty');
    }
  };

  // Data umum — nama kolom DB tanpa underscore
  set('d-kodebarang',  data.kodebarang);
  set('d-noregister',  data.noregister);
  set('d-idbarang',    data.idbarang);
  set('d-merktype',    data.merktype);
  set('d-ukurancc',    data.ukurancc);
  set('d-bahan',       data.bahan);
  set('d-jumlah',      data.jumlah);
  set('d-statusbarang',data.statusbarang);
  set('d-statusaset',  data.statusaset);
  set('d-lokasi',      data.lokasi);
  set('d-penggunaan',  data.penggunaan);
  set('d-keterangan',  data.keterangan);

  // KIB badge
  const kibEl = document.getElementById('d-kib');
  if (kibEl) {
    if (data.kib) {
      kibEl.innerHTML = `<span class="kib-badge kib-${data.kib.replace(/ /g,'-').toLowerCase()}">${escapeHtml(data.kib)}</span>`;
      kibEl.classList.remove('empty');
    } else {
      kibEl.textContent = '—';
      kibEl.classList.add('empty');
    }
  }

  // Kondisi badge
  const kondisiEl = document.getElementById('d-kondisi');
  if (kondisiEl) {
    if (data.kondisi) {
      kondisiEl.innerHTML = `<span class="badge ${getKondisiBadge(data.kondisi)}">${escapeHtml(data.kondisi)}</span>`;
      kondisiEl.classList.remove('empty');
    } else {
      kondisiEl.textContent = '—';
      kondisiEl.classList.add('empty');
    }
  }

  // Perolehan
  set('d-tahunperolehan', data.tahunperolehan);
  set('d-harga',          data.harga != null ? formatRupiah(data.harga) : null);
  set('d-caraperolehan',  data.caraperolehan);
  set('d-sumberdana',     data.sumberdana);
  set('d-tglbuku',        data.tglbuku);
  set('d-nobast',         data.nobast);
  set('d-tglbast',        data.tglbast);
  set('d-idpenerimaan',   data.idpenerimaan);

  // Tampilkan section KIB yang relevan
  ['section-kib-a','section-kib-b','section-kib-c','section-kib-e']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  const kibSectionMap = {
    'KIB A': 'section-kib-a',
    'KIB B': 'section-kib-b',
    'KIB C': 'section-kib-c',
    'KIB E': 'section-kib-e',
  };
  const activeSection = document.getElementById(kibSectionMap[data.kib]);
  if (activeSection) activeSection.style.display = 'block';

  // KIB A — Tanah
  set('d-luastanah',           data.luastanah);
  set('d-tahunperolehantanah', data.tahunperolehantanah);
  set('d-statustanah',         data.statustanah);
  set('d-letakalamat',         data.letakalamat);
  set('d-nourutsertifikat',    data.nourutsertifikat);
  set('d-nosertifikat',        data.nosertifikat);
  set('d-tglsertifikat',       data.tglsertifikat);
  set('d-penggunaantanah',     data.penggunaantanah);

  // KIB B — Kendaraan/Mesin
  set('d-nopabrik',  data.nopabrik);
  set('d-norangka',  data.norangka);
  set('d-nomesin',   data.nomesin);
  set('d-nopolisi',  data.nopolisi);
  set('d-nobpkb',    data.nobpkb);

  // KIB C — Gedung
  set('d-kondisibangunan',      data.kondisibangunan);
  set('d-luaslantai',           data.luaslantai);
  set('d-jumlahlantai',         data.jumlahlantai);
  set('d-konstruksibertingkat', data.konstruksibertingkat);
  set('d-konstruksibeton',      data.konstruksibeton);
  set('d-letakbangunan',        data.letakbangunan);
  set('d-noimb',                data.noimb);
  set('d-tglimb',               data.tglimb);
  set('d-statustanahgedung',    data.statustanahgedung);
  set('d-nokodetanah',          data.nokodetanah);
  set('d-idawaltanah',          data.idawaltanah);
  set('d-statussertifikattanah',data.statussertifikattanah);

  // KIB E — Aset Tetap Lainnya
  set('d-judulkoleksi', data.judulkoleksi);
  set('d-spesifikasi',  data.spesifikasi);
  set('d-penerbit',     data.penerbit);
  set('d-asaldaerah',   data.asaldaerah);
  set('d-bahanaset',    data.bahanaset);
  set('d-jenisaset',    data.jenisaset);
  set('d-ukuranaset',   data.ukuranaset);
  set('d-tahuncetak',   data.tahuncetak);

  // Dokumen pengadaan
  const DOK_LABELS_LOCAL = {
    dokspkurl:        'SPK / Surat Pesanan',
    dokpenawaranurl:  'Surat Penawaran',
    dokbaphpurl:      'BAPHP',
    dokbasturl:       'BAST',
    dokkuitansiurl:   'Kuitansi',
  };
  const dokGrid    = document.getElementById('dokumen-grid');
  const dokSection = document.getElementById('section-dokumen');
  if (dokGrid && dokSection) {
    const items = Object.entries(DOK_LABELS_LOCAL)
      .filter(([key]) => data[key])
      .map(([key, label]) => {
        const url = data[key];
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
        const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
        const preview = isImage
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" class="dok-img">`
          : `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="dok-link">
               <span>📎</span><span>${escapeHtml(fileName)}</span>
             </a>`;
        return `<div class="detail-item">
                  <span class="detail-label">${escapeHtml(label)}</span>
                  ${preview}
                </div>`;
      });
    if (items.length) {
      dokGrid.innerHTML = items.join('');
      dokSection.style.display = 'block';
    }
  }

  // Penanggung jawab
  if (data.penanggungjawabid) {
    db.from('penanggungjawab')
      .select('nama, jabatan')
      .eq('id', data.penanggungjawabid)
      .single()
      .then(({ data: pj }) => {
        if (pj) {
          set('d-penanggungjawab', pj.nama);
          set('d-pj-jabatan', pj.jabatan);
        }
      })
      .catch(() => {});
  } else if (data.namapenanggungjawab) {
    set('d-penanggungjawab', data.namapenanggungjawab);
  }

  // Tampilkan konten utama
  const content = document.getElementById('detail-content');
  if (content) content.style.display = 'block';
}
