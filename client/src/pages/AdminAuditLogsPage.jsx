import { useMemo, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetAuditLogsQuery, useGetAuditActionsQuery } from '../services/operationsApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Select.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { formatDateTime } from '../utils/format.js';

/**
 * Audit logs viewer (spec §39): every important action with actor, IP,
 * timestamp, and details — filterable by action.
 */
export function AdminAuditLogsPage() {
  useDocumentTitle('Audit logs');
  const [action, setAction] = useState('all');
  const [page, setPage] = useState(1);

  const { data: actionsData } = useGetAuditActionsQuery();
  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery(
    useMemo(() => ({ action: action === 'all' ? undefined : action, page, limit: 15 }), [action, page]),
  );

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;
  const actions = actionsData?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ScrollText className="size-5 text-primary-600" aria-hidden="true" />
            Audit logs
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Every important action — logins, role changes, donations, moderation — is recorded.
          </p>
        </div>
        <Select
          aria-label="Filter by action"
          value={action}
          onChange={(event) => { setAction(event.target.value); setPage(1); }}
          options={[{ value: 'all', label: 'All actions' }, ...actions.map((a) => ({ value: a, label: a }))]}
          className="w-56"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <Card><CardContent><ListSkeleton rows={6} /></CardContent></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit logs found" description="Actions will appear here as they happen." />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-slate-100">
                {items.map((log) => (
                  <li key={log._id} className="flex items-start gap-3 px-5 py-3.5">
                    <Avatar src={log.actor?.avatar?.url} name={log.actor?.name ?? 'System'} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="primary" size="sm">{log.action}</Badge>
                        <span className="text-sm font-medium text-slate-800">{log.actor?.name ?? 'System'}</span>
                        <span className="text-xs text-slate-400">({log.actor?.role ?? 'system'})</span>
                      </div>
                      {log.details && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{JSON.stringify(log.details)}</p>
                      )}
                      {log.reason && <p className="mt-0.5 text-xs text-slate-500">Reason: {log.reason}</p>}
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatDateTime(log.createdAt)}
                        {log.ipAddress ? ` · IP ${log.ipAddress}` : ''}
                        {log.targetType ? ` · ${log.targetType}${log.targetId ? ` ${String(log.targetId).slice(0, 10)}…` : ''}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
        </>
      )}
    </div>
  );
}
