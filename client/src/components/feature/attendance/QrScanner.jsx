import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useCheckInMutation } from '../../../services/attendanceApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Badge } from '../../ui/Badge.jsx';

const SCANNER_ID = 'attendance-qr-scanner';

/**
 * QR scanner for attendance check-in (spec §10, §28 mobile-friendly).
 * Opens the camera, decodes the event QR, and POSTs the token to the
 * server — which validates the rotating secret, expiry, registration,
 * and duplicate prevention. Manual token entry provided as fallback
 * (cameras unavailable on some devices).
 */
export function QrScanner({ eventTitle }) {
  const [open, setOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const [checkIn, { isLoading }] = useCheckInMutation();

  const submitCheckIn = async (token) => {
    if (!token?.trim()) {
      toast.error('Please provide a QR token.');
      return;
    }
    try {
      const { data } = await checkIn(token.trim()).unwrap();
      toast.success(`Checked in: ${data.event.title}`);
      setOpen(false);
      setManualToken('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not check in.'));
    }
  };

  const startScanner = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Decoded the QR token → stop the camera and check in.
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          void submitCheckIn(decodedText);
        },
        () => {
          // per-frame decode miss — ignore
        },
      );
    } catch {
      setCameraError('Could not access the camera — use manual entry below instead.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // already stopped
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        void startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        void stopScanner();
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <QrCode className="size-4" aria-hidden="true" /> Scan QR to check in
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Check in with QR" description={eventTitle} size="md">
        <div className="space-y-4">
          <div id={SCANNER_ID} className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-900" />

          {cameraError && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="alert">
              {cameraError}
            </p>
          )}

          <div className="mx-auto max-w-sm">
            <p className="mb-2 text-xs font-medium text-slate-500">Camera unavailable? Enter the token manually:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(event) => setManualToken(event.target.value)}
                placeholder="Paste QR token"
                aria-label="QR token"
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              />
              <Button variant="outline" onClick={() => submitCheckIn(manualToken)} loading={isLoading}>
                Check in
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Badge tone="slate" size="sm">QRs rotate & expire — old codes are rejected</Badge>
          </div>
        </div>
      </Modal>
    </>
  );
}
