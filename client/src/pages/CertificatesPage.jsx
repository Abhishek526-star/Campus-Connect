import { Award, Download } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMyCertificatesQuery } from '../services/certificatesApi.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { formatDate } from '../utils/format.js';

/**
 * My certificates (spec §29): participation certificates with unique IDs,
 * QR verification link, and PDF download.
 */
export function CertificatesPage() {
  useDocumentTitle('Certificates');
  const { data, isLoading, isError, refetch } = useGetMyCertificatesQuery();

  const items = data?.data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Award className="size-5 text-amber-500" aria-hidden="true" />
          My Certificates
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Participation certificates from events you attended — verifiable by QR.
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <Card>
          <CardContent>
            <ListSkeleton rows={3} />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Attend events and check in with the QR code — organizers issue certificates after the event."
        />
      ) : (
        <div className="space-y-4">
          {items.map((certificate) => (
            <Card key={certificate._id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary-700 to-accent-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">🎓 Certificate of Participation</p>
                  <Badge tone="warning" size="sm">{formatDate(certificate.issuedAt)}</Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{certificate.event?.title ?? 'Event'}</h3>
                    <p className="text-sm text-slate-500">
                      {certificate.event?.date ? formatDate(certificate.event.date) : ''} · Certificate ID:{' '}
                      <span className="font-mono font-semibold text-slate-700">{certificate.certificateId}</span>
                    </p>
                  </div>
                  {certificate.pdf?.url ? (
                    <a
                      href={certificate.pdf.url}
                      download={certificate.pdf.name}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                    >
                      <Download className="size-4" aria-hidden="true" /> Download PDF
                    </a>
                  ) : (
                    <Badge tone="slate" size="sm">PDF pending</Badge>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
                  <span>🔍 Verify with the QR on the certificate:</span>
                  <code className="rounded bg-slate-100 px-2 py-1 text-[10px]">
                    /certificates/verify?certificateId={certificate.certificateId}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
