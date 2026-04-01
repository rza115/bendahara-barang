// features/peminjaman/peminjaman-page.js
'use strict';

// 
window.initPeminjaman = async function () {
  window.PeminjamanService.init(db); // pakai global db dari main.js

  let allAset = [];

  async function loadAsetCache() {
    try { allAset = await window.PeminjamanService.loadAset(); }
    catch (e) { showFeedback('Gagal memuat daftar aset: ' + e.message, 'error'); }
  }

  function getNamaAset(id) {
    const a = allAset.find(x => x.id === id);
    if (!a) return id;
    return a.nama_barang + (a.kode_barang ? ' (' + a.kode_barang + ')' : '');
  }

  // ── Helper UI ──────────────────────────────────────────────────────────
  function showFeedback(msg, type = 'success') {
    const el = document.getElementById('alert-box');
    if (!el) return;
    el.className = 'alert alert-' + type;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
  }

  function showLoading(show = true) {
    const el = document.getElementById('loading');
    if (el) el.style.display = show ? 'flex' : 'none';
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatTgl(tgl) {
    if (!tgl) return '-';
    const [y, m, d] = tgl.split('-');
    return `${d}/${m}/${y}`;
  }

  function hariSelisih(batas) {
    if (!batas) return null;
    return Math.ceil((new Date(batas) - new Date()) / 86400000);
  }

  // ── Dropdown aset ──────────────────────────────────────────────────────
  function populateDropdownAset() {
    ['pm-aset-id', 'filter-pm-aset'].forEach(elId => {
      const sel = document.getElementById(elId);
      if (!sel) return;
      const def = elId === 'pm-aset-id' ? 'Pilih Aset' : 'Semua Aset';
      sel.innerHTML = `<option value="">${def}</option>`;
      allAset.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.nama_barang + (a.kode_barang ? ' (' + a.kode_barang + ')' : '');
        sel.appendChild(opt);
      });
    });
  }

  // ── Render tabel ───────────────────────────────────────────────────────
  function renderTable(data) {
    const tbody = document.getElementById('pm-tbody');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#94a3b8">
        Belum ada data peminjaman.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map((row, i) => {
      const namaAset = row.aset
        ? escapeHtml(row.aset.nama_barang) + (row.aset.kode_barang
            ? ` <span style="color:#94a3b8;font-size:12px">(${escapeHtml(row.aset.kode_barang)})</span>` : '')
        : escapeHtml(getNamaAset(row.aset_id));

      const selisih = hariSelisih(row.batas_kembali);
      let batasHtml = formatTgl(row.batas_kembali);
      if (row.status === 'dipinjam' && selisih !== null) {
        if (selisih < 0)
          batasHtml += ` <span style="color:#dc2626;font-size:11px;font-weight:600">Terlambat ${Math.abs(selisih)}h</span>`;
        else if (selisih <= 3)
          batasHtml += ` <span style="color:#d97706;font-size:11px;font-weight:600">Sisa ${selisih}h</span>`;
      }

      const statusBadge = row.status === 'dikembalikan'
        ? `<span style="background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500">Dikembalikan</span>`
        : `<span style="background:#fef9c3;color:#a16207;padding:2px 10px;border-radius:9999px;font-size:12px;font-weight:500">Dipinjam</span>`;

      const aksi = row.status === 'dipinjam'
        ? `<button onclick="window._kembalikanPeminjaman('${row.id}')"
             style="padding:3px 10px;font-size:12px;background:#dcfce7;border:1px solid #86efac;
                    border-radius:6px;cursor:pointer;color:#15803d;margin-right:4px">
             ↩ Kembalikan</button>`
        : '';

      return `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:10px 12px;font-size:13px">${i + 1}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:500">${namaAset}</td>
        <td style="padding:10px 12px;font-size:13px">${escapeHtml(row.nama_peminjam)}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b">${escapeHtml(row.unit_kerja) || '-'}</td>
        <td style="padding:10px 12px;font-size:13px">${formatTgl(row.tanggal_pinjam)}</td>
        <td style="padding:10px 12px;font-size:13px">${batasHtml}</td>
        <td style="padding:10px 12px;font-size:13px;color:#64748b">${formatTgl(row.tanggal_kembali)}</td>
        <td style="padding:10px 12px">${statusBadge}</td>
        <td style="padding:10px 12px;white-space:nowrap">
          ${aksi}
          <button onclick="window._hapusPeminjaman('${row.id}')"
            style="padding:3px 8px;font-size:12px;background:#fef2f2;border:1px solid #fecaca;
                   border-radius:6px;cursor:pointer;color:#dc2626">Hapus</button>
        </td>
      </tr>`;
    }).join('');
  }

  // ── Load list ──────────────────────────────────────────────────────────
  async function loadList() {
    showLoading(true);
    try {
      const filter = {
        aset_id: document.getElementById('filter-pm-aset')?.value || '',
        status:  document.getElementById('filter-pm-status')?.value || ''
      };
      const data = await window.PeminjamanService.loadList(filter);
      renderTable(data);
      updateRingkasan(data);
    } catch (e) {
      showFeedback('Gagal memuat data: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function updateRingkasan(data) {
    const aktif     = data.filter(r => r.status === 'dipinjam').length;
    const kembali   = data.filter(r => r.status === 'dikembalikan').length;
    const terlambat = data.filter(r =>
      r.status === 'dipinjam' && r.batas_kembali && hariSelisih(r.batas_kembali) < 0
    ).length;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pm-total',     data.length);
    set('pm-aktif',     aktif);
    set('pm-kembali',   kembali);
    set('pm-terlambat', terlambat);
  }

  // ── Modal ──────────────────────────────────────────────────────────────
  function bukaModal() {
    const modal = document.getElementById('modal-peminjaman');
    if (modal) modal.style.display = 'flex';
    const tgl = document.getElementById('pm-tanggal-pinjam');
    if (tgl && !tgl.value) tgl.value = new Date().toISOString().split('T')[0];
  }

  function tutupModal() {
    const modal = document.getElementById('modal-peminjaman');
    if (modal) modal.style.display = 'none';
    resetForm();
  }

  function resetForm() {
    ['pm-aset-id','pm-namapeminjam','pm-unitkerja','pm-keperluan',
     'pm-tanggal-pinjam','pm-batas-kembali','pm-keterangan']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  }

  // ── Simpan ─────────────────────────────────────────────────────────────
  async function simpan() {
    const aset_id        = document.getElementById('pm-aset-id')?.value;
    const nama_peminjam  = document.getElementById('pm-namapeminjam')?.value?.trim();
    const unit_kerja     = document.getElementById('pm-unitkerja')?.value?.trim();
    const keperluan      = document.getElementById('pm-keperluan')?.value?.trim();
    const tanggal_pinjam = document.getElementById('pm-tanggal-pinjam')?.value;
    const batas_kembali  = document.getElementById('pm-batas-kembali')?.value;
    const keterangan     = document.getElementById('pm-keterangan')?.value?.trim();

    if (!aset_id)        return showFeedback('Pilih aset terlebih dahulu!', 'error');
    if (!nama_peminjam)  return showFeedback('Nama peminjam wajib diisi!', 'error');
    if (!tanggal_pinjam) return showFeedback('Tanggal pinjam wajib diisi!', 'error');

    showLoading(true);
    try {
      await window.PeminjamanService.tambah({
        aset_id,
        nama_peminjam,
        unit_kerja:     unit_kerja    || null,
        keperluan:      keperluan     || null,
        tanggal_pinjam,
        batas_kembali:  batas_kembali || null,
        keterangan:     keterangan    || null,
        status: 'dipinjam'
      });
      showFeedback('Peminjaman berhasil dicatat!');
      tutupModal();
      await loadList();
    } catch (e) {
      showFeedback('Gagal menyimpan: ' + e.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  // ── Kembalikan ─────────────────────────────────────────────────────────
  window._kembalikanPeminjaman = async function (id) {
    if (!confirm('Tandai barang ini sebagai sudah dikembalikan?')) return;
    showLoading(true);
    try {
      await window.PeminjamanService.kembalikan(id);
      showFeedback('Barang berhasil dikembalikan.');
      await loadList();
    } catch (e) {
      showFeedback('Gagal memperbarui: ' + e.message, 'error');
    } finally { showLoading(false); }
  };

  // ── Hapus ──────────────────────────────────────────────────────────────
  window._hapusPeminjaman = async function (id) {
    if (!confirm('Hapus data peminjaman ini? Tindakan tidak bisa dibatalkan.')) return;
    showLoading(true);
    try {
      await window.PeminjamanService.hapus(id);
      showFeedback('Data peminjaman berhasil dihapus.');
      await loadList();
    } catch (e) {
      showFeedback('Gagal menghapus: ' + e.message, 'error');
    } finally { showLoading(false); }
  };

  // ── Bind events ────────────────────────────────────────────────────────
  document.getElementById('btn-tambah-peminjaman')?.addEventListener('click', bukaModal);
  document.getElementById('btn-simpan-peminjaman')?.addEventListener('click', simpan);
  document.getElementById('btn-batal-peminjaman')?.addEventListener('click', tutupModal);
  document.getElementById('modal-peminjaman')?.addEventListener('click', function (e) {
    if (e.target === this) tutupModal();
  });
  document.getElementById('filter-pm-aset')?.addEventListener('change', loadList);
  document.getElementById('filter-pm-status')?.addEventListener('change', loadList);

  // ── Init ───────────────────────────────────────────────────────────────
  showLoading(true);
  await loadAsetCache();
  populateDropdownAset();
  await loadList();
  showLoading(false);
};
