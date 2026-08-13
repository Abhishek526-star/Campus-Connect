import { Badge } from '../../ui/Badge.jsx';

const STATUS_TONE = {
  applied: 'primary',
  under_review: 'warning',
  shortlisted: 'violet',
  approved: 'accent',
  rejected: 'danger',
  funded: 'success',
  completed: 'slate',
};

const STATUS_LABEL = {
  applied: 'Applied',
  under_review: 'Under review',
  shortlisted: 'Shortlisted',
  approved: 'Approved',
  rejected: 'Rejected',
  funded: 'Funded',
  completed: 'Completed',
};

/** Scholarship application status badge (spec §11). */
export function ApplicationStatusBadge({ status, size = 'sm' }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'slate'} size={size}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
