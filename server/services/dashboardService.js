import Event from '../models/event.js';
import Meeting from '../models/meeting.js';
import MeetingParticipant from '../models/meetingParticipant.js';
import Announcement from '../models/announcement.js';
import Job from '../models/job.js';
import Scholarship from '../models/scholarship.js';
import Resource from '../models/resource.js';
import Post from '../models/post.js';
import Connection from '../models/connection.js';
import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';

const PROFILE_MODELS = {
  student: StudentProfile,
  faculty: FacultyProfile,
  alumni: AlumniProfile,
};

const PROFILE_FIELDS = 'department graduationYear currentCompany designation industry location skills';

const ORGANIZER_POPULATE = { path: 'organizer', select: 'name avatar role' };

/**
 * Personalized dashboard aggregation (spec §5).
 * One call returns every widget's data — the client renders sections
 * (events, meetings, announcements, opportunities, scholarships, resources,
 * posts, recommended people) with a single round trip.
 */
export async function getDashboardData(user) {
  const today = new Date();

  const [
    upcomingEvents,
    upcomingMeetings,
    recentAnnouncements,
    newOpportunities,
    scholarshipCampaigns,
    studyResources,
    recentPosts,
    recommendedPeople,
  ] = await Promise.all([
    Event.find({ status: 'published', date: { $gte: today } })
      .sort({ date: 1 })
      .limit(5)
      .select('title date startTime endTime mode venue category registrationsCount maxParticipants organizer')
      .populate(ORGANIZER_POPULATE)
      .lean(),

    getUpcomingMeetings(user._id, today),

    Announcement.find({
      status: 'published',
      audience: { $in: ['all', user.role] },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: today } }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .limit(5)
      .select('title body category pinned createdAt author')
      .populate({ path: 'author', select: 'name' })
      .lean(),

    Job.find({
      status: 'approved',
      $or: [{ deadline: null }, { deadline: { $gt: today } }],
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title company type workMode location deadline postedBy')
      .populate({ path: 'postedBy', select: 'name' })
      .lean(),

    Scholarship.find({ status: 'active', deadline: { $gt: today } })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('name amount targetAmount raisedAmount deadline sponsor category studentsSupported')
      .populate({ path: 'sponsor', select: 'name' })
      .lean(),

    Resource.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description category subCategory fileType avgRating ratingCount uploadedBy')
      .populate({ path: 'uploadedBy', select: 'name' })
      .lean(),

    Post.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type content tags createdAt counts author')
      .populate({ path: 'author', select: 'name avatar role badges' })
      .lean(),

    getRecommendedPeople(user),
  ]);

  return {
    upcomingEvents,
    upcomingMeetings,
    recentAnnouncements,
    newOpportunities,
    scholarshipCampaigns,
    studyResources,
    recentPosts,
    recommendedPeople,
  };
}

/** Meetings where the user is organizer or participant, upcoming only. */
async function getUpcomingMeetings(userId, today) {
  const participations = await MeetingParticipant.find({ user: userId }).select('meeting').lean();
  const participantMeetingIds = participations.map((p) => p.meeting);

  return Meeting.find({
    status: { $in: ['scheduled', 'accepted', 'pending'] },
    date: { $gte: today },
    $or: [{ organizer: userId }, { _id: { $in: participantMeetingIds } }],
  })
    .sort({ date: 1, startTime: 1 })
    .limit(5)
    .select('title date startTime endTime status type location meetingLink organizer')
    .populate(ORGANIZER_POPULATE)
    .lean();
}

/**
 * Recommended people (spec §5): same department first (excluding self, existing
 * connections, and blocked users), ordered by reputation.
 */
async function getRecommendedPeople(user) {
  const excluded = new Set([user._id.toString(), ...(user.blockedUsers ?? []).map(String)]);

  const existingConnections = await Connection.find({
    $or: [{ requester: user._id }, { recipient: user._id }],
  })
    .select('requester recipient')
    .lean();
  existingConnections.forEach((c) => {
    excluded.add(c.requester.toString());
    excluded.add(c.recipient.toString());
  });

  let department = null;
  const ownProfileModel = PROFILE_MODELS[user.role];
  if (ownProfileModel) {
    const own = await ownProfileModel.findOne({ user: user._id }).select('department').lean();
    department = own?.department;
  }

  const candidateIds = new Set();
  if (department) {
    for (const role of ['student', 'alumni', 'faculty']) {
      const profileModel = PROFILE_MODELS[role];
      const profiles = await profileModel.find({ department }).select('user').lean();
      profiles.forEach((p) => candidateIds.add(p.user.toString()));
    }
  }

  const eligible = [...candidateIds].filter((id) => !excluded.has(id)).slice(0, 20);

  if (eligible.length === 0) return [];

  const people = await User.find({ _id: { $in: eligible }, isActive: true, isApproved: true })
    .select('name avatar role badges reputationScore createdAt')
    .sort({ reputationScore: -1 })
    .limit(6)
    .lean();

  const enriched = await Promise.all(
    people.map(async (person) => {
      const profileModel = PROFILE_MODELS[person.role];
      const profile = profileModel
        ? await profileModel.findOne({ user: person._id }).select(PROFILE_FIELDS).lean()
        : null;
      return { ...person, profile };
    }),
  );

  return enriched;
}
