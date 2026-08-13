import { Check, CheckCheck, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '../../ui/Avatar.jsx';
import { ConfirmDialog } from '../../ui/ConfirmDialog.jsx';
import { DropdownMenu, MenuItem } from '../../ui/DropdownMenu.jsx';
import { formatTime } from '../../../utils/format.js';
import { cn } from '../../../utils/cn.js';

/**
 * Message bubble — text / image / file, sender alignment, timestamps,
 * delivery status (✓ sent, ✓✓ read), delete-for-self menu.
 */
export function MessageBubble({ message, isOwn, onDelete, showAvatar, avatarUrl, senderName }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isRead = message.isRead || (message.readBy?.length ?? 0) > 0;

  return (
    <div className={cn('group flex items-end gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {showAvatar && !isOwn ? (
        <Avatar src={avatarUrl} name={senderName} size="sm" className="mb-5" />
      ) : (
        <span className="w-8 shrink-0" aria-hidden="true" />
      )}

      <div className={cn('max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm',
            isOwn
              ? 'rounded-br-md bg-primary-600 text-white'
              : 'rounded-bl-md border border-slate-200 bg-white text-slate-800',
          )}
        >
          {message.kind === 'image' && message.attachment?.url && (
            <img
              src={message.attachment.url}
              alt={message.attachment.name ?? 'Shared image'}
              className="mb-1.5 max-h-64 w-full rounded-lg object-cover"
              loading="lazy"
            />
          )}
          {message.kind === 'file' && message.attachment?.url && (
            <a
              href={message.attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="max-w-40 truncate">{message.attachment.name ?? 'File'}</span>
            </a>
          )}
          {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}

          <span
            className={cn(
              'mt-1 flex items-center justify-end gap-1 text-[10px]',
              isOwn ? 'text-primary-200' : 'text-slate-400',
            )}
          >
            {formatTime(new Date(message.createdAt).toTimeString().slice(0, 5))}
            {isOwn &&
              (isRead ? (
                <CheckCheck className="size-3.5" aria-hidden="true" />
              ) : (
                <Check className="size-3.5" aria-hidden="true" />
              ))}
          </span>
        </div>
      </div>

      {/* Actions for own messages */}
      {isOwn && (
        <div className="opacity-0 transition-opacity group-hover:opacity-100">
          <DropdownMenu label="Message actions" trigger={<MoreHorizontal className="size-4 text-slate-400" />}>
            <MenuItem destructive icon={Trash2} onClick={() => setConfirmDelete(true)}>
              Delete for me
            </MenuItem>
          </DropdownMenu>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          onDelete?.();
          setConfirmDelete(false);
        }}
        title="Delete this message?"
        description="The message will be removed from your view only."
        confirmLabel="Delete"
      />
    </div>
  );
}
