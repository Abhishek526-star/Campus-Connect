import { Link } from 'react-router';
import { MapPin, MessageSquare, UserRound } from 'lucide-react';
import { Avatar } from '../../ui/Avatar.jsx';
import { Badge } from '../../ui/Badge.jsx';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Tag } from '../../ui/Tag.jsx';
import { RoleBadge } from '../../common/RoleBadge.jsx';
import { ConnectionButton } from './ConnectionButton.jsx';
import { ROLE_LABELS } from '../../../constants/index.js';

/**
 * Profile card (spec §6): avatar, name, role, department/batch, company,
 * designation, skills, and Connect / Message / View actions.
 */
export function UserCard({ user }) {
  const profile = user.profile ?? {};
  const headline =
    user.role === 'alumni'
      ? [profile.currentCompany, profile.designation].filter(Boolean).join(' · ')
      : user.role === 'faculty'
        ? [profile.designation, profile.department].filter(Boolean).join(' · ')
        : [profile.course ? `${profile.course} · ${profile.department}` : profile.department, `Batch ${profile.graduationYear ?? '—'}`]
            .filter(Boolean)
            .join(' · ');

  const skills = (profile.skills ?? []).slice(0, 3);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Link to={`/profile/${user._id}`} aria-label={`View ${user.name}'s profile`}>
          <Avatar src={user.avatar?.url} name={user.name} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/profile/${user._id}`} className="block">
            <p className="truncate text-base font-semibold text-slate-900 hover:text-primary-600">{user.name}</p>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <RoleBadge role={user.role} size="sm" />
            {user.badges?.includes('mentor') && <Badge tone="violet" size="sm">Mentor</Badge>}
          </div>
        </div>
      </div>

      {headline && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{headline}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {profile.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" /> {profile.location}
          </span>
        )}
        {user.reputationScore > 0 && <span>★ {user.reputationScore}</span>}
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <Tag key={skill} tone="primary" className="text-[10px]">
              {skill}
            </Tag>
          ))}
          {(profile.skills?.length ?? 0) > 3 && (
            <span className="self-center text-[10px] text-slate-400">+{(profile.skills?.length ?? 0) - 3} more</span>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <ConnectionButton connection={user.connection} userId={user._id} />
        <Button variant="ghost" size="sm" to={`/messages?user=${user._id}`}>
          <MessageSquare className="size-3.5" aria-hidden="true" /> Message
        </Button>
        <Button variant="ghost" size="sm" to={`/profile/${user._id}`} className="ml-auto">
          <UserRound className="size-3.5" aria-hidden="true" /> View
        </Button>
      </div>
      <p className="sr-only">{ROLE_LABELS[user.role] ?? user.role}</p>
    </Card>
  );
}
