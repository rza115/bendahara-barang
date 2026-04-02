// =============================================
// barcode-service.js — Query layer barcode
// =============================================

async function fetchAsetBarcode() {
  const { data, error } = await db
    .from('aset')
    .select('id, nama_barang, kode_barang, id_barang, tahun_perolehan, kib')
    .order('nama_barang');
  if (error) throw error;
  return data || [];
}