/**
 * Minimal PDF text extractor for pdfkit-generated files.
 * Decodes hex (<...>) and literal ((...)) strings inside Tj/TJ operators.
 */
/* global Buffer, process, console */
import fs from 'node:fs';
import zlib from 'node:zlib';

const WINANSI = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: "'",
  0x92: "'", 0x93: '"', 0x94: '"', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ', 0xa0: ' ',
  0xad: '-',
};

function winansi(byte) {
  if (byte < 0x80) return String.fromCharCode(byte);
  return WINANSI[byte] ?? `\\x${byte.toString(16)}`;
}

function decodeBytes(buf) {
  return [...buf].map(winansi).join('');
}

function decodeHexString(hex) {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) return `[odd-hex:${hex}]`;
  const bytes = Buffer.from(clean, 'hex');
  return decodeBytes(bytes);
}

function decodeLiteralString(inner) {
  const unescaped = inner.replace(/\\([()\\])/g, '$1').replace(/\\(\d{1,3})/g, (_, n) => String.fromCharCode(parseInt(n, 8)));
  return decodeBytes(Buffer.from(unescaped, 'latin1'));
}

function extract(file) {
  const buf = fs.readFileSync(file);
  const raw = buf.toString('latin1');
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)endstream/g)];
  let text = '';
  for (const m of streams) {
    let data;
    try {
      data = zlib.inflateSync(Buffer.from(m[1], 'latin1'));
    } catch {
      continue;
    }
    const s = data.toString('latin1');
    // Any TJ array (mix of hex/literal/number kerning items)
    const tjs = [...s.matchAll(/\[((?:[^[\]]|\\[()\\])*)\]\s*TJ/g)];
    for (const t of tjs) {
      const items = [...t[1].matchAll(/<([0-9a-fA-F\s]+)>|\(((?:[^()\\]|\\.)*)\)/g)];
      let lastByteCount = 0;
      for (const it of items) {
        if (it[1] !== undefined) {
          text += decodeHexString(it[1]);
          lastByteCount = it[1].replace(/\s+/g, '').length / 2;
        } else if (it[2] !== undefined) {
          text += decodeLiteralString(it[2]);
          lastByteCount = it[2].length;
        }
      }
      if (lastByteCount) text += '|';
    }
    // Standalone Tj
    const tjs2 = [...s.matchAll(/\[([^\]]*)\]\s*Tj/g)];
    for (const t of tjs2) {
      const items = [...t[1].matchAll(/<([0-9a-fA-F\s]+)>|\(((?:[^()\\]|\\.)*)\)/g)];
      for (const it of items) {
        if (it[1] !== undefined) text += decodeHexString(it[1]);
        else if (it[2] !== undefined) text += decodeLiteralString(it[2]);
      }
    }
    const single = [...s.matchAll(/\(((?:[^()\\]|\\.)*)\)\s*Tj/g)];
    for (const t of single) text += decodeLiteralString(t[1]);
    const singleHex = [...s.matchAll(/<([0-9a-fA-F\s]+)>\s*Tj/g)];
    for (const t of singleHex) text += decodeHexString(t[1]);
  }
  return text;
}

for (const f of process.argv.slice(2)) {
  console.log(`\n========== ${f} ==========`);
  console.log(extract(f));
}
