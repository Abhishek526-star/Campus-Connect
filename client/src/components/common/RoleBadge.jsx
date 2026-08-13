import { Badge } from '../ui/Badge.jsx';
import { ROLE_BADGE_TONES, ROLE_LABELS } from '../../constants/index.js';

/** Role label badge with consistent tone per role. */
export function RoleBadge({ role, className }) {
  return (
    <Badge tone={ROLE_BADGE_TONES[role] ?? 'slate'} className={className}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  );
}
