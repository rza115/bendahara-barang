// features/aset-detail/aset-detail-view.js
// Kolom DB: snake_case sesuai schema (kode_barang, merk_type, dll)
// Tabel PJ: penanggung_jawab  |  FK: penanggung_jawab_id

function renderDetail(data) {
  // Header
  const elNama = document.getElementById('detail-nama');
  if (elNama) elNama.textContent = data.nama_barang;

  const elKibLabel = document.getElementById('detail-kib-label');
  if (elKibLabel) elKibLabel.textContent = getKIBLabel(data.kib);

  const btnEdit = document.getElementById('btn-edit');
  if (btnEdit) btnEdit.href = `edit.html?id=${data.id}`;

  // Foto
  const fotoWrap = document.getElementById('foto-wrap');
  if (fotoWrap) {
    fotoWrap.innerHTML = data.foto_url
      ? `<img src="${escapeHtml(data.foto_url)}" alt="Foto Barang" class="foto-box">`
      : `<div class="foto-placeholder"><span>📷</span>Tidak ada foto</div>`;
  }

  // Helper — langsung set textContent ke <span id="d-xxx"> yang ada di HTML
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

  // Informasi umum
  set('d-kodebarang',   data.kode_barang);
  set('d-noregister',   data.no_register);
  set('d-idbarang',     data.id_barang);
  set('d-merktype',     data.merk_type);
  set('d-ukurancc',     data.ukuran_cc);
  set('d-bahan',        data.bahan);
  set('d-jumlah',       data.jumlah);
  set('d-statusbarang', data.status_barang);
  set('d-statusaset',   data.status_aset);
  set('d-lokasi',       data.lokasi);
  set('d-penggunaan',   data.penggunaan);
  set('d-keterangan',   data.keterangan);

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

  // Data perolehan
  set('d-tahunperolehan', data.tahun_perolehan);
  set('d-harga',          data.harga != null ? formatRupiah(data.harga) : null);
  set('d-caraperolehan',  data.cara_perolehan);
  set('d-sumberdana',     data.sumber_dana);
  set('d-tglbuku',        data.tgl_buku);
  set('d-nobast',         data.no_bast);
  set('d-tglbast',        data.tgl_bast);
  set('d-idpenerimaan',   data.id_penerimaan);

  // Tampilkan hanya section KIB yang sesuai
  ['section-kib-a','section-kib-b','section-kib-c','section-kib-e']
    .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
  const kibMap = { 'KIB A':'section-kib-a', 'KIB B':'section-kib-b', 'KIB C':'section-kib-c', 'KIB E':'section-kib-e' };
  const secActive = document.getElementById(kibMap[data.kib]);
  if (secActive) secActive.style.display = 'block';

  // KIB A — Tanah
  set('d-luastanah',           data.luas_tanah);
  set('d-tahunperolehantanah', data.tahun_perolehan_tanah);
  set('d-statustanah',         data.status_tanah);
  set('d-letakalamat',         data.letak_alamat);
  set('d-nourutsertifikat',    data.no_urut_sertifikat);
  set('d-nosertifikat',        data.no_sertifikat);
  set('d-tglsertifikat',       data.tgl_sertifikat);
  set('d-penggunaantanah',     data.penggunaan_tanah);

  // KIB B — Kendaraan/Mesin
  set('d-nopabrik', data.no_pabrik);
  set('d-norangka', data.no_rangka);
  set('d-nomesin',  data.no_mesin);
  set('d-nopolisi', data.no_polisi);
  set('d-nobpkb',   data.no_bpkb);

  // KIB C — Gedung
  set('d-kondisibangunan',      data.kondisi_bangunan);
  set('d-luaslantai',           data.luas_lantai);
  set('d-jumlahlantai',         data.jumlah_lantai);
  set('d-konstruksibertingkat', data.konstruksi_bertingkat);
  set('d-konstruksibeton',      data.konstruksi_beton);
  set('d-letakbangunan',        data.letak_bangunan);
  set('d-noimb',                data.no_imb);
  set('d-tglimb',               data.tgl_imb);
  set('d-statustanahgedung',    data.status_tanah_gedung);
  set('d-nokodetanah',          data.no_kode_tanah);
  set('d-idawaltanah',          data.id_awal_tanah);
  set('d-statussertifikattanah',data.status_sertifikat_tanah);

  // KIB E — Aset Tetap Lainnya
  set('d-judulkoleksi', data.judul_koleksi);
  set('d-spesifikasi',  data.spesifikasi);
  set('d-penerbit',     data.penerbit);
  set('d-asaldaerah',   data.asal_daerah);
  set('d-bahanaset',    data.bahan_aset);
  set('d-jenisaset',    data.jenis_aset);
  set('d-ukuranaset',   data.ukuran_aset);
  set('d-tahuncetak',   data.tahun_cetak);

  // Dokumen pengadaan
  const DOK_LABELS_LOCAL = {
    dok_spk_url:       'SPK / Surat Pesanan',
    dok_penawaran_url: 'Surat Penawaran',
    dok_baphp_url:     'BAPHP',
    dok_bast_url:      'BAST',
    dok_kuitansi_url:  'Kuitansi',
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

  // Penanggung jawab — tabel: penanggung_jawab, FK: penanggung_jawab_id
  if (data.penanggung_jawab_id) {
    db.from('penanggung_jawab')
      .select('nama, jabatan')
      .eq('id', data.penanggung_jawab_id)
      .single()
      .then(({ data: pj }) => {
        if (pj) {
          set('d-penanggungjawab', pj.nama);
          set('d-pj-jabatan', pj.jabatan);
        }
      })
      .catch(() => {});
  } else if (data.nama_penanggung_jawab) {
    set('d-penanggungjawab', data.nama_penanggung_jawab);
  }

  // Tampilkan konten
  const content = document.getElementById('detail-content');
  if (content) content.style.display = 'block';
}
