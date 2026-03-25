# Panduan Implementasi Limit Baris Data

## Penjelasan
File ini berisi kode JavaScript yang perlu ditambahkan ke `app.js` untuk mengaktifkan fitur limit/pagination pada tabel data di halaman index.html.

## Cara Implementasi

### 1. Modifikasi Fungsi loadAset()

Cari fungsi `loadAset()` di file `app.js`, lalu modifikasi bagian yang menampilkan data ke tabel. Tambahkan logika untuk membatasi jumlah baris yang ditampilkan:

```javascript
// Di dalam fungsi loadAset(), setelah mendapatkan data dari database
// Tambahkan kode berikut sebelum loop yang menampilkan data:

const limitSelect = document.getElementById('limit-rows');
const limitValue = limitSelect ? limitSelect.value : 'all';
let dataToDisplay = filteredAset; // atau variable array data yang ada

if (limitValue !== 'all') {
    const limit = parseInt(limitValue);
    dataToDisplay = filteredAset.slice(0, limit);
}

// Lalu gunakan dataToDisplay untuk loop menampilkan ke tabel
dataToDisplay.forEach((aset, index) => {
    // kode untuk menampilkan data ke tabel
});
```

### 2. Tambahkan Event Listener

Tambahkan event listener untuk dropdown limit-rows. Letakkan kode ini di bagian inisialisasi (misalnya di fungsi `initFilter()` atau di akhir file):

```javascript
// Event listener untuk limit rows
const limitRowsSelect = document.getElementById('limit-rows');
if (limitRowsSelect) {
    limitRowsSelect.addEventListener('change', function() {
        loadAset(); // reload data dengan limit baru
    });
}
```

### 3. Integrasi dengan Filter yang Ada

Pastikan saat filter lain (search, KIB, kondisi, sort) dijalankan, limit baris juga diterapkan. Contoh:

```javascript
function applyFilters() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const kibFilter = document.getElementById('filter-kib').value;
    const kondisiFilter = document.getElementById('filter-kondisi').value;
    const sortBy = document.getElementById('sort-by').value;
    const limitValue = document.getElementById('limit-rows').value;
    
    // Logic filter data...
    let filtered = allAset.filter(/* filter logic */);
    
    // Apply sort
    if (sortBy) {
        // sort logic
    }
    
    // Apply limit
    if (limitValue !== 'all') {
        filtered = filtered.slice(0, parseInt(limitValue));
    }
    
    // Display filtered data
    displayData(filtered);
}
```

## Catatan Penting

1. **Client-side Only**: Implementasi ini murni client-side, artinya semua data tetap diambil dari database, tapi yang ditampilkan dibatasi di browser.

2. **Performance**: Untuk dataset besar (ribuan records), pertimbangkan untuk menambahkan loading indicator saat filter diaplikasikan.

3. **Default Value**: Dropdown default adalah "Semua Data" (value="all"), yang berarti tidak ada limit.

4. **Compatibility**: Kode ini kompatibel dengan filter yang sudah ada (search, KIB type, kondisi, sort).

## Testing

Setelah implementasi:
1. Buka index.html di browser
2. Pilih "100 Data" dari dropdown - tabel harus menampilkan maksimal 100 baris
3. Pilih "200 Data" - tabel harus menampilkan maksimal 200 baris
4. Pilih "500 Data" - tabel harus menampilkan maksimal 500 baris
5. Pilih "Semua Data" - tabel menampilkan semua data
6. Test kombinasi dengan filter lain untuk memastikan semuanya bekerja

## Troubleshooting

Jika tidak berfungsi:
- Periksa console browser (F12) untuk error JavaScript
- Pastikan id="limit-rows" sudah benar di index.html
- Pastikan event listener sudah terpasang dengan benar
- Pastikan fungsi loadAset() atau fungsi display data dipanggil ulang saat dropdown berubah
