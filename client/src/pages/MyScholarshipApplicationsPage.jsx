import { Link } from 'react-router';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMyApplicationsQuery } from '../services/scholarshipsApi.js';
import { ApplicationStatusBadge } from '../components/feature/scholarships/ApplicationStatusBadge.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { formatDate, formatINR, timeAgo } from '../utils/format.js';

/**
 * Student scholarship dashboard (spec §13): available scholarships are on the
 * Scholarships page; this is the tracker — status, documents, approved amount,
 * review comments, funding state.
 */
export function MyScholarshipApplicationsPage() {
  useDocumentTitle('My applications');
  const { data, isLoading, isError, refetch } = useGetMyApplicationsQuery();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <GraduationCap className="size-5 text-accent-600" aria-hidden="true" />
          My scholarship applications
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Track every application from submission to funding.</p>
      </div>

      <Link
        to="/scholarships"
        className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-800 transition-colors hover:bg-primary-100"
      >
        Browse more scholarships
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isLoading ? (
            <ListSkeleton rows={4} />
          ) : (data?.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No applications yet"
              description="Apply for a scholarship to see its status here."
              action={
                <Link to="/scholarships" className="text-sm font-semibold text-primary-600 hover:underline">
                  Explore scholarships →
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {(data?.data?.items ?? []).map((application) => (
                <li key={application._id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/scholarships/${application.scholarship?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                        {application.scholarship?.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Applied {timeAgo(application.createdAt)} · Deadline {application.scholarship?.deadline ? formatDate(application.scholarship.deadline) : '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Badge tone="slate" size="sm">Income ₹{Number(application.familyIncome).toLocaleString('en-IN')}/yr</Badge>
                        <Badge tone="slate" size="sm">Score {application.academicPerformance}%</Badge>
                        <Badge tone="slate" size="sm">{application.documents?.length ?? 0} document{(application.documents?.length ?? 0) === 1 ? '' : 's'}</Badge>
                        {application.approvedAmount ? (
                          <Badge tone="success" size="sm">{formatINR(application.approvedAmount)} approved</Badge>
                        ) : null}
                      </div>
                    </div>
                    <ApplicationStatusBadge status={application.status} />
                  </div>

                  {application.reviewComments?.length > 0 && (
                    <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reviewer comments</p>
                      {application.reviewComments.map((comment, index) => (
                        <p key={index} className="text-xs text-slate-600">“{comment.text}”</p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
