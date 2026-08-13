import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import Event from '../models/event.js';
import Meeting from '../models/meeting.js';
import MeetingParticipant from '../models/meetingParticipant.js';
import Job from '../models/job.js';
import Resource from '../models/resource.js';
import Scholarship from '../models/scholarship.js';
import Post from '../models/post.js';

const PROFILE_MODELS = { student: StudentProfile, faculty: FacultyProfile, alumni: AlumniProfile };

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Global search (spec §19): one query across people, events, meetings, jobs,
 * resources, scholarships, and posts — with per-type projections + limits.
 */
export async function globalSearch({ query, viewerId, filters = {}, limit = 6 }) {
  const q = String(query ?? '').trim();
  if (!q) return emptyResult();

  const regex = { $regex: escapeRegExp(q), $options: 'i' };
  const results = { query: q, types: {} };
  const typeKeys = filters.types?.length ? filters.types : ['people', 'events', 'meetings', 'jobs', 'resources', 'scholarships', 'posts'];

  await Promise.all(
    typeKeys.map(async (type) => {
      if (type === 'people') {
        const users = await User.find({
          isActive: true,
          isApproved: true,
          name: regex,
        })
          .limit(limit)
          .select('name avatar role badges reputationScore')
          .lean();

        const enriched = await Promise.all(
          users.map(async (user) => {
            const profile = PROFILE_MODELS[user.role]
              ? await PROFILE_MODELS[user.role].findOne({ user: user._id })
                  .select('department graduationYear currentCompany designation industry location')
                  .lean()
              : null;
            return { ...user, profile };
          }),
        );

        if (enriched.length) {
          results.types.people = {
            label: 'People',
            items: enriched,
            link: `/people?search=${encodeURIComponent(q)}`,
          };
        }
      }

      if (type === 'events') {
        const items = await Event.find({ status: 'published', title: regex })
          .limit(limit)
          .select('title date startTime venue mode category status')
          .lean();
        if (items.length) {
          results.types.events = { label: 'Events', items, link: `/events?search=${encodeURIComponent(q)}` };
        }
      }

      if (type === 'meetings') {
        const participations = await MeetingParticipant.find({ user: viewerId }).select('meeting').lean();
        const participantIds = participations.map((p) => p.meeting);
        const items = await Meeting.find({
          title: regex,
          $or: [{ organizer: viewerId }, { _id: { $in: participantIds } }],
        })
          .limit(limit)
          .select('title date startTime status type')
          .lean();
        if (items.length) {
          results.types.meetings = { label: 'Meetings', items, link: `/meetings` };
        }
      }

      if (type === 'jobs') {
        const items = await Job.find({
          status: 'approved',
          $or: [{ title: regex }, { company: regex }],
        })
          .limit(limit)
          .select('title company type workMode location salary')
          .lean();
        if (items.length) {
          results.types.jobs = { label: 'Jobs & Internships', items, link: `/opportunities?search=${encodeURIComponent(q)}` };
        }
      }

      if (type === 'resources') {
        const items = await Resource.find({
          status: 'approved',
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
        })
          .limit(limit)
          .select('title category subCategory fileType avgRating')
          .lean();
        if (items.length) {
          results.types.resources = { label: 'Resources', items, link: `/resources?search=${encodeURIComponent(q)}` };
        }
      }

      if (type === 'scholarships') {
        const items = await Scholarship.find({ status: 'active', name: regex })
          .limit(limit)
          .select('name amount targetAmount raisedAmount deadline category')
          .lean();
        if (items.length) {
          results.types.scholarships = {
            label: 'Scholarships',
            items,
            link: `/scholarships?search=${encodeURIComponent(q)}`,
          };
        }
      }

      if (type === 'posts') {
        const items = await Post.find({ status: 'published', content: regex })
          .limit(limit)
          .select('type content tags createdAt author')
          .populate({ path: 'author', select: 'name avatar' })
          .lean();
        if (items.length) {
          results.types.posts = { label: 'Community posts', items, link: `/community` };
        }
      }
    }),
  );

  return results;
}

function emptyResult() {
  return { query: '', types: {} };
}
