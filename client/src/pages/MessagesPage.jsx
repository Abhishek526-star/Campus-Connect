import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { MessageSquare } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { useGetDirectConversationMutation } from '../services/chatApi.js';
import { ConversationList } from '../components/feature/chat/ConversationList.jsx';
import { ChatWindow } from '../components/feature/chat/ChatWindow.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { toast } from 'sonner';
import { getErrorMessage } from '../constants/index.js';

/**
 * Messages (spec §7).
 * Desktop: two-pane (list + chat). Mobile: list ↔ chat full-screen swap.
 * ?user=<id> opens/creates a direct conversation with that member.
 */
export function MessagesPage() {
  useDocumentTitle('Messages');
  const { conversationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('lg');
  const [ensureDirect] = useGetDirectConversationMutation();
  void searchParams;

  // Deep link from a profile: create/open the conversation, then clean the URL.
  useEffect(() => {
    const userId = searchParams.get('user');
    if (!userId) return;
    ensureDirect(userId)
      .unwrap()
      .then((result) => {
        navigate(`/messages/${result.data.conversation._id}`, { replace: true });
      })
      .catch((error) => {
        toast.error(getErrorMessage(error, 'Could not open the conversation.'));
        navigate('/messages', { replace: true });
      });
  }, [searchParams, ensureDirect, navigate]);

  const showList = !conversationId || (isDesktop && conversationId);

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Conversation list */}
      {showList && (
        <aside className={`${isDesktop ? 'w-80 shrink-0 border-r border-slate-100' : 'w-full'}`}>
          <ConversationList activeId={conversationId} onSelect={() => {}} />
        </aside>
      )}

      {/* Chat window / placeholder */}
      {conversationId ? (
        <section className="min-w-0 flex-1">
          <ChatWindow
            conversationId={conversationId}
            onBack={() => navigate('/messages')}
          />
        </section>
      ) : isDesktop ? (
        <section className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={MessageSquare}
            title="Select a conversation"
            description="Choose a chat from the list, or open a profile and press Message to start a new one."
          />
        </section>
      ) : null}
    </div>
  );
}
