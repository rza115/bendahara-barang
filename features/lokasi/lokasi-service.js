// Master lokasi menggunakan nama unik yang direferensikan oleh aset.lokasi.
function normalizeLokasi(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function lokasiError(error) {
  if (['42P01', 'PGRST205'].includes(error.code)) {
    return new Error('Master lokasi belum tersedia. Jalankan database_migration_master_lokasi.sql di Supabase SQL Editor, lalu muat ulang halaman.');
  }
  if (error.code === '23505') return new Error('Nama lokasi sudah terdaftar. Gunakan nama ruangan yang berbeda.');
  if (error.code === '23503') return new Error('Lokasi masih digunakan oleh aset, termasuk aset di Trash. Pindahkan aset tersebut sebelum menghapus lokasi.');
  return error;
}

// Pagination menghindari kartu yang terpotong oleh batas hasil Supabase.
async function fetchAllLokasiRows(makeQuery) {
  const result = [];
  const size = 500;
  for (let offset = 0; ; offset += size) {
    const { data, error } = await makeQuery().range(offset, offset + size - 1);
    if (error) throw lokasiError(error);
    result.push(...(data || []));
    if (!data || data.length < size) return result;
  }
}

async function fetchMasterLokasi() {
  return fetchAllLokasiRows(() => db.from('master_lokasi').select('*').order('nama').order('id'));
}

async function saveMasterLokasi(id, values) {
  const payload = {
    nama: normalizeLokasi(values.nama),
    gedung: normalizeLokasi(values.gedung) || null,
    keterangan: values.keterangan?.trim() || null,
  };
  if (!payload.nama) throw new Error('Nama lokasi wajib diisi.');
  const query = id ? db.from('master_lokasi').update(payload).eq('id', id)
    : db.from('master_lokasi').insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw lokasiError(error);
  return data;
}

async function deleteMasterLokasi(id) {
  const { error } = await db.from('master_lokasi').delete().eq('id', id);
  if (error) throw lokasiError(error);
}

async function fetchAsetRuangan() {
  return fetchAllLokasiRows(() => db.from('aset')
    .select('id,id_barang,kode_barang,no_register,nama_barang,merk_type,bahan,tahun_perolehan,jumlah,harga,kondisi,lokasi,keterangan')
    .is('deleted_at', null).order('nama_barang').order('id'));
}

async function loadLokasiDropdown(selectedName = '') {
  const select = document.getElementById('lokasi');
  if (!select) return;
  select.disabled = true;
  select.dataset.ready = 'false';
  try {
    const locations = await fetchMasterLokasi();
    select.replaceChildren(new Option('Belum ditentukan', ''));
    locations.forEach(row => select.add(new Option(row.nama, row.nama)));
    const selected = locations.find(row => row.nama.toLowerCase() === normalizeLokasi(selectedName).toLowerCase());
    if (selectedName && !selected) throw new Error('Lokasi aset belum ada di master. Jalankan migrasi master lokasi terlebih dahulu.');
    select.value = selected?.nama || '';
    select.dataset.ready = 'true';
    select.disabled = false;
  } catch (error) {
    select.replaceChildren(new Option('Master lokasi gagal dimuat', ''));
    throw error;
  }
}

function mapBulkLokasi(parsed, locations) {
  const byName = new Map(locations.map(row => [normalizeLokasi(row.nama).toLowerCase(), row.nama]));
  return parsed.map(({ sheetRow, rec }) => {
    const name = normalizeLokasi(rec.lokasi);
    const canonical = name ? byName.get(name.toLowerCase()) : null;
    if (name && !canonical) {
      throw new Error(`Baris ${sheetRow}: lokasi "${name}" belum terdaftar. Tambahkan di Master Lokasi & KIR sebelum mengimpor.`);
    }
    return { sheetRow, rec: { ...rec, lokasi: canonical } };
  });
}
