import { Link } from 'react-router';
import { CalendarDays, GraduationCap, IndianRupee, Users } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Card } from '../../ui/Card.jsx';
import { ProgressBar } from '../../ui/ProgressBar.jsx';
import { formatDate, formatINR } from '../../../utils/format.js';

/** Scholarship campaign card (spec §11) with live funding progress. */
export function ScholarshipCard({ scholarship }) {
  const percent = scholarship.targetAmount ? Math.round((scholarship.raisedAmount / scholarship.targetAmount) * 100) : 0;

  return (
    <Card className="flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-50">
          <GraduationCap className="size-5 text-accent-600" aria-hidden="true" />
        </span>
        <Badge tone={scholarship.category === 'merit_based' ? 'violet' : scholarship.category === 'special' ? 'warning' : 'primary'}>
          {scholarship.category?.replace('_', ' ')}
        </Badge>
      </div>

      <Link to={`/scholarships/${scholarship._id}`} className="mt-3 block">
        <h3 className="line-clamp-1 text-base font-semibold text-slate-900 hover:text-primary-600">{scholarship.name}</h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{scholarship.description}</p>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        <p className="flex items-center gap-2">
          <IndianRupee className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-700">{formatINR(scholarship.amount)}</span> per student
        </p>
        <p className="flex items-center gap-2">
          <CalendarDays className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          Deadline {formatDate(scholarship.deadline)}
        </p>
        <p className="flex items-center gap-2">
          <Users className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {scholarship.applicantsCount}/{scholarship.maxApplicants} applicants
        </p>
      </div>

      {/* Funding */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-500">Funding</span>
          <span className="font-bold text-accent-600">{percent}%</span>
        </div>
        <ProgressBar value={percent} tone="accent" className="mt-1.5" />
        <p className="mt-1.5 text-[11px] text-slate-400">
          {formatINR(scholarship.raisedAmount)} raised of {formatINR(scholarship.targetAmount)}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
        <Avatar src={scholarship.sponsor?.avatar?.url} name={scholarship.sponsor?.name} size="xs" />
        <span className="truncate text-xs text-slate-500">
          by <span className="font-medium text-slate-700">{scholarship.sponsor?.name ?? 'Sponsor'}</span>
        </span>
      </div>
    </Card>
  );
}
