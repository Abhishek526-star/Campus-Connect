import { useState } from 'react';
import { Megaphone, Pin, Plus, Trash2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useTogglePinMutation,
} from '../services/announcementsApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { toast } from 'sonner';
import { getErrorMessage } from '../constants/index.js';
import { timeAgo } from '../utils/format.js';

const CAN_PUBLISH = ['faculty', 'admin'];

const CATEGORY_LABELS = {
  general: 'General',
  exam: 'Exam',
  placement: 'Placement',
  event: 'Event',
  scholarship: 'Scholarship',
  internship: 'Internship',
  notice: 'Notice',
};

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'student', label: 'Students only' },
  { value: 'faculty', label: 'Faculty only' },
  { value: 'alumni', label: 'Alumni only' },
];

/**
 * Announcements (spec §17): audience-aware list, publish (faculty/admin),
 * pin, delete; publishing auto-notifies the audience.
 */
export function AnnouncementsPage() {
  useDocumentTitle('Announcements');
  const me = useSelector((state) => state.auth.user);
  const canPublish = CAN_PUBLISH.includes(me?.role);

  const [page, setPage] = useState(1);
  const [publishOpen, setPublishOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [audience, setAudience] = useState('all');

  const { data, isLoading, isError, refetch } = useGetAnnouncementsQuery({ page, limit: 10 });
  const [createAnnouncement, { isLoading: creating }] = useCreateAnnouncementMutation();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [togglePin] = useTogglePinMutation();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const handlePublish = async () => {
    if (title.trim().length < 3 || body.trim().length < 5) {
      toast.error('Title and content are required.');
      return;
    }
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        category,
        audience,
      }).unwrap();
      toast.success('Announcement published — notifications sent to the audience');
      setPublishOpen(false);
      setTitle('');
      setBody('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not publish the announcement.'));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteAnnouncement(confirmDelete).unwrap();
      toast.success('Announcement deleted');
      setConfirmDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the announcement.'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Megaphone className="size-5 text-amber-500" aria-hidden="true" />
            Announcements
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Official notices from faculty and the administration.</p>
        </div>
        {canPublish && (
          <Button onClick={() => setPublishOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Publish announcement
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <Card>
          <CardContent>
            <ListSkeleton rows={4} />
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" description="Official announcements will appear here." />
      ) : (
        <>
          <div className="space-y-4">
            {items.map((announcement) => {
              const isAuthor = me && (me.role === 'admin' || announcement.author?._id === me._id);
              return (
                <Card key={announcement._id} className={announcement.pinned ? 'ring-2 ring-amber-200' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {announcement.pinned && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                            <Pin className="size-3" aria-hidden="true" /> PINNED
                          </span>
                        )}
                        <Badge tone="primary" size="sm">{CATEGORY_LABELS[announcement.category] ?? announcement.category}</Badge>
                        <Badge tone="slate" size="sm">Audience: {announcement.audience}</Badge>
                      </div>
                      {isAuthor && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePin(announcement._id).unwrap().catch(() => {})}
                            aria-label={announcement.pinned ? 'Unpin' : 'Pin'}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"
                          >
                            <Pin className="size-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(announcement._id)}
                            aria-label="Delete announcement"
                            className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-900">{announcement.title}</h3>
                    <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{announcement.body}</p>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <Avatar src={announcement.author?.avatar?.url} name={announcement.author?.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{announcement.author?.name ?? 'Administration'}</p>
                        <p className="text-[11px] text-slate-400">{timeAgo(announcement.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {/* Publish modal */}
      <Modal open={publishOpen} onClose={() => setPublishOpen(false)} title="Publish announcement" description="The audience will be notified automatically." size="md">
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g. Mid-term exam schedule" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <Textarea label="Content" rows={4} placeholder="The announcement body…" value={body} onChange={(event) => setBody(event.target.value)} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
            />
            <Select
              label="Audience"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              options={AUDIENCE_OPTIONS}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={creating}>Cancel</Button>
          <Button onClick={handlePublish} loading={creating}>Publish</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this announcement?"
        description="This permanently removes the announcement."
        confirmLabel="Delete"
      />
    </div>
  );
}
