// features/peminjaman/peminjaman-service.js
'use strict';

let _db = null;

window.PeminjamanService = {
  init(client) {
    _db = client;
  },

  async loadAset() {
    const { data, error } = await _db
      .from('aset')
      .select('id, nama_barang, kode_barang')
      .order('nama_barang');
    if (error) throw error;
    return data || [];
  },

  async loadList(filter = {}) {
    let q = _db
      .from('peminjaman')
      .select(`
        id, nama_peminjam, unit_kerja, keperluan,
        tanggal_pinjam, batas_kembali, tanggal_kembali,
        status, keterangan, created_at, aset_id,
        aset ( nama_barang, kode_barang )
      `)
      .order('created_at', { ascending: false });

    if (filter.aset_id) q = q.eq('aset_id', filter.aset_id);
    if (filter.status)  q = q.eq('status', filter.status);

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async tambah(payload) {
    const { error } = await _db.from('peminjaman').insert(payload);
    if (error) throw error;
  },

  async kembalikan(id) {
    const tanggal_kembali = new Date().toISOString().split('T')[0];
    const { error } = await _db
      .from('peminjaman')
      .update({ status: 'dikembalikan', tanggal_kembali })
      .eq('id', id);
    if (error) throw error;
  },

  async hapus(id) {
    const { error } = await _db.from('peminjaman').delete().eq('id', id);
    if (error) throw error;
  }
};
