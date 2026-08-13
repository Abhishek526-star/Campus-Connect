import { useState } from 'react';
import { Camera, Code2, FileDown, Globe, Link2, MapPin, Phone, Mail } from 'lucide-react';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useUploadAvatarMutation } from '../../../services/profileApi.js';
import { useDownloadMemberReportMutation } from '../../../services/reportsApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { saveBlob } from '../../../utils/download.js';
import { Avatar } from '../../ui/Avatar.jsx';

import { Button } from '../../ui/Button.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { FileDropzone } from '../../ui/FileDropzone.jsx';
import { RoleBadge } from '../../common/RoleBadge.jsx';
import { VerificationBadges } from '../../common/VerificationBadges.jsx';


const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_MAX = 5 * 1024 * 1024;

/**
 * Profile header — avatar (with upload for self), name, badges, headline,
 * contact info, social links, and reputation.
 */
export function ProfileHeader({ user, profile, isSelf, isOther }) {
  const me = useSelector((state) => state.auth.user);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState([]);
  const [uploadAvatar, { isLoading }] = useUploadAvatarMutation();
  const [downloadReport, { isLoading: reportLoading }] = useDownloadMemberReportMutation();

  const canViewReport = isOther && ['admin', 'faculty', 'alumni'].includes(me?.role);

  const handleReport = async () => {
    if (!user?._id || reportLoading) return;
    try {
      const blob = await downloadReport({ userId: user._id }).unwrap();
      const name = (user.name ?? 'member').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      saveBlob(blob, `member-report-${name}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('Member report downloaded.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not download the report.'));
    }
  };

  const headline =
    profile?.currentCompany || profile?.designation || profile?.course
      ? [
          profile.currentCompany ? `at ${profile.currentCompany}` : '',
          profile.designation ?? '',
          profile.course ? `${profile.course} · ${profile.department ?? ''}` : profile.department ?? '',
        ]
          .filter(Boolean)
          .join(' · ')
      : profile?.department ?? '';

  const socials = profile?.linkedinUrl
    ? { linkedin: profile.linkedinUrl, github: profile.githubUrl, portfolio: profile.portfolioUrl }
    : profile?.socialLinks ?? null;

  const handleUpload = async () => {
    if (file.length === 0) return;
    const formData = new FormData();
    formData.append('file', file[0]);
    try {
      await uploadAvatar(formData).unwrap();
      toast.success('Profile picture updated');
      setUploadOpen(false);
      setFile([]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not upload the picture.'));
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar src={user?.avatar?.url} name={user?.name} size="xl" />
          {isSelf && (
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              aria-label="Change profile picture"
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-md transition-colors hover:bg-primary-700"
            >
              <Camera className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{user?.name}</h1>
            <RoleBadge role={user?.role} />
          </div>
          <div className="mt-1.5">
            <VerificationBadges badges={user?.badges ?? []} reputation={user?.reputationScore} />
          </div>
          {headline && <p className="mt-1.5 text-sm font-medium text-slate-600">{headline}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-500">
            {profile?.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-slate-400" aria-hidden="true" /> {profile.location}
              </span>
            )}
            {user?.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-4 text-slate-400" aria-hidden="true" /> {user.phone}
              </span>
            )}
            {user?.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4 text-slate-400" aria-hidden="true" /> {user.email}
              </span>
            )}
          </div>

          {(socials?.linkedin || socials?.github || socials?.portfolio) && (
            <div className="mt-3 flex items-center gap-2">
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                  className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  <Link2 className="size-4.5" aria-hidden="true" />
                </a>
              )}
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile"
                  className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  <Code2 className="size-4.5" aria-hidden="true" />
                </a>
              )}
              {socials.portfolio && (
                <a
                  href={socials.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Portfolio"
                  className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  <Globe className="size-4.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Reputation + report download */}
        <div className="flex shrink-0 flex-col items-stretch gap-2">
          {user?.reputationScore > 0 && (
            <div className="rounded-2xl bg-primary-50 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-primary-700">{user.reputationScore}</p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-primary-500">Reputation</p>
            </div>
          )}
          {canViewReport && (
            <Button variant="outline" size="sm" onClick={handleReport} loading={reportLoading} className="justify-center">
              {!reportLoading && <FileDown className="size-4" aria-hidden="true" />}
              Report (PDF)
            </Button>
          )}
        </div>
      </div>

      {isOther && !isSelf && (
        <p className="mt-2 text-xs text-slate-400">
          Showing the public view of this profile — some details are hidden per the owner's privacy settings.
        </p>
      )}

      {/* Avatar upload modal */}
      <Modal
        open={uploadOpen}
        onClose={() => {
          setUploadOpen(false);
          setFile([]);
        }}
        title="Update profile picture"
        description="JPG, PNG or WebP — up to 5 MB"
        size="sm"
      >
        <FileDropzone
          accept={AVATAR_ACCEPT}
          maxSize={AVATAR_MAX}
          value={file}
          onChange={setFile}
          hint="Square images look best — we crop to a circle."
        />
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} loading={isLoading} disabled={file.length === 0}>
            Upload
          </Button>
        </div>
      </Modal>
    </>
  );
}
