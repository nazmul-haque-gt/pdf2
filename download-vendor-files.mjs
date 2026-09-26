#!/usr/bin/env node
// Run this ONCE, on any machine with internet and Node 18+, from the repo
// root (`node download-vendor-files.mjs`). It downloads the PDF renderer,
// PDF export engine, and OCR engine — the same libraries
// download-vendor-files.ps1 fetched, just cross-platform — into
// www/vendor/. Commit that folder afterwards and the app never needs to
// reach a CDN again, on first launch or any launch after, on desktop or
// Android.
//
// The only feature that still needs internet afterwards is "Translate
// selection", since that calls Google's Gemini API directly.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), 'www', 'vendor');

const FILES = [
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjs/pdf.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js', 'pdfjs/pdf.worker.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 'pdflib/pdf-lib.min.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', 'tesseract/tesseract.min.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js', 'tesseract/worker.min.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm.js', 'tesseract-core/tesseract-core.wasm.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core.wasm', 'tesseract-core/tesseract-core.wasm'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm.js', 'tesseract-core/tesseract-core-simd.wasm.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd.wasm', 'tesseract-core/tesseract-core-simd.wasm'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm.js', 'tesseract-core/tesseract-core-lstm.wasm.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-lstm.wasm', 'tesseract-core/tesseract-core-lstm.wasm'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm.js', 'tesseract-core/tesseract-core-simd-lstm.wasm.js'],
  ['https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/tesseract-core-simd-lstm.wasm', 'tesseract-core/tesseract-core-simd-lstm.wasm'],
  // English OCR language data. To add another language later, add a line
  // like the one below (get the right package/version from
  // https://www.jsdelivr.com/package/npm/@tesseract.js-data), then in
  // www/index.html and www/final.html change `var OCR_LANG = 'eng';` to
  // e.g. `var OCR_LANG = 'eng+ben';`
  //   ['https://cdn.jsdelivr.net/npm/@tesseract.js-data/ben@1.0.0/4.0.0_best_int/ben.traineddata.gz', 'tessdata/ben.traineddata.gz'],
  ['https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng@1.0.0/4.0.0_best_int/eng.traineddata.gz', 'tessdata/eng.traineddata.gz'],
];

async function download(url, relPath, attempt = 1) {
  const dest = join(ROOT, relPath);
  process.stdout.write(`Downloading ${relPath} ... `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    console.log(`ok (${buf.length.toLocaleString()} bytes)`);
  } catch (err) {
    if (attempt >= 3) {
      throw new Error(`Failed to download ${relPath} from ${url} after 3 attempts: ${err.message}`);
    }
    console.log(`retry (${err.message})`);
    await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
    return download(url, relPath, attempt + 1);
  }
}

for (const [url, relPath] of FILES) {
  await download(url, relPath);
}

console.log('\nDone. www/vendor/ is populated — commit it and push.');
console.log('The app will use these local files automatically and needs');
console.log('no internet at all after that, on desktop or Android.');
