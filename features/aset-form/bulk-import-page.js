// ============================================
// features/aset-form/bulk-import-page.js
// Halaman impor CSV/XLSX — tanpa foto & dokumen
// Membutuhkan library global: XLSX (SheetJS)
// ============================================

const BULK_CHUNK = 40;

function _parseMoneyCell(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return Math.round(raw);
  const s = String(raw).trim().replace(/\s/g, '').replace(/Rp/gi, '');
  const n = parseInt(s.replace(/\./g, '').replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function _parseNumberCell(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const s = String(raw).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function _parseIntCell(raw) {
  const n = _parseNumberCell(raw);
  if (n == null) return null;
  return Math.round(n);
}

function _parseDateCell(raw) {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  if (typeof raw === 'number' && raw > 20000 && raw < 80000) {
    const utc = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(utc);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return null;
}

function _coerceField(col, raw) {
  switch (col.type) {
    case 'money': return _parseMoneyCell(raw);
    case 'number': {
      if (col.key === 'jumlah' || col.key === 'jumlah_lantai' || col.key === 'tahun_perolehan'
        || col.key === 'tahun_perolehan_tanah' || col.key === 'tahun_cetak') {
        return _parseIntCell(raw);
      }
      return _parseNumberCell(raw);
    }
    case 'date': return _parseDateCell(raw);
    default: {
      if (raw == null) return null;
      const t = String(raw).trim();
      return t === '' ? null : t;
    }
  }
}

function _validateRecord(rec, rowNum) {
  const errs = [];
  if (!rec.nama_barang) errs.push('nama_barang wajib');
  if (!rec.kib) errs.push('kib wajib');
  else {
    const okKib = BULK_IMPORT_COLUMNS.find(c => c.key === 'kib')?.options || [];
    if (!okKib.includes(rec.kib)) errs.push(`kib tidak valid (gunakan: ${okKib.join(', ')})`);
  }
  for (const col of BULK_IMPORT_COLUMNS) {
    if (!col.options || col.options.length === 0) continue;
    const v = rec[col.key];
    if (v == null || v === '') continue;
    const allowed = col.options.filter(o => o !== '');
    if (allowed.length && !allowed.includes(v)) {
      errs.push(`${col.key}: nilai "${v}" di luar pilihan`);
    }
  }
  if (errs.length) return `Baris ${rowNum}: ${errs.join('; ')}`;
  return null;
}

function _applyDefaults(rec) {
  const out = { ...rec };
  if (out.jumlah == null || out.jumlah < 1) out.jumlah = 1;
  if (!out.kondisi) out.kondisi = 'Baik';
  if (!out.status_aset) out.status_aset = 'Aset Tetap';
  if (!out.status_barang) out.status_barang = 'Inventaris';
  return out;
}

function _stripForInsert(rec) {
  const skip = new Set(['foto_url', 'dok_spk_url', 'dok_penawaran_url', 'dok_baphp_url', 'dok_bast_url', 'dok_kuitansi_url']);
  const o = {};
  for (const [k, v] of Object.entries(rec)) {
    if (skip.has(k)) continue;
    if (v === '' || v === undefined) continue;
    o[k] = v;
  }
  if (o.penanggung_jawab_id === '' || o.penanggung_jawab_id == null) delete o.penanggung_jawab_id;
  return o;
}

function parseBulkTable(rows) {
  if (!rows?.length) throw new Error('File kosong atau tidak ada lembar data.');
  const headerRow = rows[0];
  const keyByCol = [];
  headerRow.forEach((h, i) => {
    const key = resolveBulkHeader(h);
    keyByCol[i] = key;
  });
  const usedKeys = keyByCol.filter(Boolean);
  if (!usedKeys.includes('nama_barang') || !usedKeys.includes('kib')) {
    throw new Error('Header wajib memuat kolom "nama_barang" dan "kib" (nama kolom baris pertama).');
  }
  const dataRows = [];
  for (let r = 1; r < rows.length; r++) {
    const line = rows[r];
    if (!line || !line.some(c => String(c ?? '').trim() !== '')) continue;
    const rec = {};
    keyByCol.forEach((key, i) => {
      if (!key) return;
      const col = BULK_IMPORT_COLUMNS.find(c => c.key === key);
      if (!col) return;
      rec[key] = _coerceField(col, line[i]);
    });
    dataRows.push({ sheetRow: r + 1, rec: _applyDefaults(rec) });
  }
  return dataRows;
}

function readBulkWorkbook(ab) {
  if (typeof XLSX === 'undefined') {
    throw new Error('Library XLSX belum dimuat. Muat ulang halaman.');
  }
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const sn = wb.SheetNames[0];
  if (!sn) throw new Error('Berkas tidak berisi lembar kerja.');
  const ws = wb.Sheets[sn];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
}

function downloadBulkTemplateXlsx() {
  if (typeof XLSX === 'undefined') {
    showAlert('Library Excel belum siap. Tunggu sebentar lalu coba lagi.', 'error');
    return;
  }
  const keys = getBulkTemplateKeys();
  const sample = keys.map(k => {
    if (k === 'kib') return 'KIB B';
    if (k === 'nama_barang') return 'Contoh: Meja Kerja';
    if (k === 'jumlah') return 1;
    if (k === 'harga') return 1500000;
    return '';
  });
  const ws = XLSX.utils.aoa_to_sheet([keys, sample]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'aset');
  XLSX.writeFile(wb, 'template-impor-aset.xlsx');
}

function downloadBulkTemplateCsv() {
  const keys = getBulkTemplateKeys();
  const esc = v => {
    const s = String(v ?? '');
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = keys.map(esc).join(',');
  const sample = keys.map(k => {
    if (k === 'kib') return esc('KIB B');
    if (k === 'nama_barang') return esc('Contoh: Meja Kerja');
    if (k === 'jumlah') return '1';
    if (k === 'harga') return esc('1500000');
    return '';
  }).join(',');
  const blob = new Blob([header + '\n' + sample + '\n'], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'template-impor-aset.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function renderBulkPreview(container, parsed, errors) {
  if (!container) return;
  const max = 15;
  const slice = parsed.slice(0, max);
  let html = '';
  if (errors.length) {
    html += `<div class="bulk-errors" style="margin-bottom:12px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:13px;color:#991b1b;max-height:160px;overflow:auto"><strong>Validasi / error:</strong><ul style="margin:8px 0 0 18px">${errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`;
  }
  if (!slice.length) {
    container.innerHTML = html + '<p style="color:#64748b">Tidak ada baris data.</p>';
    return;
  }
  const keys = getBulkTemplateKeys().filter(k => slice.some(row => row.rec[k] != null && row.rec[k] !== ''));
  const showKeys = ['kib', 'nama_barang', 'jumlah', 'harga', ...keys.filter(k => !['kib', 'nama_barang', 'jumlah', 'harga'].includes(k))].filter((k, i, a) => a.indexOf(k) === i).slice(0, 12);
  html += `<p style="font-size:13px;color:#64748b;margin-bottom:8px">Pratinjau ${slice.length} dari ${parsed.length} baris${parsed.length > max ? ' (dipotong)' : ''}</p>`;
  html += '<div style="overflow:auto;border:1px solid #e2e8f0;border-radius:8px"><table class="bulk-preview-table" style="font-size:12px;border-collapse:collapse;width:100%"><thead><tr>';
  html += '<th style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;background:#f8fafc">#</th>';
  showKeys.forEach(k => { html += `<th style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:left;background:#f8fafc">${escapeHtml(k)}</th>`; });
  html += '</tr></thead><tbody>';
  slice.forEach(row => {
    html += `<tr><td style="padding:6px 8px;border-bottom:1px solid #f1f5f9">${row.sheetRow}</td>`;
    showKeys.forEach(k => {
      let v = row.rec[k];
      if (v == null) v = '';
      else if (typeof v === 'object') v = String(v);
      html += `<td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(String(v))}">${escapeHtml(String(v))}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

async function runBulkImport(parsed) {
  const errors = [];
  let ok = 0;
  const rows = parsed.map(({ sheetRow, rec }) => ({ sheetRow, payload: _stripForInsert(rec) }));
  for (let i = 0; i < rows.length; i += BULK_CHUNK) {
    const chunk = rows.slice(i, i + BULK_CHUNK);
    const payloads = chunk.map(c => c.payload);
    try {
      const { error } = await db.from('aset').insert(payloads);
      if (error) throw error;
      ok += chunk.length;
    } catch (_) {
      for (const { sheetRow, payload } of chunk) {
        try {
          const { error: err2 } = await db.from('aset').insert(payload);
          if (err2) throw err2;
          ok += 1;
        } catch (e2) {
          errors.push(`Baris lembar ~${sheetRow}: ${e2.message || e2}`);
        }
      }
    }
  }
  return { ok, errors };
}

let _bulkParsed = [];
let _bulkValidErrors = [];

async function initBulkTambahPage() {
  const fileEl = document.getElementById('bulk-file');
  const previewEl = document.getElementById('bulk-preview');
  const btnParse = document.getElementById('bulk-btn-parse');
  const btnImport = document.getElementById('bulk-btn-import');
  const btnTplXlsx = document.getElementById('bulk-btn-template-xlsx');
  const btnTplCsv = document.getElementById('bulk-btn-template-csv');
  const statEl = document.getElementById('bulk-stat');
  const colList = document.getElementById('bulk-column-list');
  if (colList && typeof BULK_IMPORT_COLUMNS !== 'undefined') {
    colList.innerHTML =
      '<ul style="font-size:13px;margin:0;padding-left:18px;line-height:1.65;max-height:280px;overflow-y:auto">' +
      BULK_IMPORT_COLUMNS.map(c => {
        const req = c.required ? ' <strong style="color:#dc2626">*</strong>' : '';
        return `<li style="margin-bottom:4px"><code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">${escapeHtml(c.key)}</code> — ${escapeHtml(c.label)}${req}</li>`;
      }).join('') +
      '</ul>';
  }

  btnTplXlsx?.addEventListener('click', downloadBulkTemplateXlsx);
  btnTplCsv?.addEventListener('click', downloadBulkTemplateCsv);

  btnParse?.addEventListener('click', () => {
    _bulkParsed = [];
    _bulkValidErrors = [];
    const f = fileEl?.files?.[0];
    if (!f) {
      showAlert('Pilih berkas CSV atau XLSX terlebih dahulu.', 'error');
      return;
    }
    const name = f.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      showAlert('Format didukung: .csv, .xlsx, .xls', 'error');
      return;
    }
    showLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let matrix;
        if (name.endsWith('.csv')) {
          const wb = XLSX.read(reader.result, { type: 'string', cellDates: true });
          const sn = wb.SheetNames[0];
          matrix = XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '', raw: true });
        } else {
          matrix = readBulkWorkbook(reader.result);
        }
        _bulkParsed = parseBulkTable(matrix);
        _bulkValidErrors = [];
        _bulkParsed.forEach(({ sheetRow, rec }) => {
          const err = _validateRecord(rec, sheetRow);
          if (err) _bulkValidErrors.push(err);
        });
        renderBulkPreview(previewEl, _bulkParsed, _bulkValidErrors);
        if (statEl) {
          statEl.textContent = `${_bulkParsed.length} baris siap diproses${_bulkValidErrors.length ? ` · ${_bulkValidErrors.length} baris gagal validasi` : ''}`;
        }
        if (_bulkParsed.length && !_bulkValidErrors.length) {
          showAlert(`${_bulkParsed.length} baris siap diimpor.`);
        } else if (_bulkValidErrors.length) {
          showAlert('Ada baris yang gagal validasi. Periksa daftar merah di bawah.', 'error');
        }
      } catch (err) {
        showAlert('Gagal membaca berkas: ' + err.message, 'error');
        renderBulkPreview(previewEl, [], [err.message]);
        if (statEl) statEl.textContent = '';
      } finally {
        showLoading(false);
      }
    };
    reader.onerror = () => {
      showLoading(false);
      showAlert('Gagal membaca berkas.', 'error');
    };
    if (name.endsWith('.csv')) {
      reader.readAsText(f, 'UTF-8');
    } else {
      reader.readAsArrayBuffer(f);
    }
  });

  btnImport?.addEventListener('click', async () => {
    if (!_bulkParsed.length) {
      showAlert('Unggah dan parse berkas terlebih dahulu (tombol "Baca & pratinjau").', 'error');
      return;
    }
    if (_bulkValidErrors.length) {
      showAlert('Perbaiki error validasi sebelum mengimpor.', 'error');
      return;
    }
    if (!confirm(`Impor ${_bulkParsed.length} aset ke database?`)) return;
    showLoading(true);
    try {
      const { ok, errors } = await runBulkImport(_bulkParsed);
      let msg = `Berhasil: ${ok} aset.`;
      if (errors.length) msg += ` Gagal: ${errors.length}.`;
      showAlert(msg, errors.length ? 'error' : 'success');
      if (errors.length && previewEl) {
        renderBulkPreview(previewEl, _bulkParsed, errors.slice(0, 50));
      } else if (ok) {
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
      }
    } catch (err) {
      showAlert('Impor gagal: ' + err.message, 'error');
    } finally {
      showLoading(false);
    }
  });
}
