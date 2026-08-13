import QRCode from 'qrcode';

/** Generate a QR code as a data URL (used for event attendance + certificates). */
export async function qrDataUrl(text, { width = 320, margin = 1 } = {}) {
  return QRCode.toDataURL(text, { width, margin, errorCorrectionLevel: 'M' });
}

/** Generate a QR code as a PNG buffer (used for PDF certificates). */
export async function qrPngBuffer(text, { width = 320, margin = 1 } = {}) {
  return QRCode.toBuffer(text, { width, margin, errorCorrectionLevel: 'M' });
}
