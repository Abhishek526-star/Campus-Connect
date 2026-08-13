import { Link } from 'react-router';
import { ArrowLeft, Inbox, Send } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetConnectionRequestsQuery,
  useGetOutgoingRequestsQuery,
} from '../services/peopleApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import { ConnectionButton } from '../components/feature/people/ConnectionButton.jsx';
import { timeAgo } from '../utils/format.js';

/**
 * Connection requests (spec §6): incoming (accept/reject) and outgoing (cancel).
 */
export function ConnectionRequestsPage() {
  useDocumentTitle('Connection requests');
  const { data: incoming, isLoading: loadingIn } = useGetConnectionRequestsQuery();
  const { data: outgoing, isLoading: loadingOut } = useGetOutgoingRequestsQuery();

  const incomingItems = incoming?.data?.items ?? [];
  const outgoingItems = outgoing?.data?.items ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" to="/people">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to People
        </Button>
      </div>

      {/* Incoming */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Inbox className="size-4 text-primary-500" aria-hidden="true" />
            Incoming requests
            {incomingItems.length > 0 && <Badge tone="danger" size="sm">{incomingItems.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingIn ? (
            <CardSkeleton />
          ) : incomingItems.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No incoming requests"
              description="When someone sends you a connection request, it will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {incomingItems.map((item) => (
                <li key={item._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <Link to={`/profile/${item.requester._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={item.requester.avatar?.url} name={item.requester.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 hover:text-primary-600">
                        {item.requester.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.requester.profile?.currentCompany
                          ? `${item.requester.profile.currentCompany} · ${item.requester.profile.designation ?? ''}`
                          : item.requester.profile?.department ?? ''}
                      </p>
                      <p className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</p>
                    </div>
                  </Link>
                  <div className="shrink-0">
                    <ConnectionButton
                      connection={{ status: 'pending', direction: 'incoming', id: item._id }}
                      userId={item.requester._id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Outgoing */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Send className="size-4 text-slate-400" aria-hidden="true" />
            Sent requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOut ? (
            <CardSkeleton />
          ) : outgoingItems.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No sent requests"
              description="Requests you send will appear here until the recipient responds."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {outgoingItems.map((item) => (
                <li key={item._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                  <Link to={`/profile/${item.recipient._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={item.recipient.avatar?.url} name={item.recipient.name} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 hover:text-primary-600">
                        {item.recipient.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {item.recipient.profile?.currentCompany
                          ? `${item.recipient.profile.currentCompany} · ${item.recipient.profile.designation ?? ''}`
                          : item.recipient.profile?.department ?? ''}
                      </p>
                      <p className="text-[11px] text-slate-400">Sent {timeAgo(item.createdAt)}</p>
                    </div>
                  </Link>
                  <div className="shrink-0">
                    <ConnectionButton
                      connection={{ status: 'pending', direction: 'outgoing', id: item._id }}
                      userId={item.recipient._id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
