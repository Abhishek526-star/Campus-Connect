import { useState } from 'react';
import QRCode from 'qrcode';
import { Clock, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useGenerateQrTokenMutation } from '../../../services/attendanceApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Badge } from '../../ui/Badge.jsx';
import { Button } from '../../ui/Button.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Select } from '../../ui/Select.jsx';
import { Skeleton } from '../../ui/Skeleton.jsx';
import { formatTime } from '../../../utils/format.js';

/**
 * Organizer QR generator (spec §10): rotating per-event token with expiry.
 * The server returns a signed token (eventId:secret:expiry); only its hash
 * is stored server-side. Old QR codes stop working the moment a new one is
 * generated (rotating secret) or the token expires.
 *
 * `compact` renders an icon-only button — used on event cards.
 */
export function QrGenerator({ eventId, eventTitle, compact = false }) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState('15');
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [generateQrToken, { isLoading }] = useGenerateQrTokenMutation();

  const handleGenerate = async () => {
    try {
      const { data } = await generateQrToken({ eventId, durationMinutes: Number(duration) }).unwrap();
      const { token, expiresAt: exp } = data;
      const url = await QRCode.toDataURL(token, { width: 320, margin: 1, errorCorrectionLevel: 'M' });
      setQrDataUrl(url);
      setExpiresAt(new Date(exp));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not generate the QR code.'));
    }
  };

  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Generate attendance QR for ${eventTitle ?? 'event'}`}
          title="Attendance QR code"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600"
        >
          <QrCode className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ShieldCheck className="size-4" aria-hidden="true" /> QR code
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Attendance QR code" description={eventTitle} size="md">
        <div className="space-y-4">
          <Select
            label="Validity"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            options={[
              { value: '5', label: '5 minutes' },
              { value: '15', label: '15 minutes' },
              { value: '30', label: '30 minutes' },
              { value: '60', label: '1 hour' },
            ]}
          />
          <Button onClick={handleGenerate} loading={isLoading}>
            <RefreshCw className="size-4" aria-hidden="true" /> {qrDataUrl ? 'Rotate QR code' : 'Generate QR code'}
          </Button>

          {isLoading ? (
            <Skeleton className="mx-auto size-72" />
          ) : qrDataUrl ? (
            <div className="mx-auto max-w-xs space-y-3 text-center">
              <img src={qrDataUrl} alt={`QR code for ${eventTitle}`} className="mx-auto rounded-xl border border-slate-200 p-2 shadow-sm" />
              <p className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Clock className="size-4 text-slate-400" aria-hidden="true" />
                Expires at {expiresAt ? formatTime(expiresAt.toTimeString().slice(0, 5)) : ''} — scan to check in
              </p>
              <Badge tone="warning" size="sm">Rotates on every generation — old codes stop working</Badge>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Generate a unique, expiring QR code that students scan to mark their attendance.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
