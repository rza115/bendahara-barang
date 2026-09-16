const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const serviceCode = fs.readFileSync(
  path.join(__dirname, '..', 'shared/media/foto-service.js'),
  'utf8',
);

function setupFotoService() {
  const uploads = [];
  const drawCalls = [];
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillStyle: '',
      fillRect() {},
      drawImage(...args) { drawCalls.push(args); },
    }),
    toBlob(callback, type, quality) {
      const size = quality > 0.8 ? 3 * 1024 * 1024 : 900 * 1024;
      callback(new Blob([new Uint8Array(size)], { type }));
    },
  };
  class MockImage {
    constructor() {
      this.naturalWidth = 4000;
      this.naturalHeight = 3000;
    }
    set src(_) { queueMicrotask(() => this.onload()); }
  }
  const db = {
    storage: {
      from(bucket) {
        assert.equal(bucket, 'foto-barang');
        return {
          async upload(name, file, options) {
            uploads.push({ name, file, options });
            return { error: null };
          },
          getPublicUrl: name => ({ data: { publicUrl: `https://example.test/${name}` } }),
        };
      },
    },
  };
  const context = vm.createContext({
    Blob,
    File,
    Image: MockImage,
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    document: { createElement: tag => tag === 'canvas' ? canvas : null },
    db,
    queueMicrotask,
    Uint8Array,
  });
  vm.runInContext(serviceCode, context);
  return { context, uploads, canvas, drawCalls };
}

test('foto di-resize, dikompres ke JPEG di bawah 2 MB, lalu di-upload', async () => {
  const app = setupFotoService();
  const original = new File([new Uint8Array(5 * 1024 * 1024)], 'Foto Kamera.png', {
    type: 'image/png',
  });

  const url = await app.context.uploadFoto(original);

  assert.equal(app.canvas.width, 1600);
  assert.equal(app.canvas.height, 1200);
  assert.equal(app.drawCalls.length, 1);
  assert.equal(app.uploads.length, 1);
  assert.match(app.uploads[0].name, /^barang_\d+\.jpg$/);
  assert.equal(app.uploads[0].file.type, 'image/jpeg');
  assert.ok(app.uploads[0].file.size <= 2 * 1024 * 1024);
  assert.equal(app.uploads[0].options.contentType, 'image/jpeg');
  assert.match(url, /barang_\d+\.jpg$/);
});

test('form tambah dan edit mengaktifkan kamera belakang di perangkat mobile', () => {
  for (const page of ['tambah.html', 'edit.html']) {
    const html = fs.readFileSync(path.join(__dirname, '..', 'pages', page), 'utf8');
    assert.match(html, /id="foto_file"[^>]*accept="image\/\*"[^>]*capture="environment"/);
    assert.match(html, /otomatis dikompres hingga 2 MB/);
  }
});
