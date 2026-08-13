import { useState } from 'react';
import { Link } from 'react-router';
import { Download, HandHeart, IndianRupee, Receipt, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetDonationStatsQuery, useGetMyDonationsQuery, useDownloadReceiptMutation } from '../services/donationsApi.js';
import { useGetScholarshipsQuery } from '../services/scholarshipsApi.js';
import { DonationModal } from '../components/feature/donations/DonationModal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { getErrorMessage } from '../constants/index.js';
import { saveBlob } from '../utils/download.js';
import { formatINR, timeAgo } from '../utils/format.js';

const DONOR_ROLES = ['faculty', 'alumni', 'admin'];

/**
 * Donations page (spec §12): transparent funding dashboard (target / raised /
 * remaining / donors / students supported), active campaigns to donate to,
 * my donation history with receipts.
 */
export function DonationsPage() {
  useDocumentTitle('Donations');
  const me = useSelector((state) => state.auth.user);
  const canDonate = DONOR_ROLES.includes(me?.role);

  const { data: statsData, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGetDonationStatsQuery();
  const { data: scholarshipsData } = useGetScholarshipsQuery({ limit: 6 });
  const { data: myDonationsData, isLoading: donationsLoading } = useGetMyDonationsQuery();

  const [donateTarget, setDonateTarget] = useState(null); // scholarship or 'general'
  const [downloadReceipt, { isLoading: receiptLoading }] = useDownloadReceiptMutation();
  const [receiptId, setReceiptId] = useState(null);

  const handleReceipt = async (donation) => {
    if (receiptLoading) return;
    setReceiptId(donation._id);
    try {
      const blob = await downloadReceipt(donation._id).unwrap();
      saveBlob(blob, `donation-receipt-${donation.receiptNumber ?? donation.orderId}.pdf`);
      toast.success('Receipt downloaded.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not download the receipt.'));
    } finally {
      setReceiptId(null);
    }
  };

  const stats = statsData?.data;
  const campaigns = scholarshipsData?.data?.items ?? [];
  const myDonations = myDonationsData?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <HandHeart className="size-5 text-accent-600" aria-hidden="true" />
          Donations & Scholarship Funding
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Alumni and faculty fund scholarships for economically weaker students — with full transparency.
        </p>
      </div>

      {/* Funding dashboard (spec §12) */}
      {statsError ? (
        <ErrorState onRetry={refetchStats} />
      ) : statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : stats ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-slate-500">Community funding progress</p>
              <div className="mt-2 flex items-end gap-4">
                <p className="text-3xl font-bold text-accent-700">{formatINR(stats.raisedAmount)}</p>
                <p className="pb-1 text-sm text-slate-500">raised of {formatINR(stats.targetAmount)}</p>
              </div>
              <ProgressBar value={stats.fundedPercent} tone="accent" className="mt-3" />
              <p className="mt-2 text-xs text-slate-400">
                {formatINR(stats.remainingAmount)} remaining to reach the target
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Donors', value: stats.donorCount, icon: Users },
                { label: 'Funded', value: `${stats.fundedPercent}%`, icon: IndianRupee },
                { label: 'Students supported', value: stats.studentsSupported, icon: HandHeart },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-4 text-center">
                  <item.icon className="mx-auto size-5 text-accent-600" aria-hidden="true" />
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                  <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Active campaigns to fund */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Active campaigns</h3>
        {campaigns.length === 0 ? (
          <EmptyState icon={HandHeart} title="No active campaigns" description="Campaigns open for donations will appear here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((scholarship) => {
              const percent = scholarship.targetAmount ? Math.round((scholarship.raisedAmount / scholarship.targetAmount) * 100) : 0;
              return (
                <Card key={scholarship._id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/scholarships/${scholarship._id}`} className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 hover:text-primary-600">{scholarship.name}</p>
                    </Link>
                    <span className="shrink-0 text-xs font-bold text-accent-600">{percent}%</span>
                  </div>
                  <ProgressBar value={percent} tone="accent" className="mt-2.5" />
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {formatINR(scholarship.raisedAmount)} raised of {formatINR(scholarship.targetAmount)} · {scholarship.studentsSupported} student{scholarship.studentsSupported === 1 ? '' : 's'} supported
                  </p>
                  {canDonate && (
                    <Button size="sm" className="mt-3 w-full" onClick={() => setDonateTarget(scholarship)}>
                      <HandHeart className="size-3.5" aria-hidden="true" /> Donate
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
        {canDonate && campaigns.length > 0 && (
          <button
            type="button"
            onClick={() => setDonateTarget({ _id: null, name: 'General fund' })}
            className="mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Or make a general donation →
          </button>
        )}
      </div>

      {/* My donations */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <Receipt className="size-4 text-primary-500" aria-hidden="true" /> My donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {donationsLoading ? (
            <Skeleton className="h-24" />
          ) : myDonations.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No donations yet"
              description="Your donations and receipts will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {myDonations.map((donation) => (
                <li key={donation._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-50">
                      <HandHeart className="size-4.5 text-accent-600" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {donation.scholarship?.name ?? 'General fund'}
                        {donation.anonymous ? ' · anonymous' : ''}
                      </p>
                      <p className="text-xs text-slate-400">
                        {timeAgo(donation.createdAt)} · {donation.receiptNumber ? `Receipt ${donation.receiptNumber}` : donation.orderId}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge
                      tone={donation.status === 'paid' ? 'success' : donation.status === 'refunded' ? 'warning' : donation.status === 'failed' ? 'danger' : 'slate'}
                    >
                      {donation.status}
                    </Badge>
                    <span className="text-sm font-bold text-slate-800">{formatINR(donation.amount)}</span>
                    {donation.status === 'paid' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={receiptLoading}
                        loading={receiptId === donation._id}
                        onClick={() => handleReceipt(donation)}
                        title="Download receipt (PDF)"
                      >
                        {receiptId !== donation._id && <Download className="size-3.5" aria-hidden="true" />}
                        Receipt
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Donation modal */}
      <DonationModal scholarship={donateTarget?._id ? donateTarget : null} open={Boolean(donateTarget)} onClose={() => setDonateTarget(null)} />    </div>
  );
}
