import { useState } from 'react';
import { CalendarCheck, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetReportTypesQuery, useDownloadReportMutation } from '../services/operationsApi.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { getErrorMessage } from '../constants/index.js';
import { exportFileName, saveBlob } from '../utils/download.js';

/**
 * Reports page (spec §40): export students/alumni/faculty/event-participants/
 * attendance/scholarship-applications/donations/jobs/internships as
 * CSV, Excel, or PDF.
 */
export function AdminReportsPage() {
  useDocumentTitle('Reports');
  const { data, isLoading, isError, refetch } = useGetReportTypesQuery();
  const [downloadReport, { isLoading: exporting }] = useDownloadReportMutation();
  const [activeFormat, setActiveFormat] = useState(null);

  const types = data?.data?.items ?? [];

  const handleExport = async (report, format) => {
    if (exporting) return;
    setActiveFormat(format);
    try {
      const blob = await downloadReport({ type: report.key, format }).unwrap();
      saveBlob(blob, exportFileName(report.key, format));
      toast.success(`${report.label} exported as ${format.toUpperCase()}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Export failed. Please try again.'));
    } finally {
      setActiveFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <CalendarCheck className="size-5 text-primary-600" aria-hidden="true" />
          Reports
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Export community data in CSV, Excel, or PDF.</p>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : types.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No reports available" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((report) => (
            <Card key={report.key} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50">
                  <FileText className="size-5 text-primary-600" aria-hidden="true" />
                </span>
                <Badge tone="slate" size="sm">{report.label}</Badge>
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{report.label}</h3>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={exporting}
                  loading={activeFormat === 'csv'}
                  onClick={() => handleExport(report, 'csv')}
                >
                  {activeFormat !== 'csv' && <Download className="size-3.5" aria-hidden="true" />}
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-accent-300 bg-accent-50 font-semibold text-accent-700 shadow-sm hover:bg-accent-100"
                  disabled={exporting}
                  loading={activeFormat === 'xlsx'}
                  onClick={() => handleExport(report, 'xlsx')}
                >
                  {activeFormat !== 'xlsx' && <FileSpreadsheet className="size-3.5" aria-hidden="true" />}
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-primary-300 bg-primary-50 font-semibold text-primary-700 shadow-sm hover:bg-primary-100"
                  disabled={exporting}
                  loading={activeFormat === 'pdf'}
                  onClick={() => handleExport(report, 'pdf')}
                >
                  {activeFormat !== 'pdf' && <FileText className="size-3.5" aria-hidden="true" />}
                  PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
