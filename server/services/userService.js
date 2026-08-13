import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import Connection from '../models/connection.js';
import { badRequest, notFound } from '../utils/ApiError.js';
import { deleteFile } from './uploadService.js';

const PROFILE_MODELS = {
  student: StudentProfile,
  faculty: FacultyProfile,
  alumni: AlumniProfile,
};

/** Which profile fields each role may update (spec §21 RBAC + §4 profile). */
const EDITABLE_BY_ROLE = {
  student: [
    'rollNumber', 'department', 'course', 'year', 'graduationYear',
    'about', 'location', 'skills', 'education', 'experience',
    'achievements', 'projects', 'certifications', 'socialLinks',
  ],
  faculty: [
    'department', 'designation', 'subjects',
    'about', 'location', 'education', 'experience', 'socialLinks',
  ],
  alumni: [
    'graduationYear', 'department', 'degree', 'currentCompany', 'designation',
    'industry', 'skills', 'location', 'about', 'education', 'experience',
    'achievements', 'projects', 'certifications', 'mentorshipAreas', 'availableForMentorship',
  ],
};

/** Load the current user + their role profile. */
export async function getMyProfile(userId) {
  const user = await User.findById(userId).select(
    'name email role avatar phone badges reputationScore privacy isVerified isApproved isActive createdAt',
  );
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  const model = PROFILE_MODELS[user.role];
  const profile = model ? await model.findOne({ user: userId }).lean() : null;

  return { user, profile };
}

/** Update basic user fields (name, phone). */
export async function updateBasics(userId, data) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');
  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone;
  await user.save();
  return user;
}

/** Update role-specific profile fields (whitelisted per role). */
export async function updateRoleProfile(userId, role, data) {
  const model = PROFILE_MODELS[role];
  if (!model) throw badRequest('This role has no editable profile', 'INVALID_ROLE');

  const allowed = EDITABLE_BY_ROLE[role];
  const update = {};
  for (const key of Object.keys(data)) {
    if (allowed.includes(key)) update[key] = data[key];
  }

  // Alumni store social links as top-level fields; normalize for them.
  if (role === 'alumni' && data.socialLinks) {
    update.linkedinUrl = data.socialLinks.linkedin ?? '';
    update.githubUrl = data.socialLinks.github ?? '';
    update.portfolioUrl = data.socialLinks.portfolio ?? '';
  }

  if (Object.keys(update).length === 0) {
    throw badRequest('No updatable fields provided', 'NOTHING_TO_UPDATE');
  }

  // Upsert: Google-created accounts have no profile document until the member
  // completes it; the first save creates it (validators enforce required
  // fields like rollNumber/department for students).
  const profile = await model.findOneAndUpdate({ user: userId }, { $set: update }, { new: true, upsert: true, runValidators: true });
  if (!profile) throw notFound('Profile not found', 'PROFILE_NOT_FOUND');
  return profile;
}

/** Update per-field privacy settings (spec §41). */
export async function updatePrivacy(userId, data) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');
  user.privacy = { ...(user.privacy ?? {}), ...data };
  await user.save();
  return user.privacy;
}

/** Replace the avatar; deletes the previous file. */
export async function updateAvatar(userId, attachment) {
  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  // Snapshot primitives BEFORE reassigning: `user.avatar` is a Mongoose
  // subdocument — holding the subdoc reference and reading `.url` later can
  // return the NEW value (in-place mutation on assignment), which would make
  // deleteFile unlink the freshly uploaded file instead of the old one.
  const previousUrl = user.avatar?.url ?? null;
  const previousPublicId = user.avatar?.publicId ?? null;

  user.avatar = { url: attachment.url, publicId: attachment.publicId ?? null };
  await user.save();

  if (previousPublicId || previousUrl?.startsWith('/uploads/')) {
    try {
      await deleteFile({ publicId: previousPublicId, url: previousUrl });
    } catch {
      // non-fatal — old file cleanup best effort
    }
  }
  return user.avatar;
}

/**
 * Public profile view (spec §4, §41).
 * Privacy tiers: public → anyone · connections → accepted connections +
 * admins + self · private → self + admins only.
 */
export async function getPublicProfile(userId, viewerId) {
  const user = await User.findById(userId).select(
    'name email role avatar phone badges reputationScore privacy createdAt',
  );
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  const isSelf = Boolean(viewerId) && String(viewerId) === String(userId);
  let tier = 'public';
  if (isSelf) tier = 'private';
  else if (viewerId) {
    const viewer = await User.findById(viewerId).select('role').lean();
    if (viewer?.role === 'admin') tier = 'private';
    else {
      const connection = await Connection.exists({
        status: 'accepted',
        $or: [
          { requester: viewerId, recipient: userId },
          { requester: userId, recipient: viewerId },
        ],
      });
      if (connection) tier = 'connections';
    }
  }

  const canSee = (field) => {
    const level = user.privacy?.[field] ?? 'public';
    if (level === 'public') return true;
    if (level === 'connections') return tier !== 'public';
    return tier === 'private';
  };

  const model = PROFILE_MODELS[user.role];
  const profile = model ? await model.findOne({ user: userId }).lean() : null;

  const publicUser = {
    _id: user._id,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? { url: '', publicId: '' },
    badges: user.badges ?? [],
    reputationScore: user.reputationScore ?? 0,
    createdAt: user.createdAt,
    email: canSee('email') ? user.email : undefined,
    phone: canSee('phone') ? user.phone : undefined,
  };

  const publicProfile = profile
    ? {
        ...profile,
        location: canSee('location') ? profile.location : undefined,
        // Alumni company visibility follows the company setting.
        ...(user.role === 'alumni' ? { currentCompany: canSee('company') ? profile.currentCompany : undefined } : {}),
        // Social links visibility.
        ...(user.role === 'alumni'
          ? {
              linkedinUrl: canSee('socialLinks') ? profile.linkedinUrl : undefined,
              githubUrl: canSee('socialLinks') ? profile.githubUrl : undefined,
              portfolioUrl: canSee('socialLinks') ? profile.portfolioUrl : undefined,
            }
          : {
              socialLinks: canSee('socialLinks') ? profile.socialLinks : undefined,
            }),
      }
    : null;

  return { user: publicUser, profile: publicProfile };
}
