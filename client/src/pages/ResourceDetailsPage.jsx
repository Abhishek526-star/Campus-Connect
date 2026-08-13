import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Bookmark,
  Download,
  ExternalLink,
  Flag,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetResourceQuery,
  useRateResourceMutation,
  useBookmarkResourceMutation,
  useUnbookmarkResourceMutation,
  useDownloadResourceMutation,
  useReportResourceMutation,
  useDeleteResourceMutation,
} from '../services/resourcesApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { formatNumber, formatDateTime } from '../utils/format.js';
import { cn } from '../utils/cn.js';

const FILE_TYPE_LABELS = { pdf: 'PDF', doc: 'DOC', ppt: 'PPT', video: 'Video', external: 'External link', notes: 'Notes' };

/**
 * Resource details (spec §15): view/download (external link for videos),
 * rate 1–5, bookmark, report; uploader edit/delete.
 */
export function ResourceDetailsPage() {
  useDocumentTitle('Resource');
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useSelector((state) => state.auth.user);

  const { data, isLoading, isError, refetch } = useGetResourceQuery(id);
  const [rateResource] = useRateResourceMutation();
  const [bookmark] = useBookmarkResourceMutation();
  const [unbookmark] = useUnbookmarkResourceMutation();
  const [downloadResource] = useDownloadResourceMutation();
  const [reportResource] = useReportResourceMutation();
  const [deleteResource] = useDeleteResourceMutation();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isError) {
    return <ErrorState title="Could not load this resource" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { resource } = data.data;
  const isOwner = me && (me.role === 'admin' || resource.uploadedBy?._id === me._id);

  const handleRate = async (rating) => {
    try {
      await rateResource({ id, rating }).unwrap();
      toast.success('Rating saved');
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save the rating.'));
    }
  };

  const handleBookmark = async () => {
    try {
      if (resource.isBookmarked) {
        await unbookmark(id).unwrap();
        toast.success('Bookmark removed');
      } else {
        await bookmark(id).unwrap();
        toast.success('Resource bookmarked');
      }
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update bookmark.'));
    }
  };

  const handleDownload = async () => {
    try {
      const { data: result } = await downloadResource(id).unwrap();
      window.open(result.url, '_blank', 'noopener,noreferrer');
      toast.success('Download started');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not download the resource.'));
    }
  };

  const handleReport = async () => {
    if (reportReason.trim().length < 3) {
      toast.error('Please provide a reason.');
      return;
    }
    try {
      await reportResource({ id, body: { reason: reportReason.trim() } }).unwrap();
      toast.success('Report submitted — our moderators will review it.');
      setReportOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit the report.'));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteResource(id).unwrap();
      toast.success('Resource deleted');
      navigate('/resources');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the resource.'));
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
            <Badge tone="primary">{resource.category}</Badge>
            {resource.subCategory && <Badge tone="slate">{resource.subCategory}</Badge>}
            {resource.subject && <Badge tone="violet">{resource.subject}</Badge>}
            {resource.semester && <Badge tone="slate">{resource.semester}</Badge>}
            <Badge tone="accent">{FILE_TYPE_LABELS[resource.fileType] ?? resource.fileType}</Badge>
            {resource.status !== 'approved' && <Badge tone="warning">{resource.status}</Badge>}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{resource.title}</h1>

          {resource.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{resource.description}</p>
          )}

          {(resource.tags ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-5 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-5">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{resource.avgRating?.toFixed(1) ?? '—'}</p>
              <p className="text-[11px] text-slate-400">avg rating · {formatNumber(resource.ratingCount)}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{formatNumber(resource.downloads)}</p>
              <p className="text-[11px] text-slate-400">downloads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{formatNumber(resource.bookmarks)}</p>
              <p className="text-[11px] text-slate-400">bookmarks</p>
            </div>
            <div className="flex items-center gap-3 pl-2">
              <Avatar src={resource.uploadedBy?.avatar?.url} name={resource.uploadedBy?.name} size="md" />
              <div>
                <p className="text-xs text-slate-400">Uploaded by</p>
                <Link to={`/profile/${resource.uploadedBy?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                  {resource.uploadedBy?.name ?? 'Uploader'}
                </Link>
                <p className="text-[11px] text-slate-400">{formatDateTime(resource.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="mt-5 border-t border-slate-100 pt-5">
            <p className="text-sm font-medium text-slate-700">Rate this resource</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(star)}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  className="rounded-lg p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'size-6',
                      star <= (resource.myRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
            {resource.status === 'approved' && (
              <Button onClick={handleDownload}>
                <Download className="size-4" aria-hidden="true" />
                {resource.fileType === 'external' ? 'Open resource' : 'Download'}
              </Button>
            )}
            <Button variant="outline" onClick={handleBookmark}>
              <Bookmark className={cn('size-4', resource.isBookmarked && 'fill-primary-500 text-primary-500')} aria-hidden="true" />
              {resource.isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            {resource.fileType === 'external' && resource.externalUrl && (
              <a
                href={resource.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <ExternalLink className="size-4" aria-hidden="true" /> Visit source
              </a>
            )}
            <Button variant="ghost" className="ml-auto text-red-600 hover:bg-red-50" onClick={() => setReportOpen(true)}>
              <Flag className="size-4" aria-hidden="true" /> Report
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" onClick={() => navigate(`/resources`)}>
                  <Pencil className="size-4" aria-hidden="true" /> Edit
                </Button>
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" aria-hidden="true" /> Delete
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this resource" size="md">
        <Textarea
          label="Reason"
          rows={3}
          required
          placeholder="e.g. Wrong content, copyright issue, broken link…"
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
        title="Delete this resource?"
        description="This permanently removes the resource and its ratings."
        confirmLabel="Delete"
      />
    </div>
  );
}
