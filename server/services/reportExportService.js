import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import EventRegistration from '../models/eventRegistration.js';
import Attendance from '../models/attendance.js';
import ScholarshipApplication from '../models/scholarshipApplication.js';
import Donation from '../models/donation.js';
import Job from '../models/job.js';
import { toCsvBuffer, toPdfBuffer, toXlsxBuffer } from '../utils/exporters.js';

/**
 * Reports (spec §40): 9 exportable report types in CSV/Excel/PDF.
 */

const REPORT_DEFINITIONS = {
  students: { label: 'Student list', columns: [
    { key: 'name', header: 'Name', width: 26 },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'rollNumber', header: 'Roll number', width: 18 },
    { key: 'department', header: 'Department', width: 26 },
    { key: 'course', header: 'Course', width: 18 },
    { key: 'year', header: 'Year', width: 10 },
    { key: 'graduationYear', header: 'Grad year', width: 12 },
    { key: 'location', header: 'Location', width: 18 },
    { key: 'reputation', header: 'Reputation', width: 16 },
  ] },
  alumni: { label: 'Alumni list', columns: [
    { key: 'name', header: 'Name', width: 26 },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'graduationYear', header: 'Grad year', width: 12 },
    { key: 'department', header: 'Department', width: 26 },
    { key: 'company', header: 'Company', width: 24 },
    { key: 'designation', header: 'Designation', width: 24 },
    { key: 'industry', header: 'Industry', width: 22 },
    { key: 'location', header: 'Location', width: 18 },
  ] },
  faculty: { label: 'Faculty list', columns: [
    { key: 'name', header: 'Name', width: 26 },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'employeeId', header: 'Employee ID', width: 16 },
    { key: 'department', header: 'Department', width: 26 },
    { key: 'designation', header: 'Designation', width: 26 },
    { key: 'subjects', header: 'Subjects', width: 30 },
  ] },
  'event-participants': { label: 'Event participants', columns: [
    { key: 'event', header: 'Event', width: 34 },
    { key: 'name', header: 'Name', width: 26 },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'role', header: 'Role', width: 12 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'registeredAt', header: 'Registered', width: 22 },
  ] },
  attendance: { label: 'Attendance', columns: [
    { key: 'event', header: 'Event', width: 34 },
    { key: 'name', header: 'Name', width: 26 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'method', header: 'Method', width: 12 },
    { key: 'checkIn', header: 'Check-in', width: 22 },
    { key: 'checkOut', header: 'Check-out', width: 22 },
  ] },
  'scholarship-applications': { label: 'Scholarship applications', columns: [
    { key: 'scholarship', header: 'Scholarship', width: 30 },
    { key: 'name', header: 'Student', width: 26 },
    { key: 'rollNumber', header: 'Roll', width: 18 },
    { key: 'income', header: 'Family income (INR)', width: 22 },
    { key: 'score', header: 'Academic %', width: 14 },
    { key: 'status', header: 'Status', width: 16 },
    { key: 'appliedAt', header: 'Applied', width: 22 },
  ] },
  donations: { label: 'Donations', columns: [
    { key: 'donor', header: 'Donor', width: 26 },
    { key: 'scholarship', header: 'Scholarship', width: 30 },
    { key: 'amount', header: 'Amount (INR)', width: 18 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'receipt', header: 'Receipt', width: 22 },
    { key: 'date', header: 'Date', width: 22 },
  ] },
  jobs: { label: 'Jobs', columns: [
    { key: 'title', header: 'Title', width: 30 },
    { key: 'company', header: 'Company', width: 24 },
    { key: 'location', header: 'Location', width: 20 },
    { key: 'workMode', header: 'Mode', width: 12 },
    { key: 'salary', header: 'Salary', width: 20 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'postedBy', header: 'Posted by', width: 24 },
    { key: 'deadline', header: 'Deadline', width: 20 },
  ] },
  internships: { label: 'Internships', columns: [
    { key: 'title', header: 'Title', width: 30 },
    { key: 'company', header: 'Company', width: 24 },
    { key: 'location', header: 'Location', width: 20 },
    { key: 'workMode', header: 'Mode', width: 12 },
    { key: 'salary', header: 'Stipend', width: 20 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'postedBy', header: 'Posted by', width: 24 },
    { key: 'deadline', header: 'Deadline', width: 20 },
  ] },
};

/** List available reports. */
export function listReportTypes() {
  return Object.entries(REPORT_DEFINITIONS).map(([key, def]) => ({ key, label: def.label }));
}

/** Generate a report: rows + columns for the requested type. */
export async function generateReport({ type }) {
  const definition = REPORT_DEFINITIONS[type];
  if (!definition) throw new Error('REPORT_TYPE_NOT_FOUND');

  const fmt = (date) => (date ? new Date(date).toLocaleString('en-IN') : '—');
  let rows = [];

  if (type === 'students') {
    const users = await User.find({ role: 'student' }).select('name email reputationScore').lean();
    rows = await Promise.all(users.map(async (user) => {
      const p = await StudentProfile.findOne({ user: user._id }).lean();
      return {
        name: user.name, email: user.email,
        rollNumber: p?.rollNumber ?? '—', department: p?.department ?? '—', course: p?.course ?? '—',
        year: p?.year ?? '—', graduationYear: p?.graduationYear ?? '—', location: p?.location ?? '—',
        reputation: user.reputationScore ?? 0,
      };
    }));
  } else if (type === 'alumni') {
    const users = await User.find({ role: 'alumni' }).select('name email').lean();
    rows = await Promise.all(users.map(async (user) => {
      const p = await AlumniProfile.findOne({ user: user._id }).lean();
      return {
        name: user.name, email: user.email,
        graduationYear: p?.graduationYear ?? '—', department: p?.department ?? '—',
        company: p?.currentCompany ?? '—', designation: p?.designation ?? '—',
        industry: p?.industry ?? '—', location: p?.location ?? '—',
      };
    }));
  } else if (type === 'faculty') {
    const users = await User.find({ role: 'faculty' }).select('name email').lean();
    rows = await Promise.all(users.map(async (user) => {
      const p = await FacultyProfile.findOne({ user: user._id }).lean();
      return {
        name: user.name, email: user.email,
        employeeId: p?.employeeId ?? '—', department: p?.department ?? '—',
        designation: p?.designation ?? '—', subjects: (p?.subjects ?? []).join(', ') || '—',
      };
    }));
  } else if (type === 'event-participants') {
    const registrations = await EventRegistration.find({})
      .populate({ path: 'event', select: 'title' })
      .populate({ path: 'user', select: 'name email role' })
      .sort({ createdAt: 1 })
      .lean();
    rows = registrations.map((r) => ({
      event: r.event?.title ?? '—', name: r.user?.name ?? '—', email: r.user?.email ?? '—',
      role: r.user?.role ?? '—', status: r.status, registeredAt: fmt(r.createdAt),
    }));
  } else if (type === 'attendance') {
    const records = await Attendance.find({})
      .populate({ path: 'event', select: 'title' })
      .populate({ path: 'user', select: 'name' })
      .sort({ createdAt: 1 })
      .lean();
    rows = records.map((r) => ({
      event: r.event?.title ?? '—', name: r.user?.name ?? '—', status: r.status, method: r.method,
      checkIn: fmt(r.checkInTime), checkOut: fmt(r.checkOutTime),
    }));
  } else if (type === 'scholarship-applications') {
    const apps = await ScholarshipApplication.find({})
      .populate({ path: 'scholarship', select: 'name' })
      .populate({ path: 'student', select: 'name' })
      .sort({ createdAt: 1 })
      .lean();
    rows = apps.map((a) => ({
      scholarship: a.scholarship?.name ?? '—', name: a.student?.name ?? '—', rollNumber: a.rollNumber ?? '—',
      income: a.familyIncome ?? 0, score: a.academicPerformance ?? 0, status: a.status, appliedAt: fmt(a.createdAt),
    }));
  } else if (type === 'donations') {
    const donations = await Donation.find({})
      .populate({ path: 'donor', select: 'name' })
      .populate({ path: 'scholarship', select: 'name' })
      .sort({ createdAt: 1 })
      .lean();
    rows = donations.map((d) => ({
      donor: d.anonymous ? 'Anonymous' : d.donor?.name ?? '—', scholarship: d.scholarship?.name ?? 'General fund',
      amount: d.amount, status: d.status, receipt: d.receiptNumber ?? '—', date: fmt(d.createdAt),
    }));
  } else if (type === 'jobs' || type === 'internships') {
    const jobs = await Job.find({ type })
      .populate({ path: 'postedBy', select: 'name' })
      .sort({ createdAt: 1 })
      .lean();
    rows = jobs.map((j) => ({
      title: j.title, company: j.company, location: j.location || '—', workMode: j.workMode,
      salary: j.salary || '—', status: j.status, postedBy: j.postedBy?.name ?? '—', deadline: fmt(j.deadline),
    }));
  }

  return { definition, rows };
}

/** Serialize a report to the requested format (csv/xlsx/pdf). */
export async function serializeReport({ type, format }) {
  const { definition, rows } = await generateReport({ type });
  const { label, columns } = definition;
  const filename = `${type}-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === 'xlsx') {
    const buffer = await toXlsxBuffer(rows, columns);
    return { buffer, filename, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
  }
  if (format === 'pdf') {
    const buffer = await toPdfBuffer({
      title: label,
      subtitle: `Campus Connect · generated ${new Date().toLocaleString('en-IN')}`,
      rows,
      columns,
      landscape: columns.length > 5,
    });
    return { buffer, filename, mime: 'application/pdf' };
  }
  const buffer = toCsvBuffer(rows, columns);
  return { buffer, filename, mime: 'text/csv; charset=utf-8' };
}
