import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/**
 * Lightweight exporters — CSV (hand-rolled, no unstable deps), XLSX (exceljs),
 * PDF (pdfkit). Used by attendance, reports, receipts, and certificates.
 *
 * `columns` format: [{ key, header, width?, align? }]
 */

const escapeCsv = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/["\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export function toCsvBuffer(rows, columns) {
  const header = columns.map((c) => escapeCsv(c.header)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsv(c.render ? c.render(row) : row[c.key])).join(','),
  );
  // Prepend UTF-8 BOM so Excel opens Indian/international characters correctly.
  const csv = '\uFEFF' + [header, ...lines].join('\r\n') + '\r\n';
  return Buffer.from(csv, 'utf8');
}

export async function toXlsxBuffer(rows, columns) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');

  sheet.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 20,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEFB' } };

  rows.forEach((row) => {
    const out = {};
    columns.forEach((c) => {
      out[c.key] = c.render ? c.render(row) : row[c.key];
    });
    sheet.addRow(out);
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

/**
 * PDFKit's built-in fonts (Helvetica/Courier/Times) only support the WinAnsi
 * encoding. Characters outside it are NOT handled safely: pdfkit truncates the
 * code point to a byte (₹ U+20B9 → byte 0xB9 → renders as “¹”) or drops it.
 * Map common ones to ASCII equivalents and replace anything else with '?' so
 * PDFs can never contain mojibake.
 */
const PDF_TEXT_REPLACEMENTS = {
  '\u20B9': 'Rs.', // ₹ Indian rupee sign
  '\u2013': '-', // – en dash
  '\u2014': '-', // — em dash
  '\u2026': '...', // … ellipsis
  '\u2018': "'", // ‘ left single quotation mark
  '\u2019': "'", // ’ right single quotation mark
  '\u201C': '"', // “ left double quotation mark
  '\u201D': '"', // ” right double quotation mark
  '\u2022': '-', // • bullet
  '\u00A0': ' ', // no-break space
};

/** Unicode code points representable in WinAnsiEncoding (beyond ASCII). */
const WINANSI_HIGH = new Set([
  0x80, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8e,
  0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9e, 0x9f,
  0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad,
  0xae, 0xaf, 0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb,
  0xbc, 0xbd, 0xbe, 0xbf, 0xc0, 0xc1, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9,
  0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7,
  0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf, 0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5,
  0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef, 0xf0, 0xf1, 0xf2, 0xf3,
  0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff,
]);

/** Make any string safe to render with PDFKit's standard WinAnsi fonts. */
export function toPdfSafeText(value) {
  return String(value ?? '')
    .split('')
    .map((ch) => {
      if (PDF_TEXT_REPLACEMENTS[ch]) return PDF_TEXT_REPLACEMENTS[ch];
      const code = ch.codePointAt(0);
      if (code < 0x80 || WINANSI_HIGH.has(code)) return ch;
      return '?';
    })
    .join('');
}

/**
 * Render a simple table + title into a PDF buffer.
 *
 * `columns[].width` is authored in Excel-style character units (shared with
 * toXlsxBuffer), so widths are scaled to fill the page in points here.
 */
export async function toPdfBuffer({ title, subtitle, rows, columns, landscape = false }) {
  const doc = new PDFDocument({ size: 'A4', layout: landscape ? 'landscape' : 'portrait', margin: 40 });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', resolve));

  const pageWidth = (landscape ? 841.89 : 595.28) - 80;

  // Scale Excel-style character-unit widths to fill the page in points;
  // shrink proportionally when the authored widths overflow the page.
  const rawWidths = columns.map((c) => c.width ?? Math.floor(pageWidth / columns.length));
  const widthSum = rawWidths.reduce((a, b) => a + b, 0) || columns.length;
  const widthScale = pageWidth / widthSum;
  const colWidths = rawWidths.map((w) => Math.max(24, Math.round(w * widthScale)));

  doc.fontSize(16).fillColor('#1e3a8a').text(toPdfSafeText(title), { align: 'center' });
  if (subtitle) {
    doc.moveDown(0.3).fontSize(10).fillColor('#64748b').text(toPdfSafeText(subtitle), { align: 'center' });
  }
  doc.moveDown(1.2).fillColor('#0f172a');

  const rowHeight = 20;
  const startX = 40;
  let y = doc.y;

  const drawRow = (cells, isHeader) => {
    const maxY = y + rowHeight;
    cells.forEach((cell, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      if (isHeader) {
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e3a8a');
      } else {
        doc.font('Helvetica').fontSize(8.5).fillColor('#0f172a');
      }
      doc.text(toPdfSafeText(cell), x + 4, y + 5, { width: colWidths[i] - 8, height: rowHeight - 8, ellipsis: true });
    });
    if (isHeader) {
      doc.rect(startX, y, pageWidth, rowHeight).fillOpacity(0.08).fill('#2563eb').fillOpacity(1);
    }
    doc.moveTo(startX, maxY).lineTo(startX + pageWidth, maxY).strokeColor('#e2e8f0').stroke();
    y = maxY;
  };

  drawRow(columns.map((c) => c.header), true);
  rows.forEach((row) => {
    if (y > (landscape ? 540 : 760)) {
      doc.addPage();
      y = doc.y;
      drawRow(columns.map((c) => c.header), true);
    }
    drawRow(columns.map((c) => (c.render ? c.render(row) : row[c.key])), false);
  });

  doc.end();
  await done;
  return Buffer.concat(chunks);
}
