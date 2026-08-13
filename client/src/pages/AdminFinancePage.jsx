import { HandHeart, IndianRupee, Receipt, Users } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetAllDonationsQuery, useGetDonationStatsQuery } from '../services/donationsApi.js';
import { useGetScholarshipsQuery } from '../services/scholarshipsApi.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { useState } from 'react';
import { formatINR, timeAgo } from '../utils/format.js';

/**
 * Admin finance (spec §20): donation transactions, scholarship funding
 * tracking, and receipts.
 */
export function AdminFinancePage() {
  useDocumentTitle('Finance');
  const [page, setPage] = useState(1);

  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGetDonationStatsQuery();
  const { data: donationsData, isLoading: donationsLoading } = useGetAllDonationsQuery({ page, limit: 10 });
  const { data: scholarshipsData } = useGetScholarshipsQuery({ status: 'all', limit: 20 });

  const stats = statsData?.data;
  const donations = donationsData?.data?.items ?? [];
  const meta = donationsData?.data?.meta;
  const scholarships = scholarshipsData?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <IndianRupee className="size-5 text-accent-600" aria-hidden="true" />
          Finance
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Donations, scholarship funding, and receipts.</p>
      </div>

      {statsError ? (
        <ErrorState onRetry={refetchStats} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total raised" value={statsLoading ? undefined : formatINR(stats?.raisedAmount ?? 0)} icon={IndianRupee} loading={statsLoading} />
          <StatCard label="Funding target" value={statsLoading ? undefined : formatINR(stats?.targetAmount ?? 0)} icon={HandHeart} loading={statsLoading} />
          <StatCard label="Donors" value={statsLoading ? undefined : stats?.donorCount ?? 0} icon={Users} loading={statsLoading} />
          <StatCard label="Students supported" value={statsLoading ? undefined : stats?.studentsSupported ?? 0} icon={Receipt} loading={statsLoading} />
        </div>
      )}

      {/* Scholarship funding tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Scholarship funding</CardTitle>
        </CardHeader>
        <CardContent>
          {scholarships.length === 0 ? (
            <EmptyState icon={HandHeart} title="No scholarships" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {scholarships.map((scholarship) => {
                const percent = scholarship.targetAmount ? Math.round((scholarship.raisedAmount / scholarship.targetAmount) * 100) : 0;
                return (
                  <li key={scholarship._id} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">{scholarship.name}</p>
                      <span className="shrink-0 text-xs font-bold text-accent-600">{percent}%</span>
                    </div>
                    <ProgressBar value={percent} tone="accent" className="mt-1.5" />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatINR(scholarship.raisedAmount)} / {formatINR(scholarship.targetAmount)} · {scholarship.studentsSupported} student{scholarship.studentsSupported === 1 ? '' : 's'} supported · {scholarship.applicantsCount} applicants
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Donation transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Receipt className="size-4 text-primary-500" aria-hidden="true" /> Donation transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {donationsLoading ? (
            <div className="p-4"><ListSkeleton rows={5} /></div>
          ) : donations.length === 0 ? (
            <div className="p-6"><EmptyState icon={Receipt} title="No donations yet" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3 font-semibold">Donor</th>
                    <th className="px-4 py-3 font-semibold">Scholarship</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Receipt</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {donations.map((donation) => (
                    <tr key={donation._id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar src={donation.donor?.avatar?.url} name={donation.donor?.name} size="sm" />
                          <div>
                            <p className="font-medium text-slate-900">{donation.anonymous ? 'Anonymous' : donation.donor?.name}</p>
                            {!donation.anonymous && <p className="text-xs text-slate-400">{donation.donor?.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="max-w-40 truncate px-4 py-3 text-slate-600">{donation.scholarship?.name ?? 'General fund'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatINR(donation.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={donation.status === 'paid' ? 'success' : donation.status === 'refunded' ? 'warning' : donation.status === 'failed' ? 'danger' : 'slate'}
                        >
                          {donation.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{donation.receiptNumber ?? '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{timeAgo(donation.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </div>
  );
}
