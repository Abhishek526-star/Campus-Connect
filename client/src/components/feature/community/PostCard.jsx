import { Link } from 'react-router';
import {
  Bookmark,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Send,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  useLikePostMutation,
  useUnlikePostMutation,
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useSharePostMutation,
  useReportPostMutation,
  useDeletePostMutation,
} from '../../../services/postsApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { ConfirmDialog } from '../../ui/ConfirmDialog.jsx';
import { DropdownMenu, MenuItem } from '../../ui/DropdownMenu.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { timeAgo } from '../../../utils/format.js';
import { POST_TYPE_LABELS } from '../community/postConstants.js';
import { cn } from '../../../utils/cn.js';

/**
 * Post card (spec §16): content, images, documents, links, tags; like,
 * comment (with replies), share, save, report; author delete.
 */
export function PostCard({ post, compact = false }) {
  const me = useSelector((state) => state.auth.user);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [like] = useLikePostMutation();
  const [unlike] = useUnlikePostMutation();
  const { data: commentsData } = useGetCommentsQuery({ postId: post._id, page: 1, limit: 30 }, { skip: !commentsOpen });
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [save] = useSavePostMutation();
  const [unsave] = useUnsavePostMutation();
  const [share] = useSharePostMutation();
  const [report] = useReportPostMutation();
  const [removePost] = useDeletePostMutation();

  const comments = commentsData?.data?.items ?? [];
  const isAuthor = me && post.author?._id === me._id;

  const handleLike = async () => {
    try {
      if (post.isLiked) await unlike(post._id).unwrap();
      else await like(post._id).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the like.'));
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment({ postId: post._id, content: commentText.trim() }).unwrap();
      setCommentText('');
      setCommentsOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not add the comment.'));
    }
  };

  const handleSave = async () => {
    try {
      if (post.isSaved) await unsave(post._id).unwrap();
      else await save(post._id).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the saved list.'));
    }
  };

  const handleShare = async () => {
    try {
      const { data: result } = await share(post._id).unwrap();
      await navigator.clipboard.writeText(`${window.location.origin}${result.url}`);
      toast.success('Link copied to clipboard');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not share the post.'));
    }
  };

  const handleReport = async () => {
    if (reportReason.trim().length < 3) {
      toast.error('Please provide a reason.');
      return;
    }
    try {
      await report({ id: post._id, body: { reason: reportReason.trim() } }).unwrap();
      toast.success('Report submitted — our moderators will review it.');
      setReportOpen(false);
      setReportReason('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit the report.'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId).unwrap();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the comment.'));
    }
  };

  return (
    <Card className={cn('flex flex-col', compact && 'p-4')}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 sm:p-5">
        <Link to={`/profile/${post.author?._id}`}>
          <Avatar src={post.author?.avatar?.url} name={post.author?.name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${post.author?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
            {post.author?.name ?? 'Member'}
          </Link>
          <p className="text-xs text-slate-400">
            {post.author?.role} · {timeAgo(post.createdAt)}
          </p>
          <Badge tone="primary" size="sm" className="mt-1">{POST_TYPE_LABELS[post.type] ?? post.type}</Badge>
        </div>
        <DropdownMenu label="Post actions" trigger={<MoreHorizontal className="size-4 text-slate-400" />}>
          <MenuItem icon={Flag} onClick={() => setReportOpen(true)}>
            Report
          </MenuItem>
          {isAuthor && (
            <MenuItem icon={Trash2} destructive onClick={() => setConfirmDelete(true)}>
              Delete
            </MenuItem>
          )}
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="px-4 pb-1 sm:px-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{post.content}</p>

        {(post.tags ?? []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs font-medium text-primary-600">#{tag}</span>
            ))}
          </div>
        )}

        {(post.links ?? []).length > 0 && (
          <div className="mt-3 space-y-1.5">
            {post.links.map((link, index) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:underline"
              >
                <Link2 className="size-3.5" aria-hidden="true" /> {link}
              </a>
            ))}
          </div>
        )}

        {(post.documents ?? []).length > 0 && (
          <div className="mt-3 space-y-1.5">
            {post.documents.map((doc, index) => (
              <a
                key={index}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-primary-300"
              >
                <Paperclip className="size-3.5 text-slate-400" aria-hidden="true" /> {doc.name ?? `Attachment ${index + 1}`}
              </a>
            ))}
          </div>
        )}

        {(post.images ?? []).length > 0 && (
          <div className={cn('mt-3 grid gap-2', (post.images?.length ?? 0) > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
            {post.images.map((image, index) => (
              <img key={index} src={image.url} alt={image.name ?? 'Post image'} className="w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 px-2 py-1.5 sm:px-3">
        <button
          type="button"
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            post.isLiked ? 'text-red-600' : 'text-slate-500 hover:bg-slate-100',
          )}
        >
          <Heart className={cn('size-4', post.isLiked && 'fill-red-500')} aria-hidden="true" />
          {post.counts?.likes ?? 0}
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((value) => !value)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {post.commentCount ?? 0}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
        >
          <Send className="size-4" aria-hidden="true" /> Share
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={cn(
            'ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
            post.isSaved ? 'text-primary-600' : 'text-slate-500 hover:bg-slate-100',
          )}
        >
          <Bookmark className={cn('size-4', post.isSaved && 'fill-primary-500')} aria-hidden="true" />
          {post.isSaved ? 'Saved' : 'Save'}
        </button>
      </div>

      {/* Comments */}
      {commentsOpen && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <form onSubmit={handleComment} className="flex items-center gap-2">
            <Avatar src={me?.avatar?.url} name={me?.name} size="sm" />
            <Textarea
              rows={1}
              placeholder="Write a comment…"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="max-h-24 min-h-10 flex-1 resize-none"
            />
            <Button type="submit" size="sm" disabled={!commentText.trim()}>
              Post
            </Button>
          </form>

          <div className="mt-3 space-y-2.5">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400">No comments yet — be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-2">
                  <Avatar src={comment.author?.avatar?.url} name={comment.author?.name} size="sm" />
                  <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">
                      {comment.author?.name}
                      <span className="ml-2 font-normal text-slate-400">{timeAgo(comment.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">{comment.content}</p>
                  </div>
                  {me && comment.author?._id === me._id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment._id)}
                      aria-label="Delete comment"
                      className="rounded-full p-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this post" size="md">
        <Textarea
          label="Reason"
          rows={3}
          required
          placeholder="e.g. Spam, harassment, misinformation…"
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
        onConfirm={async () => {
          try {
            await removePost(post._id).unwrap();
            toast.success('Post deleted');
          } catch (error) {
            toast.error(getErrorMessage(error, 'Could not delete the post.'));
          }
        }}
        title="Delete this post?"
        description="This permanently deletes the post and its comments."
        confirmLabel="Delete"
      />
    </Card>
  );
}
