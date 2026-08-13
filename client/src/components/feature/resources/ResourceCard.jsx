import { Link } from 'react-router';
import { BookOpen, Bookmark, Download, ExternalLink, FileText, Star } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Card } from '../../ui/Card.jsx';
import { formatNumber } from '../../../utils/format.js';
import { cn } from '../../../utils/cn.js';

const FILE_TYPE_LABELS = {
  pdf: 'PDF',
  doc: 'DOC',
  ppt: 'PPT',
  video: 'Video',
  external: 'Link',
  notes: 'Notes',
};

const FILE_TONES = {
  pdf: 'danger',
  doc: 'primary',
  ppt: 'warning',
  video: 'violet',
  external: 'accent',
  notes: 'slate',
};

/** Resource card (spec §15): category, type, rating, downloads. */
export function ResourceCard({ resource, compact = false }) {
  return (
    <Card className={cn('group flex h-full flex-col p-5 transition-all hover:-translate-y-0.5 hover:shadow-md', compact && 'hover:translate-y-0')}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <BookOpen className="size-5 text-primary-600" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Link to={`/resources/${resource._id}`} className="block">
            <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-primary-600">{resource.title}</h3>
          </Link>
          <p className="mt-0.5 truncate text-xs text-slate-500">{resource.uploadedBy?.name ?? 'Uploader'}</p>
        </div>
        {resource.isBookmarked && (
          <Bookmark className="size-4 shrink-0 fill-primary-500 text-primary-500" aria-label="Bookmarked" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge tone="primary" size="sm">{resource.category}</Badge>
        {resource.subCategory && <Badge tone="slate" size="sm">{resource.subCategory}</Badge>}
        <Badge tone={FILE_TONES[resource.fileType] ?? 'slate'} size="sm">{FILE_TYPE_LABELS[resource.fileType] ?? resource.fileType}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5 text-amber-500" aria-hidden="true" />
          <span className="font-semibold text-slate-600">{resource.avgRating?.toFixed(1) ?? 'New'}</span>
          ({formatNumber(resource.ratingCount)})
        </span>
        <span className="inline-flex items-center gap-1">
          <Download className="size-3.5" aria-hidden="true" /> {formatNumber(resource.downloads)}
        </span>
        {resource.fileType === 'external' && (
          <span className="inline-flex items-center gap-1 text-accent-600">
            <ExternalLink className="size-3.5" aria-hidden="true" /> External
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3" style={{ marginTop: 'auto' }}>
        <span className="flex items-center gap-2 text-xs text-slate-500">
          <Avatar src={resource.uploadedBy?.avatar?.url} name={resource.uploadedBy?.name} size="xs" />
          <span className="max-w-24 truncate">{resource.uploadedBy?.name ?? ''}</span>
        </span>
        <FileText className="size-3.5 text-slate-300" aria-hidden="true" />
      </div>
    </Card>
  );
}
