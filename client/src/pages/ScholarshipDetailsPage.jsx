import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  GraduationCap,
  IndianRupee,
  ListChecks,
  Users,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetScholarshipQuery } from '../services/scholarshipsApi.js';
import { ApplyScholarshipModal } from '../components/feature/scholarships/ApplyScholarshipModal.jsx';
import { ApplicationStatusBadge } from '../components/feature/scholarships/ApplicationStatusBadge.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { formatDate, formatINR } from '../utils/format.js';

/**
 * Scholarship details (spec §11, §13): eligibility, requirements, funding
 * dashboard, required documents, and the Apply flow for students.
 */
export function ScholarshipDetailsPage() {
  useDocumentTitle('Scholarship');
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useSelector((state) => state.auth.user);
  const [applyOpen, setApplyOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useGetScholarshipQuery(id);

  if (isError) {
    return <ErrorState title="Could not load this scholarship" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { scholarship } = data.data;
  const isStudent = me?.role === 'student';
  const isSponsor = me && (me.role === 'admin' || scholarship.sponsor?._id === me._id);
  const applied = Boolean(scholarship.myApplication);
  const closed = scholarship.status !== 'active' || new Date(scholarship.deadline) < new Date();
  const full = scholarship.applicantsCount >= scholarship.maxApplicants;

  const canApply = isStudent && !applied && !closed && !full;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-4" aria-hidden="true" /> Back
      </Button>

      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-28 w-full bg-gradient-to-br from-accent-600 via-accent-700 to-primary-800">
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            aria-hidden="true"
          />
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{scholarship.category?.replace('_', ' ')}</Badge>
            <Badge tone={scholarship.status === 'active' ? 'success' : 'slate'}>{scholarship.status}</Badge>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{scholarship.name}</h1>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{scholarship.description}</p>

          <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${scholarship.sponsor?._id}`}>
                <Avatar src={scholarship.sponsor?.avatar?.url} name={scholarship.sponsor?.name} size="md" />
              </Link>
              <div>
                <p className="text-xs text-slate-400">Sponsored by</p>
                <Link to={`/profile/${scholarship.sponsor?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary-600">
                  {scholarship.sponsor?.name ?? 'Sponsor'}
                </Link>
              </div>
            </div>

            {canApply ? (
              <Button onClick={() => setApplyOpen(true)}>
                <GraduationCap className="size-4" aria-hidden="true" /> Apply now
              </Button>
            ) : applied ? (
              <div className="flex items-center gap-2">
                <ApplicationStatusBadge status={scholarship.myApplication?.status} />
                <Button variant="ghost" size="sm" to="/scholarships/applications">
                  Track application
                </Button>
              </div>
            ) : (
              <Button disabled title={!isStudent ? 'Only students can apply' : closed ? 'Closed' : 'Full'}>
                {!isStudent ? 'Students only' : closed ? 'Applications closed' : full ? 'Maximum applicants reached' : 'Apply now'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Funding + key facts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <IndianRupee className="size-4 text-accent-500" aria-hidden="true" /> Funding progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-accent-700">{formatINR(scholarship.raisedAmount)}</p>
                <p className="text-sm text-slate-500">raised of {formatINR(scholarship.targetAmount)}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">{scholarship.fundedPercent}%</p>
            </div>
            <ProgressBar value={scholarship.fundedPercent} tone="accent" className="mt-3" />
            <p className="mt-3 text-xs text-slate-400">
              {scholarship.studentsSupported} student{scholarship.studentsSupported === 1 ? '' : 's'} supported so far
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2">
              <ListChecks className="size-4 text-primary-500" aria-hidden="true" /> Key details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Amount per student</span>
              <span className="font-semibold text-slate-800">{formatINR(scholarship.amount)}</span>
            </p>
            <p className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Deadline</span>
              <span className="font-semibold text-slate-800">{formatDate(scholarship.deadline)}</span>
            </p>
            <p className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Applicants</span>
              <span className="font-semibold text-slate-800">{scholarship.applicantsCount}/{scholarship.maxApplicants}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Eligibility + requirements + documents */}
      <Card>
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary-500" aria-hidden="true" /> Eligibility & requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Eligibility</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-600">{scholarship.eligibility}</p>
          </div>

          {scholarship.minimumRequirements?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Minimum requirements</p>
              <ul className="mt-2 space-y-1.5">
                {scholarship.minimumRequirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-500" aria-hidden="true" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {scholarship.requiredDocuments?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-800">Required documents</p>
              <ul className="mt-2 space-y-1.5">
                {scholarship.requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <FileText className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isSponsor && (
            <div className="border-t border-slate-100 pt-4">
              <Button variant="outline" to="/scholarships/review">
                <Users className="size-4" aria-hidden="true" /> Review applications
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {scholarship && (
        <ApplyScholarshipModal
          scholarship={scholarship}
          open={applyOpen}
          onClose={() => setApplyOpen(false)}
          onApplied={refetch}
        />
      )}
    </div>
  );
}
