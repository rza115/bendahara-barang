// ============================================
// shared/utils/formatters.js
// Helper format tampilan: rupiah, html escape, badge
// ============================================

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatRupiah(angka) {
  if (!angka && angka !== 0) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
}

function getKIBLabel(kib) {
  return KIB_LABEL[kib] || kib;
}

function getKondisiBadge(k) {
  return KONDISI_BADGE[k] || 'badge-baik';
}
