import { Link } from 'react-router';
import { Bookmark, Building2, CalendarDays, Clock, MapPin } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Card } from '../../ui/Card.jsx';
import { formatDate } from '../../../utils/format.js';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../jobs/jobConstants.js';
import { cn } from '../../../utils/cn.js';

/**
 * Opportunity card (spec §14): title, company, type/work-mode badges,
 * location, salary, skills, deadline, save indicator.
 */
export function JobCard({ job, compact = false }) {
  return (
    <Card className={cn('group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md', compact && 'hover:translate-y-0')}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Building2 className="size-5 text-primary-600" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Link to={`/opportunities/${job._id}`} className="block">
            <h3 className="line-clamp-1 text-base font-semibold text-slate-900 group-hover:text-primary-600">{job.title}</h3>
          </Link>
          <p className="truncate text-sm text-slate-500">{job.company}</p>
        </div>
        {job.isSaved && (
          <span className="shrink-0 text-primary-500" aria-label="Saved">
            <Bookmark className="size-4 fill-primary-500" aria-hidden="true" />
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="primary" size="sm">{JOB_TYPE_LABELS[job.type] ?? job.type}</Badge>
        <Badge tone="accent" size="sm">{WORK_MODE_LABELS[job.workMode] ?? job.workMode}</Badge>
        {job.isFeatured && <Badge tone="warning" size="sm">Featured</Badge>}
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-500">
        {job.location && (
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> {job.location}
          </p>
        )}
        {job.salary && (
          <p className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> <span className="font-medium text-slate-700">{job.salary}</span>
          </p>
        )}
        {job.deadline && (
          <p className="flex items-center gap-2">
            <CalendarDays className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> Apply by {formatDate(job.deadline)}
          </p>
        )}
      </div>

      {(job.skills ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
              {skill}
            </span>
          ))}
          {(job.skills?.length ?? 0) > 4 && (
            <span className="self-center text-[10px] text-slate-400">+{(job.skills?.length ?? 0) - 4} more</span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <Avatar src={job.postedBy?.avatar?.url} name={job.postedBy?.name} size="xs" />
          <span className="max-w-28 truncate">{job.postedBy?.name ?? 'Alumni'}</span>
        </span>
        <span className="text-[11px] text-slate-400">{job.applicantCount ?? 0} applied</span>
      </div>
    </Card>
  );
}
