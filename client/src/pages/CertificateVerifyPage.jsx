import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { BadgeCheck, ShieldCheck, XCircle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useVerifyCertificateQuery } from '../services/certificatesApi.js';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { formatDate } from '../utils/format.js';

/**
 * Public certificate verification (spec §29): scan the QR on any certificate
 * and land here — name, event, date, and validity are shown.
 */
export function CertificateVerifyPage() {
  useDocumentTitle('Verify certificate');
  const [searchParams, setSearchParams] = useSearchParams();
  const [manualId, setManualId] = useState('');
  const certificateId = searchParams.get('certificateId') ?? '';

  const { data, isLoading, isError } = useVerifyCertificateQuery(certificateId, { skip: !certificateId });

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="shadow-xl shadow-slate-200/60">
          <CardContent className="px-6 py-8 text-center sm:px-8">
            {!certificateId ? (
              <>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-50">
                  <ShieldCheck className="size-7 text-primary-600" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-xl font-bold text-slate-900">Verify a certificate</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Enter the certificate ID shown on the certificate (or scan its QR code).
                </p>
                <div className="mt-5 flex gap-2">
                  <Input
                    placeholder="e.g. CC-ABCDEF-1A2B3C4D"
                    value={manualId}
                    onChange={(event) => setManualId(event.target.value)}
                    aria-label="Certificate ID"
                  />
                  <Button
                    variant="outline"
                    onClick={() => manualId.trim() && setSearchParams({ certificateId: manualId.trim() })}
                  >
                    Verify
                  </Button>
                </div>
              </>
            ) : isLoading ? (
              <p className="py-8 text-sm text-slate-400">Verifying certificate…</p>
            ) : isError ? (
              <>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-red-50">
                  <XCircle className="size-7 text-red-500" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-xl font-bold text-slate-900">Certificate not found</h1>
                <p className="mt-2 text-sm text-slate-500">
                  This certificate ID does not exist. Check the ID or contact the organizer.
                </p>
              </>
            ) : (
              <>
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-50">
                  <BadgeCheck className="size-7 text-accent-600" aria-hidden="true" />
                </span>
                <h1 className="mt-4 text-xl font-bold text-slate-900">✓ Certificate verified</h1>
                <p className="mt-1 text-sm text-slate-500">This is an authentic Campus Connect certificate.</p>

                <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-left text-sm">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="font-semibold text-slate-900">{data?.data?.name}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Event</span>
                    <span className="font-semibold text-slate-900">{data?.data?.event}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-semibold text-slate-900">{data?.data?.date ? formatDate(data.data.date) : '—'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Certificate ID</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">{data?.data?.certificateId}</span>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
