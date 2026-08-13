/**
 * Shared helpers for authenticated file downloads.
 *
 * Server-protected files (reports, attendance exports, donation receipts)
 * require the `Authorization: Bearer` header, which a plain <a href> navigation
 * can never send (the access token lives in memory, not in a cookie). So all
 * downloads go through the API layer (fetch + refresh-on-401) and the response
 * is saved as a Blob via these helpers.
 */

const FORMAT_EXT = { csv: 'csv', xlsx: 'xlsx', pdf: 'pdf' };

/** Builds a safe, dated filename for an exported file. */
export function exportFileName(base, format, stamp = new Date()) {
  const ext = FORMAT_EXT[format] ?? 'csv';
  const date = stamp.toISOString().slice(0, 10);
  return `${base}-${date}.${ext}`;
}

/** Triggers a browser download from a Blob. */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
