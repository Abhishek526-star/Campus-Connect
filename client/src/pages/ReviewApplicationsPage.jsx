import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { GraduationCap, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetReviewApplicationsQuery,
  useReviewApplicationMutation,
} from '../services/scholarshipsApi.js';
import { ApplicationStatusBadge } from '../components/feature/scholarships/ApplicationStatusBadge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { getErrorMessage } from '../constants/index.js';
import { formatINR, timeAgo } from '../utils/format.js';

const REVIEW_STATUSES = [
  { value: 'all', label: 'All statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'funded', label: 'Funded' },
  { value: 'completed', label: 'Completed' },
];

/** Next action options per current status (state machine). */
const NEXT_ACTIONS = {
  applied: [
    { value: 'under_review', label: 'Move to under review' },
    { value: 'rejected', label: 'Reject' },
  ],
  under_review: [
    { value: 'shortlisted', label: 'Shortlist' },
    { value: 'rejected', label: 'Reject' },
  ],
  shortlisted: [
    { value: 'approved', label: 'Approve' },
    { value: 'rejected', label: 'Reject' },
  ],
  approved: [
    { value: 'funded', label: 'Mark funded' },
    { value: 'rejected', label: 'Reject' },
  ],
  funded: [{ value: 'completed', label: 'Mark completed' }],
  rejected: [],
  completed: [],
};

/**
 * Scholarship application review (spec §13): sponsors/admins review,
 * verify documents, shortlist, approve/reject, add comments, track funding.
 */
export function ReviewApplicationsPage() {
  useDocumentTitle('Review applications');
  const me = useSelector((state) => state.auth.user);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [reviewing, setReviewing] = useState(null); // application being reviewed
  const [action, setAction] = useState('');
  const [comment, setComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');

  const params = useMemo(() => ({ status: statusFilter, page, limit: 10 }), [statusFilter, page]);
  const { data, isLoading, isFetching, isError, refetch } = useGetReviewApplicationsQuery(params);

  const [reviewApplication, { isLoading: reviewingLoading }] = useReviewApplicationMutation();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const openReview = (application) => {
    setReviewing(application);
    setAction('');
    setComment('');
    setApprovedAmount('');
  };

  const handleReview = async () => {
    if (!reviewing || !action) {
      toast.error('Select an action.');
      return;
    }
    try {
      await reviewApplication({
        id: reviewing._id,
        body: {
          status: action,
          comment: comment || undefined,
          approvedAmount: action === 'approved' && approvedAmount ? Number(approvedAmount) : undefined,
        },
      }).unwrap();
      toast.success('Application updated');
      setReviewing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the application.'));
    }
  };

  if (isError) {
    return <ErrorState title="Could not load applications" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Users className="size-5 text-primary-600" aria-hidden="true" />
            Review applications
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {me?.role === 'admin' ? 'All applications across campaigns.' : 'Applications for scholarships you sponsor.'}
          </p>
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          options={REVIEW_STATUSES}
          className="sm:w-52"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent>
            <ListSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No applications here"
          description="Applications for your scholarships will appear here."
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {items.map((application) => (
                  <li key={application._id} className="p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <Avatar src={application.student?.avatar?.url} name={application.student?.name} size="md" />
                        <div className="min-w-0">
                          <Link to={`/profile/${application.student?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                            {application.student?.name}
                          </Link>
                          <p className="text-xs text-slate-400">{application.student?.email}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{application.scholarship?.name}</span> · Applied {timeAgo(application.createdAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                            <Badge tone="slate" size="sm">{application.rollNumber}</Badge>
                            <Badge tone="slate" size="sm">Income ₹{Number(application.familyIncome).toLocaleString('en-IN')}</Badge>
                            <Badge tone="slate" size="sm">Score {application.academicPerformance}%</Badge>
                            <Badge tone="slate" size="sm">{application.documents?.length ?? 0} docs</Badge>
                            {application.approvedAmount ? (
                              <Badge tone="success" size="sm">{formatINR(application.approvedAmount)}</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                        <ApplicationStatusBadge status={application.status} />
                        <Button variant="outline" size="sm" onClick={() => openReview(application)}>
                          Review
                        </Button>
                      </div>
                    </div>

                    {/* Quick comments */}
                    {application.reviewComments?.length > 0 && (
                      <div className="mt-3 rounded-xl bg-slate-50 p-3">
                        {application.reviewComments.map((c, index) => (
                          <p key={index} className="text-xs text-slate-600">“{c.text}”</p>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
          </div>
        </>
      )}

      {/* Review modal */}
      <Modal open={Boolean(reviewing)} onClose={() => setReviewing(null)} title={`Review: ${reviewing?.student?.name ?? ''}`} size="md">
        {reviewing && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-semibold text-slate-800">{reviewing.scholarship?.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {reviewing.rollNumber} · {reviewing.department} · Income ₹{Number(reviewing.familyIncome).toLocaleString('en-IN')}/yr · Score {reviewing.academicPerformance}%
              </p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">“{reviewing.reason}”</p>

              {/* Documents */}
              <div className="mt-3 border-t border-slate-200 pt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Documents</p>
                <div className="flex flex-wrap gap-2">
                  {reviewing.documents?.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-primary-300 hover:text-primary-700"
                    >
                      📄 {doc.name ?? `Document ${index + 1}`}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <Select
              label="Action"
              placeholder="Select next step"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              options={NEXT_ACTIONS[reviewing.status] ?? []}
            />
            {action === 'approved' && (
              <input
                type="number"
                min={1}
                value={approvedAmount}
                onChange={(event) => setApprovedAmount(event.target.value)}
                placeholder="Approved amount (₹)"
                aria-label="Approved amount"
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              />
            )}
            <Textarea label="Comment (optional)" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Notes for the student…" />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReviewing(null)} disabled={reviewingLoading}>
                Cancel
              </Button>
              <Button onClick={handleReview} loading={reviewingLoading} disabled={!action}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
