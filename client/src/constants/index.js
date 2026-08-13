/** Frontend constants mirroring the server enums (single source: server/config/constants.js). */

export const ROLES = ['student', 'faculty', 'alumni', 'admin'];

export const DEPARTMENTS = [
  'Computer Science',
  'Electronics & Communication',
  'Electrical',
  'Mechanical',
  'Civil',
  'Information Technology',
];

export const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'BBA', 'MBA', 'Diploma'];

export const INDUSTRIES = [
  'Software / IT Services',
  'Finance',
  'Fintech',
  'Consulting',
  'Manufacturing',
  'Energy',
  'Education',
  'Healthcare',
  'Government',
  'Startups',
  'Other',
];

export const ROLE_LABELS = {
  student: 'Student',
  faculty: 'Faculty',
  alumni: 'Alumni',
  admin: 'Admin',
};

export const ROLE_BADGE_TONES = {
  student: 'primary',
  faculty: 'accent',
  alumni: 'violet',
  admin: 'warning',
};

export const EVENT_CATEGORIES = [
  'alumni_meet',
  'technical_seminar',
  'workshop',
  'hackathon',
  'cultural',
  'sports',
  'career',
  'placement',
  'faculty',
  'student',
  'webinar',
];

export const EVENT_CATEGORY_LABELS = {
  alumni_meet: 'Alumni Meet',
  technical_seminar: 'Technical Seminar',
  workshop: 'Workshop',
  hackathon: 'Hackathon',
  cultural: 'Cultural',
  sports: 'Sports',
  career: 'Career',
  placement: 'Placement',
  faculty: 'Faculty',
  student: 'Student',
  webinar: 'Webinar',
};

export const EVENT_MODE_LABELS = {
  online: 'Online',
  offline: 'Offline',
  hybrid: 'Hybrid',
};

export const EVENT_STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const RESOURCE_CATEGORIES = ['GATE', 'Semester', 'Placement Preparation', 'Development', 'Other Exams'];

export const RESOURCE_SUB_CATEGORIES = {
  GATE: ['DSA', 'DBMS', 'OS', 'Computer Networks', 'COA', 'Compiler Design', 'Mathematics', 'Algorithms'],
  Semester: ['Unit-wise notes', 'Previous year papers', 'Assignments', 'Lab manuals', 'Question banks'],
  'Placement Preparation': ['DSA', 'Aptitude', 'Reasoning', 'Verbal', 'Coding', 'Interview preparation', 'HR interview'],
  Development: ['MERN', 'Java', 'Python', 'JavaScript', 'React', 'Node.js', 'Cloud', 'DevOps'],
  'Other Exams': [],
};

export const NOTIFICATION_TYPE_META = {  message: { label: 'New message', tone: 'primary' },
  connection_request: { label: 'Connection request', tone: 'primary' },
  connection_accepted: { label: 'Connection accepted', tone: 'accent' },
  meeting_invitation: { label: 'Meeting invitation', tone: 'violet' },
  meeting_reminder: { label: 'Meeting reminder', tone: 'violet' },
  event_registration: { label: 'Event registration', tone: 'accent' },
  event_reminder: { label: 'Event reminder', tone: 'warning' },
  scholarship_deadline: { label: 'Scholarship deadline', tone: 'warning' },
  scholarship_status: { label: 'Scholarship update', tone: 'accent' },
  donation_success: { label: 'Donation', tone: 'accent' },
  new_job: { label: 'New opportunity', tone: 'primary' },
  new_resource: { label: 'New resource', tone: 'primary' },
  announcement: { label: 'Announcement', tone: 'warning' },
  account_verified: { label: 'Account', tone: 'accent' },
  account_approved: { label: 'Account', tone: 'accent' },
  account_rejected: { label: 'Account', tone: 'danger' },
  pending_registration: { label: 'Admin', tone: 'warning' },
  job_status: { label: 'Opportunity', tone: 'primary' },
  resource_status: { label: 'Resource', tone: 'primary' },
  post_status: { label: 'Community', tone: 'primary' },
  mentorship_request: { label: 'Mentorship', tone: 'violet' },
  mentorship_accepted: { label: 'Mentorship', tone: 'violet' },
  referral_request: { label: 'Referral', tone: 'violet' },
  certificate_issued: { label: 'Certificate', tone: 'accent' },
  report_status: { label: 'Moderation', tone: 'warning' },
};

/**
 * Convert an API error (RTK Query shape or thrown Error) into a friendly message.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.data ?? error?.response?.data;
  if (data?.message) return data.message;
  if (error?.message) return error.message;
  return fallback;
}
