import { BadgeCheck, HandHeart, ShieldCheck, Star, UserCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { cn } from '../../utils/cn.js';

const BADGE_META = {
  verified_student: { label: 'Verified Student', tone: 'primary', icon: BadgeCheck },
  verified_faculty: { label: 'Verified Faculty', tone: 'primary', icon: BadgeCheck },
  verified_alumni: { label: 'Verified Alumni', tone: 'primary', icon: BadgeCheck },
  verified_organizer: { label: 'Verified Organizer', tone: 'violet', icon: ShieldCheck },
  mentor: { label: 'Mentor', tone: 'accent', icon: UserCheck },
  scholarship_sponsor: { label: 'Scholarship Sponsor', tone: 'warning', icon: HandHeart },
};

/**
 * Verification badges (spec §29): displays the user's earned badges with
 * per-badge icons and tones. Reputation shown alongside when present.
 */
export function VerificationBadges({ badges = [], reputation, size = 'sm', className }) {
  const known = badges.filter((badge) => BADGE_META[badge]);

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {known.map((badge) => {
        const meta = BADGE_META[badge];
        const Icon = meta.icon;
        return (
          <Badge key={badge} tone={meta.tone} size={size}>
            <Icon className="size-3" aria-hidden="true" /> {meta.label}
          </Badge>
        );
      })}
      {typeof reputation === 'number' && reputation > 0 && (
        <Badge tone="slate" size={size}>
          <Star className="size-3 text-amber-500" aria-hidden="true" /> {reputation} reputation
        </Badge>
      )}
    </div>
  );
}
