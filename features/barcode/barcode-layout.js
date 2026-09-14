// Physical dimensions in mm: shared by preview, browser print and PDF.
window.BarcodeLayout = (() => {
  const label = Object.freeze({ width: 90, height: 45, qr: 28 });
  const margin = 10;
  const gap = 6;
  const papers = Object.freeze({
    a4: Object.freeze({ label: 'A4', width: 210, height: 297, orientation: 'portrait', pdfFormat: 'a4' }),
    folio: Object.freeze({ label: 'Folio/F4', width: 210, height: 330, orientation: 'portrait', pdfFormat: [210, 330] }),
    a3: Object.freeze({ label: 'A3', width: 420, height: 297, orientation: 'landscape', pdfFormat: 'a3' }),
  });
  function layout(key) {
    const paper = papers[key] || papers.a4;
    const columns = Math.floor((paper.width - 2 * margin + gap) / (label.width + gap));
    const rows = Math.floor((paper.height - 2 * margin + gap) / (label.height + gap));
    return { ...paper, columns, rows, capacity: columns * rows };
  }
  function position(index, paper) {
    const slot = index % paper.capacity;
    return {
      page: Math.floor(index / paper.capacity),
      x: margin + (slot % paper.columns) * (label.width + gap),
      y: margin + Math.floor(slot / paper.columns) * (label.height + gap),
    };
  }
  return Object.freeze({ label, margin, gap, layout, position });
})();
