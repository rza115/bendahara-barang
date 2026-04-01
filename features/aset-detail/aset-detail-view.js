// ============================================
// features/aset-detail/aset-detail-view.js
// Render semua field halaman detail aset
// ============================================

function renderDetail(data) {
  // Header
  const detailNama = document.getElementById('detail-nama');
  if (detailNama) detailNama.textContent = data.nama_barang;

  const kibLabel = document.getElementById('detail-kib-label');
  if (kibLabel) kibLabel.textContent = getKIBLabel(data.kib);

  const btnEdit = document.getElementById('btn-edit');
  if (btnEdit) btnEdit.href = `edit.html?id=${data.id}`;

  // Foto
  const fotoWrap = document.getElementById('foto-wrap');
  if (fotoWrap) {
    fotoWrap.innerHTML = data.foto_url
      ? `<img src="${escapeHtml(data.foto_url)}" alt="Foto Barang" class="foto-box">`
      : `<div class="foto-placeholder"><span>📷</span>Tidak ada foto</div>`;
  }

  // Helper set nilai ke elemen detail
  const set = (id, v, mono = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (v == null || v === '') {
      el.innerHTML = `<span class="detail-value empty">—</span>`;
    } else {
      el.innerHTML = `<span class="detail-value${mono ? ' mono' : ''}">${escapeHtml(String(v))}</span>`;
    }
  };

  // Data umum
  set('d-kodebarang',  data.kode_barang,  true);
  set('d-noregister',  data.no_register,  true);
  set('d-idbarang',    data.id_barang,    true);
  set('d-merktype',    data.merk_type);
  set('d-ukurancc',    data.ukuran_cc);
  set('d-bahan',       data.bahan);
  set('d-jumlah',      data.jumlah,       true);
  set('d-statusbarang',data.status_barang);
  set('d-statusaset',  data.status_aset);
  set('d-lokasi',      data.lokasi);
  set('d-penggunaan',  data.penggunaan);
  set('d-keterangan',  data.keterangan);

  // KIB badge
  const kibEl = document.getElementById('d-kib');
  if (kibEl) {
    kibEl.innerHTML = data.kib
      ? `<span class="kib-badge kib-${data.kib.replace(/ /g,'-').toLowerCase()}">${escapeHtml(data.kib)}</span>`
      : `<span class="detail-value empty">—</span>`;
  }

  // Kondisi badge
  const kondisiEl = document.getElementById('d-kondisi');
  if (kondisiEl) {
    kondisiEl.innerHTML = data.kondisi
      ? `<span class="badge ${getKondisiBadge(data.kondisi)}">${escapeHtml(data.kondisi)}</span>`
      : `<span class="detail-value empty">—</span>`;
  }

  // Perolehan
  set('d-tahunperolehan', data.tahun_perolehan, true);
  set('d-harga',          data.harga != null ? formatRupiah(data.harga) : null, true);
  set('d-caraperolehan',  data.cara_perolehan);
  set('d-sumberdana',     data.sumber_dana);
  set('d-tglbuku',        data.tgl_buku);
  set('d-nobast',         data.no_bast, true);
  set('d-tglbast',        data.tgl_bast);
  set('d-idpenerimaan',   data.id_penerimaan, true);

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

  // KIB A
  set('d-luastanah',           data.luas_tanah,            true);
  set('d-tahunperolehantanah', data.tahun_perolehan_tanah, true);
  set('d-statustanah',         data.status_tanah);
  set('d-letakalamat',         data.letak_alamat);
  set('d-nourutsertifikat',    data.no_urut_sertifikat,    true);
  set('d-nosertifikat',        data.no_sertifikat,         true);
  set('d-tglsertifikat',       data.tgl_sertifikat);
  set('d-penggunaantanah',     data.penggunaan_tanah);

  // KIB B
  set('d-nopabrik',  data.no_pabrik,  true);
  set('d-norangka',  data.no_rangka,  true);
  set('d-nomesin',   data.no_mesin,   true);
  set('d-nopolisi',  data.no_polisi,  true);
  set('d-nobpkb',    data.no_bpkb,    true);

  // KIB C
  set('d-kondisibangunan',      data.kondisi_bangunan);
  set('d-luaslantai',           data.luas_lantai,             true);
  set('d-jumlahlantai',         data.jumlah_lantai,           true);
  set('d-konstruksibertingkat', data.konstruksi_bertingkat);
  set('d-konstruksibeton',      data.konstruksi_beton);
  set('d-letakbangunan',        data.letak_bangunan);
  set('d-noimb',                data.no_imb,                  true);
  set('d-tglimb',               data.tgl_imb);
  set('d-statustanahgedung',    data.status_tanah_gedung);
  set('d-nokodetanah',          data.no_kode_tanah,           true);
  set('d-idawaltanah',          data.id_awal_tanah,           true);
  set('d-statussertifikattanah',data.status_sertifikat_tanah);

  // KIB E
  set('d-judulkoleksi', data.judul_koleksi);
  set('d-spesifikasi',  data.spesifikasi);
  set('d-penerbit',     data.penerbit);
  set('d-asaldaerah',   data.asal_daerah);
  set('d-bahanaset',    data.bahan_aset);
  set('d-jenisaset',    data.jenis_aset);
  set('d-ukuranaset',   data.ukuran_aset);
  set('d-tahuncetak',   data.tahun_cetak, true);

  // Dokumen pengadaan
  const dokGrid    = document.getElementById('dokumen-grid');
  const dokSection = document.getElementById('section-dokumen');
  if (dokGrid && dokSection) {
    const items = Object.entries(DOK_LABELS)
      .filter(([key]) => data[key])
      .map(([key, label]) => {
        const url = data[key];
        const ext = url.split('?')[0].split('.').pop().toLowerCase();
        const isImage = ['jpg','jpeg','png','webp','gif'].includes(ext);
        const fileName = decodeURIComponent(url.split('/').pop().split('?')[0]);
        const preview = isImage
          ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" class="dok-img">`
          : `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="dok-link">
               <span>📎</span>
               <span>${escapeHtml(fileName)}</span>
               <span style="font-size:11px;color:#64748b">Buka</span>
             </a>`;
        return `<div class="detail-item" style="flex-direction:column;gap:6px">
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
  if (data.penanggungjawab_id) {
    db.from('penanggungjawab')
      .select('nama, jabatan')
      .eq('id', data.penanggungjawab_id)
      .single()
      .then(({ data: pj }) => {
        if (pj) {
          set('d-penanggungjawab', pj.nama);
          set('d-pj-jabatan', pj.jabatan);
        }
      })
      .catch(() => {});
  } else if (data.nama_penanggungjawab) {
    set('d-penanggungjawab', data.nama_penanggungjawab);
  }

  // Tampilkan konten
  const content = document.getElementById('detail-content');
  if (content) content.style.display = 'block';
}
