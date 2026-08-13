import { Compass, HandHeart, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetMentorsQuery,
  useGetMyMentorshipsQuery,
  useRequestMentorshipMutation,
  useUpdateMentorshipStatusMutation,
  useGetOpenReferralOffersQuery,
  useGetMyReferralsQuery,
  useCreateReferralOfferMutation,
  useRequestReferralMutation,
  useGrantReferralMutation,
} from '../services/mentorshipApi.js';
import { useGetJobsQuery } from '../services/jobsApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { formatDate } from '../utils/format.js';

const AREA_OPTIONS = [
  { value: 'dsa', label: 'DSA' },
  { value: 'web_development', label: 'Web development' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'devops', label: 'DevOps' },
  { value: 'career', label: 'Career' },
  { value: 'interview_preparation', label: 'Interview preparation' },
  { value: 'higher_studies', label: 'Higher studies' },
];

const STATUS_TONE = {
  requested: 'warning',
  accepted: 'success',
  completed: 'slate',
  rejected: 'danger',
  cancelled: 'danger',
};

/**
 * Mentorship + referrals (spec §29): mentor directory, my mentorships with
 * request/accept/session flow, referral offers (alumni) + requests (students).
 */
export function MentorshipPage() {
  useDocumentTitle('Mentorship');
  const me = useSelector((state) => state.auth.user);
  const isStudent = me?.role === 'student';
  const isAlumnus = me?.role === 'alumni' || me?.role === 'faculty';

  const [tab, setTab] = useState('mentors');
  const [area, setArea] = useState('');
  const [requestOpen, setRequestOpen] = useState(null); // mentor object
  const [requestArea, setRequestArea] = useState('dsa');
  const [requestMessage, setRequestMessage] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerJob, setOfferJob] = useState('');
  const [offerNote, setOfferNote] = useState('');

  const { data: mentorsData, isLoading: mentorsLoading, isError: mentorsError, refetch: refetchMentors } = useGetMentorsQuery(
    { area: area || undefined, page: 1, limit: 20 },
    { skip: !isStudent },
  );
  const { data: myMentorshipsData, isLoading: myLoading } = useGetMyMentorshipsQuery();
  const { data: offersData, isLoading: offersLoading } = useGetOpenReferralOffersQuery({ page: 1, limit: 20 }, { skip: !isStudent });
  const { data: myReferralsData } = useGetMyReferralsQuery();
  const { data: jobsData } = useGetJobsQuery({ page: 1, limit: 50, sort: 'newest' }, { skip: !offerOpen });

  const [requestMentorship, { isLoading: requesting }] = useRequestMentorshipMutation();
  const [updateStatus] = useUpdateMentorshipStatusMutation();
  const [createOffer, { isLoading: offering }] = useCreateReferralOfferMutation();
  const [requestReferral] = useRequestReferralMutation();
  const [grantReferral] = useGrantReferralMutation();

  const mentors = mentorsData?.data?.items ?? [];
  const mentorships = myMentorshipsData?.data?.items ?? [];
  const offers = offersData?.data?.items ?? [];
  const myReferrals = myReferralsData?.data?.items ?? [];
  const jobs = jobsData?.data?.items ?? [];

  const handleRequest = async () => {
    if (!requestOpen) return;
    try {
      await requestMentorship({ mentorId: requestOpen._id, area: requestArea, message: requestMessage }).unwrap();
      toast.success('Mentorship request sent!');
      setRequestOpen(null);
      setRequestMessage('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the request.'));
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Mentorship ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the mentorship.'));
    }
  };

  const handleOffer = async () => {
    if (!offerJob) {
      toast.error('Select a job.');
      return;
    }
    try {
      await createOffer({ jobId: offerJob, note: offerNote || undefined }).unwrap();
      toast.success('Referral offer posted — students can now request it');
      setOfferOpen(false);
      setOfferNote('');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post the offer.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Compass className="size-5 text-violet-600" aria-hidden="true" />
            Mentorship & Referrals
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Alumni guide students across DSA, web, AI/ML, careers, and more.
          </p>
        </div>
        {isAlumnus && (
          <Button onClick={() => setOfferOpen(true)}>
            <Plus className="size-4" aria-hidden="true" /> Offer referral
          </Button>
        )}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'mentors', label: 'Find a mentor' },
          { value: 'my', label: 'My mentorships' },
          { value: 'referrals', label: 'Referrals' },
        ]}
      />

      {tab === 'mentors' && (
        <div className="space-y-4">
          <Select
            label="Filter by area"
            placeholder="All areas"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            options={AREA_OPTIONS}
            className="max-w-xs"
          />
          {mentorsError ? (
            <ErrorState onRetry={refetchMentors} />
          ) : mentorsLoading ? (
            <ListSkeleton rows={4} />
          ) : mentors.length === 0 ? (
            <EmptyState icon={Compass} title="No mentors found" description="Alumni who are available for mentorship appear here." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {mentors.map((mentor) => (
                <Card key={mentor._id} className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar src={mentor.avatar?.url} name={mentor.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-900">{mentor.name}</p>
                      <p className="truncate text-sm text-slate-500">
                        {mentor.profile?.currentCompany}
                        {mentor.profile?.designation ? ` · ${mentor.profile.designation}` : ''}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(mentor.profile?.mentorshipAreas ?? []).slice(0, 4).map((a) => (
                          <Badge key={a} tone="violet" size="sm">{a.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button className="mt-4 w-full" size="sm" onClick={() => setRequestOpen(mentor)}>
                    Request mentorship
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'my' && (
        <Card>
          <CardContent className="p-0">
            {myLoading ? (
              <div className="p-4"><ListSkeleton rows={3} /></div>
            ) : mentorships.length === 0 ? (
              <div className="p-6">
                <EmptyState icon={Compass} title="No mentorships yet" description="Request mentorship from an alumnus to get started." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {mentorships.map((mentorship) => {
                  const other = String(mentorship.mentor?._id) === String(me?._id) ? mentorship.student : mentorship.mentor;
                  const isMentorView = String(mentorship.mentor?._id) === String(me?._id);
                  return (
                    <li key={mentorship._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <Avatar src={other?.avatar?.url} name={other?.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {other?.name} · <span className="font-normal text-slate-500">{mentorship.area.replace('_', ' ')}</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          {isMentorView ? 'Student' : 'Mentor'} · requested {formatDate(mentorship.createdAt)}
                          {mentorship.message ? ` · "${mentorship.message}"` : ''}
                        </p>
                      </div>
                      <Badge tone={STATUS_TONE[mentorship.status] ?? 'slate'}>{mentorship.status}</Badge>
                      {mentorship.status === 'requested' && isMentorView && (
                        <div className="flex gap-2">
                          <Button variant="success" size="sm" onClick={() => handleStatus(mentorship._id, 'accepted')}>Accept</Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatus(mentorship._id, 'rejected')}>Decline</Button>
                        </div>
                      )}
                      {mentorship.status === 'accepted' && isMentorView && (
                        <Button variant="outline" size="sm" onClick={() => handleStatus(mentorship._id, 'completed')}>Mark completed</Button>
                      )}
                      {(mentorship.status === 'requested' || mentorship.status === 'accepted') && !isMentorView && (
                        <Button variant="outline" size="sm" onClick={() => handleStatus(mentorship._id, 'cancelled')}>Cancel</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'referrals' && (
        <div className="space-y-6">
          {isStudent && (
            <Card>
              <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                  <HandHeart className="size-4 text-accent-500" aria-hidden="true" /> Open referral offers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {offersLoading ? (
                  <ListSkeleton rows={3} />
                ) : offers.length === 0 ? (
                  <EmptyState icon={HandHeart} title="No open referral offers" description="Alumni referral offers appear here." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {offers.map((offer) => (
                      <li key={offer._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {offer.job?.title} @ {offer.job?.company}
                          </p>
                          <p className="text-xs text-slate-400">
                            by {offer.alumnus?.name}{offer.note ? ` · "${offer.note}"` : ''}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await requestReferral(offer._id).unwrap();
                              toast.success('Referral requested — the alumnus has been notified');
                            } catch (error) {
                              toast.error(getErrorMessage(error, 'Could not request the referral.'));
                            }
                          }}
                        >
                          Request referral
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>My referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {myReferrals.length === 0 ? (
                <EmptyState icon={HandHeart} title="No referrals" description={isAlumnus ? 'Offer a referral to help students land roles.' : 'Referrals you request appear here.'} />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {myReferrals.map((referral) => (
                    <li key={referral._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {referral.job?.title} @ {referral.job?.company}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isAlumnus
                            ? referral.student
                              ? `Requested by ${referral.student.name}`
                              : 'Open offer — waiting for a student to request'
                            : `Alumnus: ${referral.alumnus?.name}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={referral.status === 'given' ? 'success' : 'warning'}>{referral.status}</Badge>
                        {isAlumnus && referral.student && referral.status !== 'given' && (
                          <Button size="sm" onClick={async () => {
                            try {
                              await grantReferral(referral._id).unwrap();
                              toast.success('Referral granted!');
                            } catch (error) {
                              toast.error(getErrorMessage(error, 'Could not grant the referral.'));
                            }
                          }}>
                            Mark given
                          </Button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Request mentorship modal */}
      <Modal open={Boolean(requestOpen)} onClose={() => setRequestOpen(null)} title={`Request mentorship from ${requestOpen?.name ?? ''}`} size="md">
        <div className="space-y-4">
          <Select
            label="Area"
            value={requestArea}
            onChange={(event) => setRequestArea(event.target.value)}
            options={AREA_OPTIONS}
          />
          <Textarea
            label="Message (optional)"
            rows={3}
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="What would you like guidance on?"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setRequestOpen(null)} disabled={requesting}>Cancel</Button>
          <Button onClick={handleRequest} loading={requesting}>Send request</Button>
        </div>
      </Modal>

      {/* Offer referral modal */}
      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title="Offer a referral" description="Students can request this referral from you." size="md">
        <div className="space-y-4">
          <Select
            label="Opportunity"
            placeholder="Select an opportunity"
            value={offerJob}
            onChange={(event) => setOfferJob(event.target.value)}
            options={jobs.map((job) => ({ value: job._id, label: `${job.title} @ ${job.company}` }))}
          />
          <Textarea
            label="Note (optional)"
            rows={2}
            value={offerNote}
            onChange={(event) => setOfferNote(event.target.value)}
            placeholder="e.g. I can refer 2 students for this role — DM me with your resume."
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOfferOpen(false)} disabled={offering}>Cancel</Button>
          <Button onClick={handleOffer} loading={offering}>Post offer</Button>
        </div>
      </Modal>
    </div>
  );
}
