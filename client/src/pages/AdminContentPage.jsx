import { useState } from 'react';
import { BookOpen, Briefcase, CheckCircle2, Flag, Globe, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetModerationQueueQuery, useGetReportsQuery, useResolveReportMutation } from '../services/adminApi.js';
import { useGetJobsQuery, useModerateJobMutation } from '../services/jobsApi.js';
import { useGetResourcesQuery, useModerateResourceMutation } from '../services/resourcesApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { timeAgo } from '../utils/format.js';

const TARGET_TYPES = [
  { value: 'all', label: 'All targets' },
  { value: 'post', label: 'Posts' },
  { value: 'job', label: 'Jobs' },
  { value: 'resource', label: 'Resources' },
  { value: 'user', label: 'Users' },
];

/**
 * Admin content moderation (spec §20): pending jobs/resources approval,
 * reports queue with resolve/dismiss + content removal.
 */
export function AdminContentPage() {
  useDocumentTitle('Content moderation');
  const [tab, setTab] = useState('reports');
  const [reportStatus, setReportStatus] = useState('pending');
  const [targetType, setTargetType] = useState('all');
  const [page, setPage] = useState(1);

  const { data: queueData } = useGetModerationQueueQuery();
  const queue = queueData?.data;

  const { data: reportsData, isLoading: reportsLoading, isError: reportsError, refetch: refetchReports } = useGetReportsQuery(
    { status: reportStatus, targetType: targetType === 'all' ? undefined : targetType, page, limit: 10 },
    { skip: tab !== 'reports' },
  );
  const [resolveReport, { isLoading: resolving }] = useResolveReportMutation();

  // Pending jobs moderation
  const { data: jobsData, isLoading: jobsLoading, refetch: refetchJobs } = useGetJobsQuery(
    { includeAll: 'true', status: 'pending', page: 1, limit: 10 },
    { skip: tab !== 'jobs' },
  );
  const [moderateJob] = useModerateJobMutation();

  // Pending resources moderation
  const { data: resourcesData, isLoading: resourcesLoading, refetch: refetchResources } = useGetResourcesQuery(
    { includePending: 'true', status: 'pending', page: 1, limit: 10 },
    { skip: tab !== 'resources' },
  );
  const [moderateResource] = useModerateResourceMutation();

  const reports = reportsData?.data?.items ?? [];
  const reportsMeta = reportsData?.data?.meta;
  const pendingJobs = jobsData?.data?.items ?? [];
  const pendingResources = resourcesData?.data?.items ?? [];

  const handleReportAction = async (report, status, removeContent = false) => {
    try {
      await resolveReport({ id: report._id, body: { status, removeContent } }).unwrap();
      toast.success(status === 'dismissed' ? 'Report dismissed' : removeContent ? 'Report resolved — content removed' : 'Report resolved');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the report.'));
    }
  };

  const handleJobModerate = async (id, status) => {
    try {
      await moderateJob({ id, status }).unwrap();
      toast.success(`Job ${status}`);
      refetchJobs();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not moderate the job.'));
    }
  };

  const handleResourceModerate = async (id, status) => {
    try {
      await moderateResource({ id, status }).unwrap();
      toast.success(`Resource ${status}`);
      refetchResources();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not moderate the resource.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Globe className="size-5 text-primary-600" aria-hidden="true" />
            Content moderation
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">Review reports and approve community content.</p>
        </div>
        <div className="flex gap-2">
          {queue?.pendingJobs > 0 && <Badge tone="warning">Jobs: {queue.pendingJobs}</Badge>}
          {queue?.pendingResources > 0 && <Badge tone="warning">Resources: {queue.pendingResources}</Badge>}
          {queue?.pendingReports > 0 && <Badge tone="danger">Reports: {queue.pendingReports}</Badge>}
        </div>
      </div>

      <Tabs
        value={tab}
        onChange={(value) => { setTab(value); setPage(1); }}
        tabs={[
          { value: 'reports', label: 'Reports', count: queue?.pendingReports },
          { value: 'jobs', label: 'Pending jobs', count: queue?.pendingJobs },
          { value: 'resources', label: 'Pending resources', count: queue?.pendingResources },
        ]}
      />

      {tab === 'reports' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              label="Status"
              value={reportStatus}
              onChange={(event) => { setReportStatus(event.target.value); setPage(1); }}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'reviewed', label: 'Reviewed' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'dismissed', label: 'Dismissed' },
              ]}
              className="w-44"
            />
            <Select
              label="Target"
              value={targetType}
              onChange={(event) => { setTargetType(event.target.value); setPage(1); }}
              options={TARGET_TYPES}
              className="w-44"
            />
          </div>

          {reportsError ? (
            <ErrorState onRetry={refetchReports} />
          ) : reportsLoading ? (
            <Card><CardContent><ListSkeleton rows={4} /></CardContent></Card>
          ) : reports.length === 0 ? (
            <EmptyState icon={Flag} title="No reports here" description="Community reports will appear in this queue." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <li key={report._id} className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="danger" size="sm">{report.targetType}</Badge>
                            <Badge tone="slate" size="sm">{report.status}</Badge>
                            <span className="text-xs text-slate-400">{timeAgo(report.createdAt)}</span>
                          </div>
                          <p className="mt-1.5 text-sm font-medium text-slate-900">“{report.reason}”</p>
                          {report.details && <p className="text-xs text-slate-500">{report.details}</p>}
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <Avatar src={report.reporter?.avatar?.url} name={report.reporter?.name} size="xs" />
                            Reported by {report.reporter?.name ?? 'Member'}
                            {report.target && (
                              <span className="truncate">· Target: <span className="font-medium text-slate-600">{report.target.snippet}</span></span>
                            )}
                          </div>
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex shrink-0 flex-wrap gap-2">
                            {report.targetType === 'post' && (
                              <Button size="sm" variant="danger" loading={resolving} onClick={() => handleReportAction(report, 'resolved', true)}>
                                <XCircle className="size-3.5" aria-hidden="true" /> Remove post
                              </Button>
                            )}
                            <Button size="sm" variant="success" loading={resolving} onClick={() => handleReportAction(report, 'resolved')}>
                              <CheckCircle2 className="size-3.5" aria-hidden="true" /> Resolve
                            </Button>
                            <Button size="sm" variant="outline" loading={resolving} onClick={() => handleReportAction(report, 'dismissed')}>
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {reportsMeta && (
            <Pagination page={reportsMeta.page} totalPages={reportsMeta.totalPages} onChange={setPage} />
          )}
        </>
      )}

      {tab === 'jobs' && (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <Briefcase className="size-4 text-primary-500" aria-hidden="true" /> Pending job approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {jobsLoading ? (
              <div className="p-4"><ListSkeleton rows={3} /></div>
            ) : pendingJobs.length === 0 ? (
              <div className="p-6"><EmptyState icon={Briefcase} title="No pending jobs" description="All opportunities are approved." /></div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingJobs.map((job) => (
                  <li key={job._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{job.title} @ {job.company}</p>
                      <p className="text-xs text-slate-400">by {job.postedBy?.name} · {job.type} · {job.workMode}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="success" onClick={() => handleJobModerate(job._id, 'approved')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleJobModerate(job._id, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'resources' && (
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <BookOpen className="size-4 text-primary-500" aria-hidden="true" /> Pending resource approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {resourcesLoading ? (
              <div className="p-4"><ListSkeleton rows={3} /></div>
            ) : pendingResources.length === 0 ? (
              <div className="p-6"><EmptyState icon={BookOpen} title="No pending resources" description="All resources are approved." /></div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingResources.map((resource) => (
                  <li key={resource._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{resource.title}</p>
                      <p className="text-xs text-slate-400">
                        by {resource.uploadedBy?.name} · {resource.category} · {resource.fileType}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="success" onClick={() => handleResourceModerate(resource._id, 'approved')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleResourceModerate(resource._id, 'rejected')}>
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
