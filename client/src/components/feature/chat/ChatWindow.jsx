import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSelector } from 'react-redux';
import { isSameDay, format } from 'date-fns';
import { ArrowLeft, Ban, Flag, MessageSquare as MessageSquareIcon, MoreHorizontal, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useDeleteMessageMutation,
  useBlockUserMutation,
  useReportUserMutation,
} from '../../../services/chatApi.js';
import { useChatSocket } from '../../../hooks/useChatSocket.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Avatar } from '../../ui/Avatar.jsx';
import { DropdownMenu, MenuItem } from '../../ui/DropdownMenu.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { Input } from '../../ui/Input.jsx';
import { Button } from '../../ui/Button.jsx';
import { EmptyState } from '../../ui/EmptyState.jsx';
import { Skeleton } from '../../ui/Skeleton.jsx';
import { MessageBubble } from './MessageBubble.jsx';
import { MessageInput } from './MessageInput.jsx';
import { cn } from '../../../utils/cn.js';

function DaySeparator({ date }) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86400000);
  const label = isSameDay(date, now) ? 'Today' : isSameDay(date, yesterday) ? 'Yesterday' : format(date, 'd MMM yyyy');
  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">{label}</span>
    </div>
  );
}

/**
 * Chat window — header (presence + actions), message history with day
 * separators + read receipts, typing indicator, composer.
 */
export function ChatWindow({ conversationId, onBack }) {
  const navigate = useNavigate();
  const myId = useSelector((state) => state.auth.user?._id);

  const { data: conversationsData } = useGetConversationsQuery();
  const conversation = useMemo(
    () => (conversationsData?.data?.items ?? []).find((item) => item._id === conversationId),
    [conversationsData, conversationId],
  );
  const otherUser = conversation?.otherUser;

  const { data: messagesData, isLoading: messagesLoading, refetch: refetchMessages } = useGetMessagesQuery(
    { conversationId },
    { skip: !conversationId },
  );

  const [deleteMessage] = useDeleteMessageMutation();
  const [blockUser] = useBlockUserMutation();
  const [reportUser] = useReportUserMutation();

  const [blockModal, setBlockModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  const scrollRef = useRef(null);
  const readMarkerRef = useRef(false);
  const typingEmitTimer = useRef(null);

  const messages = useMemo(() => messagesData?.data?.items ?? [], [messagesData]);

  const { typingUsers, online, sendMessage, emitTyping, markRead, setMessageListener, setReadListener } =
    useChatSocket({ conversationId, otherUserId: otherUser?._id });

  // ---- realtime listeners (wired once per conversation) ----
  useEffect(() => {
    setMessageListener(({ message }) => {
      const incoming = String(message.sender) !== String(myId);
      if (incoming) markRead([message._id]);
      refetchMessages();
    });
    setReadListener(() => {
      refetchMessages();
    });
  }, [setMessageListener, setReadListener, myId, markRead, refetchMessages]);

  // ---- mark incoming messages as read when the window is open ----
  useEffect(() => {
    if (!messages.length || !myId) return undefined;
    const unreadIds = messages
      .filter((m) => String(m.sender) !== String(myId) && !(m.readBy ?? []).includes(myId))
      .map((m) => m._id);
    if (unreadIds.length > 0 && !readMarkerRef.current) {
      readMarkerRef.current = true;
      markRead(unreadIds);
      const timer = setTimeout(() => {
        readMarkerRef.current = false;
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [messages, myId, markRead]);

  // ---- scroll to bottom when messages change ----
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, conversationId]);

  const handleTyping = useCallback(
    (value) => {
      if (typingEmitTimer.current) return;
      emitTyping(value);
      typingEmitTimer.current = setTimeout(() => {
        typingEmitTimer.current = null;
      }, 1500);
    },
    [emitTyping],
  );

  const handleSend = async (payload) => {
    try {
      await sendMessage({ conversationId, ...payload });
      refetchMessages();
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the message.'));
      return false;
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await deleteMessage(messageId).unwrap();
      refetchMessages();
      toast.success('Message deleted for you');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the message.'));
    }
  };

  const handleBlock = async () => {
    try {
      await blockUser(otherUser._id).unwrap();
      toast.success(`${otherUser.name} has been blocked.`);
      setBlockModal(false);
      navigate('/messages');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not block the user.'));
    }
  };

  const handleReport = async () => {
    if (reportReason.trim().length < 3) {
      toast.error('Please provide a reason.');
      return;
    }
    try {
      await reportUser({ userId: otherUser._id, reason: reportReason.trim(), details: reportDetails.trim() }).unwrap();
      toast.success('Report submitted — our moderators will review it.');
      setReportModal(false);
      setReportReason('');
      setReportDetails('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit the report.'));
    }
  };

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState icon={MessageSquareIcon} title="Conversation not found" description="It may have been removed." />
      </div>
    );
  }

  const typingName = typingUsers.length > 0 ? `${conversation.name} is typing…` : '';

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <span className="relative shrink-0">
          <Avatar src={otherUser?.avatar?.url} name={conversation.name} size="md" />
          <span
            className={cn(
              'absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-white',
              online ? 'bg-accent-500' : 'bg-slate-300',
            )}
            aria-label={online ? 'Online' : 'Offline'}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{conversation.name}</p>
          <p className="text-xs text-slate-400">{online ? 'Online' : 'Offline'}</p>
        </div>

        <DropdownMenu label="Chat actions" trigger={<MoreHorizontal className="size-5 text-slate-400" />}>
          <MenuItem icon={UserRound} onClick={() => navigate(`/profile/${otherUser._id}`)}>
            View profile
          </MenuItem>
          <MenuItem icon={Flag} onClick={() => setReportModal(true)}>
            Report user
          </MenuItem>
          <MenuItem icon={Ban} destructive onClick={() => setBlockModal(true)}>
            Block user
          </MenuItem>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-1 overflow-y-auto bg-slate-50/60 px-4 py-4">
        {messagesLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="ml-auto h-10 w-1/2" />
            <Skeleton className="h-10 w-3/5" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquareIcon}
              title="No messages yet"
              description={`Say hi to ${conversation.name} to start the conversation!`}
            />
          </div>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const showDay = !previous || !isSameDay(new Date(previous.createdAt), new Date(message.createdAt));
            const showAvatar = !previous || String(previous.sender) !== String(message.sender) || showDay;
            const isOwn = String(message.sender) === String(myId);
            return (
              <div key={message._id}>
                {showDay && <DaySeparator date={new Date(message.createdAt)} />}
                <MessageBubble
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  avatarUrl={isOwn ? undefined : otherUser?.avatar?.url}
                  senderName={conversation.name}
                  onDelete={() => handleDelete(message._id)}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Typing indicator */}
      <div className="h-6 px-4 text-xs font-medium text-primary-600">{typingName || ' '}</div>

      {/* Composer */}
      <MessageInput onSend={handleSend} onTyping={handleTyping} />

      {/* Block modal */}
      <Modal open={blockModal} onClose={() => setBlockModal(false)} title={`Block ${conversation.name}?`} size="sm">
        <p className="text-sm leading-relaxed text-slate-600">
          You won't be able to message each other, and {conversation.name} won't see your messages.
          You can unblock them anytime.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setBlockModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBlock}>
            Block user
          </Button>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title={`Report ${conversation.name}`} size="md">
        <div className="space-y-4">
          <Input
            label="Reason"
            placeholder="e.g. Harassment, spam, inappropriate content…"
            value={reportReason}
            onChange={(event) => setReportReason(event.target.value)}
            required
          />
          <Textarea
            label="Details (optional)"
            rows={4}
            placeholder="Tell us what happened…"
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setReportModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleReport}>
            Submit report
          </Button>
        </div>
      </Modal>
    </div>
  );
}
