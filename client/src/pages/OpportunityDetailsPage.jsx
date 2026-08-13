import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Bookmark,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetJobQuery,
  useSaveJobMutation,
  useUnsaveJobMutation,
  useApplyToJobMutation,
  useReportJobMutation,
  useDeleteJobMutation,
} from '../services/jobsApi.js';
import { getErrorMessage } from '../constants/index.js';
import { JobFormModal } from '../components/feature/jobs/JobFormModal.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../components/feature/jobs/jobConstants.js';
import { formatDate, formatDateTime } from '../utils/format.js';

/**
 * Opportunity details (spec §14): full info, save/share/apply/report,
 * platform vs external apply, poster edit/delete.
 */
export function OpportunityDetailsPage() {
  useDocumentTitle('Opportunity');
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useSelector((state) => state.auth.user);

  const { data, isLoading, isError, refetch } = useGetJobQuery(id);
  const [saveJob] = useSaveJobMutation();
  const [unsaveJob] = useUnsaveJobMutation();
  const [applyToJob] = useApplyToJobMutation();
  const [reportJob] = useReportJobMutation();
  const [deleteJob] = useDeleteJobMutation();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (isError) {
    return <ErrorState title="Could not load this opportunity" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { job } = data.data;
  const isOwner = me && (me.role === 'admin' || job.postedBy?._id === me._id);

  const handleSave = async () => {
    try {
      if (job.isSaved) {
        await unsaveJob(id).unwrap();
        toast.success('Removed from saved');
      } else {
        await saveJob(id).unwrap();
        toast.success('Opportunity saved');
      }
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update saved list.'));
    }
  };

  const handleApply = async () => {
    try {
      const result = await applyToJob(id).unwrap();
      if (result.data.external && result.data.applicationLink) {
        toast.success('Opening the application link…');
        window.open(result.data.applicationLink, '_blank', 'noopener,noreferrer');
      } else {
        toast.success('Application submitted! The poster has been notified.');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not apply.'));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  const handleReport = async () => {
    if (reportReason.trim().length < 3) {
      toast.error('Please provide a reason.');
      return;
    }
    try {
      await reportJob({ jobId: id, reason: reportReason.trim() }).unwrap();
      toast.success('Report submitted — our moderators will review it.');
      setReportOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit the report.'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(id).unwrap();
      toast.success('Opportunity deleted');
      navigate('/opportunities');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the opportunity.'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{JOB_TYPE_LABELS[job.type] ?? job.type}</Badge>
            <Badge tone="accent">{WORK_MODE_LABELS[job.workMode] ?? job.workMode}</Badge>
            {job.isFeatured && <Badge tone="warning">Featured</Badge>}
            {job.status !== 'approved' && <Badge tone="slate">{job.status}</Badge>}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{job.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
            <Building2 className="size-4 text-slate-400" aria-hidden="true" /> {job.company}
          </p>

          <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {job.location && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="size-4 text-slate-400" aria-hidden="true" /> {job.location}
              </p>
            )}
            {job.salary && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="size-4 text-slate-400" aria-hidden="true" /> {job.salary}
              </p>
            )}
            {job.experience && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Briefcase className="size-4 text-slate-400" aria-hidden="true" /> {job.experience} experience
              </p>
            )}
            {job.deadline && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarDays className="size-4 text-slate-400" aria-hidden="true" /> Apply by {formatDate(job.deadline)}
              </p>
            )}
          </div>

          {(job.skills ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                  {skill}
                </span>
              ))}
            </div>
          )}

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
          {job.eligibility && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Eligibility</p>
              <p className="mt-1 text-sm text-slate-600">{job.eligibility}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${job.postedBy?._id}`}>
                <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="md" />
              </Link>
              <div>
                <p className="text-xs text-slate-400">Posted by</p>
                <Link to={`/profile/${job.postedBy?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                  {job.postedBy?.name ?? 'Alumni'}
                </Link>
                <p className="text-[11px] text-slate-400">{formatDateTime(job.createdAt)} · {job.views} views</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={handleSave}>
                <Bookmark className={`size-4 ${job.isSaved ? 'fill-primary-500 text-primary-500' : ''}`} aria-hidden="true" />
                {job.isSaved ? 'Saved' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Send className="size-4" aria-hidden="true" /> Share
              </Button>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => setReportOpen(true)}>
                <Flag className="size-4" aria-hidden="true" /> Report
              </Button>
            </div>
          </div>

          {/* Apply area */}
          {job.status === 'approved' && !isOwner && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              {job.applyThroughPlatform ? (
                job.hasApplied ? (
                  <div className="flex items-center gap-2 rounded-xl bg-accent-50 px-4 py-3">
                    <CheckCircle2 className="size-5 text-accent-600" aria-hidden="true" />
                    <p className="text-sm font-medium text-accent-800">You have applied for this opportunity.</p>
                  </div>
                ) : (
                  <Button size="lg" onClick={handleApply}>
                    <Briefcase className="size-4" aria-hidden="true" /> Apply on Campus Connect
                  </Button>
                )
              ) : (
                <a
                  href={job.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                >
                  <ExternalLink className="size-4" aria-hidden="true" /> Apply externally
                </a>
              )}
            </div>
          )}

          {isOwner && (
            <div className="mt-5 flex gap-2 border-t border-slate-100 pt-5">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" aria-hidden="true" /> Edit
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" aria-hidden="true" /> Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <JobFormModal open={editOpen} onClose={() => setEditOpen(false)} job={job} />

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this opportunity" size="md">
        <Textarea
          label="Reason"
          rows={3}
          required
          placeholder="e.g. Spam, misleading information, expired listing…"
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleReport}>Submit report</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this opportunity?"
        description="This permanently removes the listing."
        confirmLabel="Delete"
      />
    </div>
  );
}
