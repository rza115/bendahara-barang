// ============================================
// features/barang/barang-state.js
// State filter aktif halaman daftar barang
// ============================================

let activeFilter = {};

function getActiveFilter() {
  return activeFilter;
}

function setActiveFilter(filter) {
  activeFilter = { ...filter };
}

function resetActiveFilter() {
  activeFilter = {};
}
