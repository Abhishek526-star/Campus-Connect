/**
 * Global constants — single source of truth for all enums, limits, and config
 * values shared across models, validators, controllers, and services.
 */

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------
export const ROLES = ['student', 'faculty', 'alumni', 'admin'];

// Roles that require admin approval after email verification.
export const APPROVAL_REQUIRED_ROLES = ['faculty', 'alumni'];

// ---------------------------------------------------------------------------
// Users & profiles
// ---------------------------------------------------------------------------
export const DEPARTMENTS = [
  'Computer Science',
  'Electronics & Communication',
  'Electrical',
  'Mechanical',
  'Civil',
  'Information Technology',
];

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

export const PRIVACY_LEVELS = ['public', 'connections', 'private'];

export const BADGES = [
  'verified_student',
  'verified_faculty',
  'verified_alumni',
  'verified_organizer',
  'mentor',
  'scholarship_sponsor',
];

export const MENTORSHIP_AREAS = [
  'dsa',
  'web_development',
  'ai_ml',
  'cloud',
  'devops',
  'career',
  'interview_preparation',
  'higher_studies',
];

export const ROADMAP_ROLES = [
  'software_engineer',
  'data_scientist',
  'ai_engineer',
  'web_developer',
  'cloud_engineer',
  'devops_engineer',
  'cybersecurity',
  'gate',
  'government_jobs',
];

// ---------------------------------------------------------------------------
// Connections
// ---------------------------------------------------------------------------
export const CONNECTION_STATUSES = ['pending', 'accepted', 'rejected', 'removed'];

// ---------------------------------------------------------------------------
// Events & attendance
// ---------------------------------------------------------------------------
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

export const EVENT_STATUSES = ['draft', 'published', 'completed', 'cancelled'];
export const EVENT_MODES = ['online', 'offline', 'hybrid'];
export const REGISTRATION_STATUSES = ['registered', 'cancelled', 'attended'];
export const ATTENDANCE_STATUSES = ['registered', 'present', 'absent', 'late'];
export const ATTENDANCE_METHODS = ['qr', 'manual'];

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------
export const MEETING_TYPES = ['one_on_one', 'group'];
export const MEETING_STATUSES = ['scheduled', 'pending', 'accepted', 'rejected', 'completed', 'cancelled'];
export const MEETING_PARTICIPANT_STATUSES = ['invited', 'accepted', 'rejected'];

// ---------------------------------------------------------------------------
// Scholarships & donations
// ---------------------------------------------------------------------------
export const SCHOLARSHIP_CATEGORIES = ['need_based', 'merit_based', 'special'];
export const SCHOLARSHIP_STATUSES = ['draft', 'active', 'paused', 'completed'];
export const SCHOLARSHIP_APPLICATION_STATUSES = [
  'applied',
  'under_review',
  'shortlisted',
  'approved',
  'rejected',
  'funded',
  'completed',
];
export const DONATION_STATUSES = ['created', 'paid', 'failed', 'refunded'];
export const PAYMENT_PURPOSES = ['donation'];
export const PAYMENT_GATEWAYS = ['razorpay'];

// ---------------------------------------------------------------------------
// Jobs & opportunities
// ---------------------------------------------------------------------------
export const JOB_TYPES = ['job', 'internship', 'freelance', 'hackathon', 'competition', 'training'];
export const WORK_MODES = ['remote', 'hybrid', 'onsite'];
export const JOB_STATUSES = ['pending', 'approved', 'rejected', 'closed'];

// ---------------------------------------------------------------------------
// Study resources
// ---------------------------------------------------------------------------
export const RESOURCE_CATEGORIES = ['GATE', 'Semester', 'Placement Preparation', 'Development', 'Other Exams'];
export const RESOURCE_FILE_TYPES = ['pdf', 'doc', 'ppt', 'video', 'external', 'notes'];
export const RESOURCE_STATUSES = ['pending', 'approved', 'rejected', 'removed'];

export const RESOURCE_SUB_CATEGORIES = {
  GATE: ['DSA', 'DBMS', 'OS', 'Computer Networks', 'COA', 'Compiler Design', 'Mathematics', 'Algorithms'],
  Semester: ['Unit-wise notes', 'Previous year papers', 'Assignments', 'Lab manuals', 'Question banks'],
  'Placement Preparation': ['DSA', 'Aptitude', 'Reasoning', 'Verbal', 'Coding', 'Interview preparation', 'HR interview'],
  Development: ['MERN', 'Java', 'Python', 'JavaScript', 'React', 'Node.js', 'Cloud', 'DevOps'],
  'Other Exams': [],
};

// ---------------------------------------------------------------------------
// Community feed
// ---------------------------------------------------------------------------
export const POST_TYPES = [
  'announcement',
  'knowledge',
  'career_advice',
  'event',
  'achievement',
  'opportunity',
  'technical',
  'study_tips',
  'alumni_experience',
];
export const POST_STATUSES = ['published', 'removed', 'reported'];
export const COMMENT_STATUSES = ['published', 'removed'];
export const LIKE_TARGET_TYPES = ['post', 'comment'];

// ---------------------------------------------------------------------------
// Notifications & announcements
// ---------------------------------------------------------------------------
export const NOTIFICATION_TYPES = [
  'message',
  'connection_request',
  'connection_accepted',
  'meeting_invitation',
  'meeting_reminder',
  'event_registration',
  'event_reminder',
  'scholarship_deadline',
  'scholarship_status',
  'donation_success',
  'new_job',
  'new_resource',
  'announcement',
  'account_verified',
  'account_approved',
  'account_rejected',
  'pending_registration',
  'job_status',
  'resource_status',
  'post_status',
  'mentorship_request',
  'mentorship_accepted',
  'referral_request',
  'certificate_issued',
  'report_status',
];

export const ANNOUNCEMENT_CATEGORIES = [
  'general',
  'exam',
  'placement',
  'event',
  'scholarship',
  'internship',
  'notice',
];
export const ANNOUNCEMENT_AUDIENCES = ['all', 'student', 'faculty', 'alumni'];
export const ANNOUNCEMENT_STATUSES = ['draft', 'published', 'archived'];

// ---------------------------------------------------------------------------
// Reports & audit
// ---------------------------------------------------------------------------
export const REPORT_TARGET_TYPES = ['user', 'post', 'comment', 'event', 'job', 'resource', 'message'];
export const REPORT_STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

export const AUDIT_ACTIONS = [
  'login',
  'logout',
  'register',
  'google_signup',
  'verify_email',
  'forgot_password',
  'reset_password',
  'change_password',
  'role_change',
  'account_delete',
  'account_disable',
  'account_approve',
  'account_reject',
  'scholarship_approval',
  'donation',
  'payment',
  'event_create',
  'event_update',
  'event_delete',
  'attendance_modify',
  'resource_delete',
  'job_moderate',
  'post_moderate',
  'admin_action',
  'support_view',
  'connection_request',
  'connection_accept',
  'connection_reject',
  'connection_remove',
  'meeting_create',
  'meeting_update',
  'meeting_delete',
  'chat_block',
  'report_resolve',
];

// ---------------------------------------------------------------------------
// Mentorship / referrals
// ---------------------------------------------------------------------------
export const MENTORSHIP_STATUSES = ['requested', 'accepted', 'completed', 'rejected', 'cancelled'];
export const MENTORSHIP_SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const REFERRAL_STATUSES = ['requested', 'approved', 'given', 'rejected'];

// ---------------------------------------------------------------------------
// Saved items
// ---------------------------------------------------------------------------
export const SAVED_ITEM_TYPES = ['job', 'resource', 'post', 'event'];

// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];
export const CHAT_MIME_TYPES = [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25 MB

/** Upload use-cases with their MIME whitelists and size caps. */
export const UPLOAD_USES = {
  avatar: { mimeTypes: IMAGE_MIME_TYPES, maxSize: MAX_IMAGE_SIZE, label: 'Profile picture' },
  event: { mimeTypes: IMAGE_MIME_TYPES, maxSize: MAX_IMAGE_SIZE, label: 'Event image' },
  scholarship: { mimeTypes: [...IMAGE_MIME_TYPES, 'application/pdf'], maxSize: MAX_DOCUMENT_SIZE, label: 'Scholarship document' },
  resource: { mimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES], maxSize: MAX_DOCUMENT_SIZE, label: 'Study resource' },
  post: { mimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES], maxSize: MAX_DOCUMENT_SIZE, label: 'Post attachment' },
  chat: { mimeTypes: CHAT_MIME_TYPES, maxSize: MAX_DOCUMENT_SIZE, label: 'Chat attachment' },
};

// ---------------------------------------------------------------------------
// Auth / tokens
// ---------------------------------------------------------------------------
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_MINUTES = 30;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const REFRESH_COOKIE_NAME = 'cc_refresh';
export const REFRESH_COOKIE_PATH = '/api/auth';

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export const PAGINATION = { defaultLimit: 12, maxLimit: 100 };
