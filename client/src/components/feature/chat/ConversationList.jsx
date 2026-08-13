import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCheck, MessageSquare } from 'lucide-react';
import { useGetConversationsQuery } from '../../../services/chatApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { CardSkeleton } from '../../ui/Skeleton.jsx';
import { SearchInput } from '../../ui/SearchInput.jsx';
import { timeAgo } from '../../../utils/format.js';
import { cn } from '../../../utils/cn.js';

function PreviewText({ message }) {
  if (!message) return <span className="text-slate-400">No messages yet — say hi!</span>;
  if (message.kind === 'image') return <span>📷 Photo</span>;
  if (message.kind === 'file') return <span>📎 {message.attachment?.name ?? 'File'}</span>;
  return <span className="truncate">{message.content}</span>;
}

/**
 * Conversation list — search (client-side over loaded conversations), unread
 * badges, last-message preview + time, online dot.
 */
export function ConversationList({ activeId, onSelect }) {
  const navigate = useNavigate();
  const { data, isLoading } = useGetConversationsQuery();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);

  const conversations = useMemo(() => {
    const items = data?.data?.items ?? [];
    if (!debounced) return items;
    const q = debounced.toLowerCase();
    return items.filter((conversation) => (conversation.name ?? '').toLowerCase().includes(q));
  }, [data, debounced]);

  const handleSelect = (conversationId) => {
    onSelect?.(conversationId);
    navigate(`/messages/${conversationId}`);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 p-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search conversations…" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={MessageSquare}
              title={debounced ? 'No matching conversations' : 'No conversations yet'}
              description={
                debounced
                  ? 'Try a different name.'
                  : 'Open a profile and press Message to start chatting.'
              }
            />
          </div>
        ) : (
          <ul>
            {conversations.map((conversation) => {
              const active = conversation._id === activeId;
              return (
                <li key={conversation._id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(conversation._id)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      active ? 'bg-primary-50/80' : 'hover:bg-slate-50',
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar src={conversation.otherUser?.avatar?.url} name={conversation.name} size="md" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{conversation.name}</span>
                        {conversation.lastMessageAt && (
                          <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(conversation.lastMessageAt)}</span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span className={cn('flex min-w-0 items-center gap-1 text-xs', conversation.unreadCount > 0 ? 'font-semibold text-slate-800' : 'text-slate-500')}>
                          {conversation.lastMessage && (
                            <CheckCheck className={cn('size-3.5 shrink-0', conversation.lastMessage.isRead ? 'text-primary-500' : 'text-slate-300')} aria-hidden="true" />
                          )}
                          <PreviewText message={conversation.lastMessage} />
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge tone="danger" size="sm" className="shrink-0">{conversation.unreadCount}</Badge>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
