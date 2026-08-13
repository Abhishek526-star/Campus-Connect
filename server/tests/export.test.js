import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import { toPdfBuffer, toPdfSafeText } from '../utils/exporters.js';
import { renderCertificatePdf } from '../services/certificateService.js';

/**
 * Regression tests for the PDF pipeline (spec §40, §12, certificates):
 *  - column widths (Excel char-units) must be scaled so cells are NOT truncated
 *  - data rows must render real values — never the literal string "undefined"
 *  - non-WinAnsi characters (₹ etc.) must be sanitized, never mojibake
 */

const WINANSI = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: "'",
  0x92: "'", 0x93: '"', 0x94: '"', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ', 0xa0: ' ',
  0xad: '-',
};
const winansi = (byte) => (byte < 0x80 ? String.fromCharCode(byte) : (WINANSI[byte] ?? `\\x${byte.toString(16)}`));
const decodeBytes = (buf) => [...buf].map(winansi).join('');

/** Extract readable text from a pdfkit-generated PDF buffer. */
function pdfText(buffer) {
  const raw = buffer.toString('latin1');
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
    const arrays = [...s.matchAll(/\[((?:[^[\]]|\\[()\\])*)\]\s*TJ/g)];
    for (const t of arrays) {
      const items = [...t[1].matchAll(/<([0-9a-fA-F\s]+)>|\(((?:[^()\\]|\\.)*)\)/g)];
      for (const it of items) {
        if (it[1] !== undefined) {
          text += decodeBytes(Buffer.from(it[1].replace(/\s+/g, ''), 'hex'));
        } else if (it[2] !== undefined) {
          text += decodeBytes(Buffer.from(it[2].replace(/\\([()\\])/g, '$1'), 'latin1'));
        }
      }
    }
  }
  return text;
}

describe('PDF exporters (spec §40, §12)', () => {
  it('sanitizes non-WinAnsi characters (₹, em dash, Devanagari)', () => {
    expect(toPdfSafeText('₹1,000 — donation · fund')).toBe('Rs.1,000 - donation · fund');
    expect(toPdfSafeText('Campus “Connect” …')).toBe('Campus "Connect" ...');
    expect(toPdfSafeText('हिन्दी')).toBe('??????');
    expect(toPdfSafeText('Aarav Patel 123')).toBe('Aarav Patel 123');
    expect(toPdfSafeText(null)).toBe('');
  });

  it('renders data rows — never the literal string "undefined" (receipt shape)', async () => {
    const buffer = await toPdfBuffer({
      title: 'Donation Receipt',
      subtitle: 'Campus Connect · Receipt RCP-2026-1000',
      rows: [
        {
          donor: 'Rohan Mehta',
          email: 'rohan@campus.edu',
          scholarship: 'Merit Scholarship Fund',
          amount: '₹50,000',
          order: 'order_seed_0',
          payment: 'pay_seed_0',
          date: '12/8/2026, 5:32:17 pm',
        },
      ],
      columns: [
        { key: 'donor', header: 'Donor', width: 26 },
        { key: 'email', header: 'Email', width: 30 },
        { key: 'scholarship', header: 'Scholarship', width: 26 },
        { key: 'amount', header: 'Amount (INR)', width: 15 },
        { key: 'order', header: 'Order ID', width: 18 },
        { key: 'payment', header: 'Payment ID', width: 18 },
        { key: 'date', header: 'Date', width: 22 },
      ],
      landscape: true,
    });
    const text = pdfText(buffer);
    expect(text).toContain('Rohan Mehta');
    expect(text).toContain('Merit Scholarship Fund');
    expect(text).toContain('Rs.50,000');
    expect(text).toContain('12/8/2026, 5:32:17 pm');
    expect(text).not.toContain('undefined');
  });

  it('scales char-unit widths so headers and cells are not truncated', async () => {
    const buffer = await toPdfBuffer({
      title: 'Student list',
      subtitle: 'generated now',
      rows: [
        {
          name: 'Aarav Patel',
          email: 'student1@campus.edu',
          rollNumber: 'CSE-2025-001',
          department: 'Computer Science',
          course: 'B.Tech',
          year: '3',
          graduationYear: '2026',
          location: 'Gorakhpur',
          reputation: 20,
        },
      ],
      columns: [
        { key: 'name', header: 'Name', width: 26 },
        { key: 'email', header: 'Email', width: 30 },
        { key: 'rollNumber', header: 'Roll number', width: 18 },
        { key: 'department', header: 'Department', width: 26 },
        { key: 'course', header: 'Course', width: 18 },
        { key: 'year', header: 'Year', width: 10 },
        { key: 'graduationYear', header: 'Grad year', width: 12 },
        { key: 'location', header: 'Location', width: 18 },
        { key: 'reputation', header: 'Reputation', width: 16 },
      ],
      landscape: true,
    });
    const text = pdfText(buffer);
    expect(text).toContain('Name');
    expect(text).toContain('Email');
    expect(text).toContain('Roll number');
    expect(text).toContain('Reputation');
    expect(text).toContain('Aarav Patel');
    expect(text).toContain('student1@campus.edu');
    expect(text).toContain('CSE-2025-001');
  });

  it('renders certificate values (was "undefined" before the fix)', async () => {
    const { buffer } = await renderCertificatePdf({
      event: { title: 'Hackathon 2026', date: new Date('2026-06-15'), organizer: '65f0a1b2c3d4e5f6a7b8c9d0' },
      user: { name: 'Aarav Patel' },
      certificateId: 'CERT-2026-0001',
    });
    const text = pdfText(buffer);
    expect(text).toContain('Hackathon 2026');
    expect(text).toContain('CERT-2026-0001');
    expect(text).toContain('Aarav Patel');
    expect(text).not.toContain('undefined');
  });
});
