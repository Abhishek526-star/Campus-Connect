import mongoose from 'mongoose';
import Event from '../models/event.js';
import Attendance from '../models/attendance.js';
import EventRegistration from '../models/eventRegistration.js';
import ScholarshipApplication from '../models/scholarshipApplication.js';
import SavedItem from '../models/savedItem.js';
import Connection from '../models/connection.js';
import Mentorship from '../models/mentorship.js';
import Donation from '../models/donation.js';
import Job from '../models/job.js';
import Resource from '../models/resource.js';
import Post from '../models/post.js';

/**
 * Role-scoped analytics (spec §30): personal metrics per role.
 */
export async function getMyAnalytics({ userId, role }) {
  const [eventsAttended, attendance, applications, saved, connections, mentorships] =
    await Promise.all([
      Attendance.countDocuments({ user: userId, status: { $in: ['present', 'late'] } }),
      Attendance.find({ user: userId }).select('status').lean(),
      ScholarshipApplication.countDocuments({ student: userId }),
      SavedItem.countDocuments({ user: userId }),
      Connection.countDocuments({
        status: 'accepted',
        $or: [{ requester: userId }, { recipient: userId }],
      }),
      Mentorship.countDocuments({ $or: [{ mentor: userId }, { student: userId }] }),
    ]);

  const base = {
    eventsAttended,
    attendancePercent: attendance.length > 0
      ? Math.round((attendance.filter((a) => ['present', 'late'].includes(a.status)).length / attendance.length) * 100)
      : 0,
    applications: role === 'student' ? applications : undefined,
    savedItems: saved,
    connections,
    mentorships,
  };

  if (role === 'student') {
    const [registeredEvents, upcomingRegistrations] = await Promise.all([
      EventRegistration.countDocuments({ user: userId, status: 'registered' }),
      EventRegistration.countDocuments({ user: userId, status: 'registered' }).then(async (_count) => {
        const regs = await EventRegistration.find({ user: userId, status: 'registered' })
          .select('event')
          .lean();
        const ids = regs.map((r) => r.event);
        return Event.countDocuments({ _id: { $in: ids }, date: { $gte: new Date() } });
      }),
    ]);
    return {
      ...base,
      registeredEvents,
      upcomingRegistrations,
    };
  }

  if (role === 'alumni') {
    const [donations, donationTotal, eventsOrganized, opportunitiesPosted, studentsHelped, activeMentorships] =
      await Promise.all([
        Donation.countDocuments({ donor: userId, status: 'paid' }),
        Donation.aggregate([
          { $match: { donor: mongoose.Types.ObjectId.createFromHexString(String(userId)), status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Event.countDocuments({ organizer: userId }),
        Job.countDocuments({ postedBy: userId }),
        Mentorship.countDocuments({ mentor: userId, status: { $in: ['accepted', 'completed'] } }),
        Mentorship.countDocuments({ mentor: userId, status: 'accepted' }),
      ]);
    return {
      ...base,
      donations,
      donationTotal: donationTotal[0]?.total ?? 0,
      eventsOrganized,
      opportunitiesPosted,
      studentsHelped,
      activeMentorships,
    };
  }

  if (role === 'faculty') {
    const [eventsOrganized, resourcesUploaded, announcementsPublished, studentsReached] = await Promise.all([
      Event.countDocuments({ organizer: userId }),
      Resource.countDocuments({ uploadedBy: userId }),
      Post.countDocuments({ author: userId }),
      EventRegistration.countDocuments({}).then(async (_count) => {
        const events = await Event.find({ organizer: userId }).select('_id').lean();
        return EventRegistration.countDocuments({ event: { $in: events.map((e) => e._id) } });
      }),
    ]);
    return {
      ...base,
      eventsOrganized,
      resourcesUploaded,
      announcementsPublished,
      studentsReached,
    };
  }

  return base;
}
