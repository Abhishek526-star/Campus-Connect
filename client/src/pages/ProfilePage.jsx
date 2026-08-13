import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Pencil, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetMyProfileQuery, useGetPublicProfileQuery } from '../services/profileApi.js';
import { ProfileHeader } from '../components/feature/profile/ProfileHeader.jsx';
import { ProfileSections } from '../components/feature/profile/ProfileSections.jsx';
import { ProfileEditForm } from '../components/feature/profile/ProfileEditForm.jsx';
import { PrivacySettings } from '../components/feature/profile/PrivacySettings.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Badge } from '../components/ui/Badge.jsx';

/**
 * Profile page (spec §4 + §41).
 * /profile            → own profile (view + edit + privacy)
 * /profile/:id        → public view of another member (privacy-filtered server-side)
 */
export function ProfilePage() {
  useDocumentTitle('Profile');
  const { id } = useParams();
  const navigate = useNavigate();
  const me = useSelector((state) => state.auth.user);
  const isSelf = !id || (me && id === me._id);

  const [mode, setMode] = useState('view'); // view | edit | privacy

  const selfQuery = useGetMyProfileQuery(undefined, { skip: !isSelf });
  const otherQuery = useGetPublicProfileQuery(id, { skip: isSelf });
  const query = isSelf ? selfQuery : otherQuery;

  const { data, isLoading, isError, refetch } = query;

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl">
        <ErrorState title="Could not load this profile" message="It may not exist or is no longer available." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const { user, profile } = data.data;

  if (isSelf && mode === 'edit') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Edit profile</h1>
          <Button variant="outline" onClick={() => setMode('view')}>
            View profile
          </Button>
        </div>
        <ProfileEditForm user={user} profile={profile ?? {}} onDone={() => setMode('view')} />
      </div>
    );
  }

  if (isSelf && mode === 'privacy') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Privacy settings</h1>
          <Button variant="outline" onClick={() => setMode('view')}>
            View profile
          </Button>
        </div>
        <PrivacySettings privacy={user.privacy} onDone={() => setMode('view')} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ProfileHeader user={user} profile={profile} isSelf={isSelf} />

      {isSelf && (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setMode('edit')}>
            <Pencil className="size-4" aria-hidden="true" /> Edit profile
          </Button>
          <Button variant="outline" onClick={() => setMode('privacy')}>
            <ShieldCheck className="size-4" aria-hidden="true" /> Privacy settings
          </Button>
        </div>
      )}

      {profile ? (
        <ProfileSections profile={profile} role={user.role} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-slate-500">
              This member hasn't completed their profile yet.
            </p>
            {isSelf && (
              <Button className="mt-4" onClick={() => setMode('edit')}>
                Complete your profile
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isSelf && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Badge tone="slate" size="sm">Back to</Badge>
          <button type="button" onClick={() => navigate(-1)} className="font-semibold text-primary-600 hover:underline">
            previous page
          </button>
        </div>
      )}
    </div>
  );
}
