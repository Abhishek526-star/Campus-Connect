import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import Connection from '../models/connection.js';
import { badRequest, conflict, notFound } from '../utils/ApiError.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { createNotification } from './notificationService.js';
import { logAudit } from '../utils/audit.js';

const PROFILE_MODELS = {
  student: StudentProfile,
  faculty: FacultyProfile,
  alumni: AlumniProfile,
};

const DIRECTORY_PROFILE_FIELDS =
  'department graduationYear currentCompany designation industry location skills course year';

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Build the map of the viewer's connection statuses keyed by other user id. */
async function buildConnectionStatusMap(viewerId) {
  const connections = await Connection.find({
    $or: [{ requester: viewerId }, { recipient: viewerId }],
  }).lean();

  const map = new Map();
  for (const connection of connections) {
    const isRequester = String(connection.requester) === String(viewerId);
    const otherId = String(isRequester ? connection.recipient : connection.requester);
    map.set(otherId, {
      status: connection.status,
      direction: isRequester ? 'outgoing' : 'incoming',
      id: connection._id,
    });
  }
  return map;
}

/**
 * People directory (spec §6) — server-side search + filters + pagination.
 * Filters: role, department, graduationYear (batch), company, industry,
 * location, designation, skills; plus free-text name search.
 */
export async function getDirectory({ viewerId, filters = {}, page, limit, sort }) {
  const roles = filters.role && filters.role !== 'all' ? [filters.role] : ['student', 'faculty', 'alumni'];

  // 1) Profile-collection filters → candidate user ids.
  let profileUserIds = null;
  for (const role of roles) {
    const model = PROFILE_MODELS[role];
    const query = {};

    if (filters.department) query.department = filters.department;
    if (filters.graduationYear && (role === 'student' || role === 'alumni')) {
      query.graduationYear = Number(filters.graduationYear);
    }
    if (role === 'alumni') {
      if (filters.company) query.currentCompany = { $regex: escapeRegExp(filters.company), $options: 'i' };
      if (filters.industry) query.industry = filters.industry;
    }
    if (filters.location) query.location = { $regex: escapeRegExp(filters.location), $options: 'i' };
    if (filters.designation) query.designation = { $regex: escapeRegExp(filters.designation), $options: 'i' };
    if (filters.skills?.length) query.skills = { $all: filters.skills };

    const profiles = await model.find(query).select('user').lean();
    const ids = profiles.map((profile) => profile.user);
    profileUserIds = profileUserIds ? profileUserIds.concat(ids) : ids;
  }

  if (roles.length === 1 && profileUserIds.length === 0) {
    return { items: [], meta: paginationMeta(0, page, limit) };
  }

  // 2) User query.
  const userQuery = {
    role: { $in: roles },
    isActive: true,
    isApproved: true,
    _id: { $ne: viewerId },
  };
  if (profileUserIds) {
    userQuery._id = { $in: profileUserIds, $ne: viewerId };
  }
  if (filters.search) {
    userQuery.name = { $regex: escapeRegExp(filters.search), $options: 'i' };
  }

  const sortOptions = {
    name: { name: 1 },
    '-name': { name: -1 },
    reputation: { reputationScore: -1 },
    '-reputation': { reputationScore: 1 },
    newest: { createdAt: -1 },
  }[sort] ?? { name: 1 };

  const [users, total] = await Promise.all([
    User.find(userQuery)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('name avatar role badges reputationScore')
      .lean(),
    User.countDocuments(userQuery),
  ]);

  const statusMap = await buildConnectionStatusMap(viewerId);

  const items = await Promise.all(
    users.map(async (user) => {
      const profile = PROFILE_MODELS[user.role]
        ? await PROFILE_MODELS[user.role].findOne({ user: user._id }).select(DIRECTORY_PROFILE_FIELDS).lean()
        : null;
      return {
        _id: user._id,
        name: user.name,
        role: user.role,
        avatar: user.avatar ?? { url: '', publicId: '' },
        badges: user.badges ?? [],
        reputationScore: user.reputationScore ?? 0,
        profile,
        connection: statusMap.get(String(user._id)) ?? { status: 'none' },
      };
    }),
  );

  return { items, meta: paginationMeta(total, page, limit) };
}

/** List accepted connections of a user (both directions), enriched. */
export async function listConnections({ userId, status = 'accepted' }) {
  const connections = await Connection.find({
    status,
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    connections.map(async (connection) => {
      const otherId = String(connection.requester) === String(userId) ? connection.recipient : connection.requester;
      const user = await User.findById(otherId).select('name avatar role badges reputationScore').lean();
      if (!user) return null;
      const profile = PROFILE_MODELS[user.role]
        ? await PROFILE_MODELS[user.role].findOne({ user: user._id }).select(DIRECTORY_PROFILE_FIELDS).lean()
        : null;
      return { _id: connection._id, createdAt: connection.createdAt, user: { ...user, profile } };
    }),
  ).then((items) => items.filter(Boolean));
}

/** Incoming pending requests with requester details. */
export async function listRequests({ userId }) {
  const connections = await Connection.find({ recipient: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    connections.map(async (connection) => {
      const requester = await User.findById(connection.requester).select('name avatar role badges reputationScore').lean();
      if (!requester) return null;
      const profile = PROFILE_MODELS[requester.role]
        ? await PROFILE_MODELS[requester.role].findOne({ user: requester._id }).select(DIRECTORY_PROFILE_FIELDS).lean()
        : null;
      return { _id: connection._id, createdAt: connection.createdAt, requester: { ...requester, profile } };
    }),
  ).then((items) => items.filter(Boolean));
}

/** Outgoing pending requests (awaiting response). */
export async function listOutgoingRequests({ userId }) {
  const connections = await Connection.find({ requester: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    connections.map(async (connection) => {
      const recipient = await User.findById(connection.recipient).select('name avatar role badges reputationScore').lean();
      if (!recipient) return null;
      const profile = PROFILE_MODELS[recipient.role]
        ? await PROFILE_MODELS[recipient.role].findOne({ user: recipient._id }).select(DIRECTORY_PROFILE_FIELDS).lean()
        : null;
      return { _id: connection._id, createdAt: connection.createdAt, recipient: { ...recipient, profile } };
    }),
  ).then((items) => items.filter(Boolean));
}

/** Send a connection request (spec §6). Handles re-request after reject/remove. */
export async function sendRequest({ requesterId, recipientId, req }) {
  if (String(requesterId) === String(recipientId)) {
    throw badRequest('You cannot connect with yourself', 'SELF_CONNECTION');
  }

  const recipient = await User.findById(recipientId).select('name email isActive isApproved');
  if (!recipient || !recipient.isActive || !recipient.isApproved) {
    throw notFound('User not found', 'USER_NOT_FOUND');
  }

  const existing = await Connection.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  });

  let connection;
  if (existing) {
    if (existing.status === 'accepted') throw conflict('You are already connected with this user', 'ALREADY_CONNECTED');
    if (existing.status === 'pending') {
      const alreadySent = String(existing.requester) === String(requesterId);
      throw conflict(
        alreadySent ? 'Connection request already sent' : 'This user has already sent you a request',
        alreadySent ? 'REQUEST_ALREADY_SENT' : 'REQUEST_EXISTS_INCOMING',
      );
    }
    // rejected/removed → allow a fresh request on the same record.
    existing.requester = requesterId;
    existing.recipient = recipientId;
    existing.status = 'pending';
    existing.respondedAt = null;
    connection = await existing.save();
  } else {
    connection = await Connection.create({ requester: requesterId, recipient: recipientId });
  }

  const requester = await User.findById(requesterId).select('name');
  await createNotification({
    recipientId,
    type: 'connection_request',
    title: 'New connection request',
    body: `${requester?.name ?? 'Someone'} wants to connect with you`,
    data: { url: '/connections/requests', userId: requesterId },
  });
  await logAudit({
    action: 'connection_request',
    actorId: requesterId,
    targetType: 'connection',
    targetId: connection._id,
    details: { recipientId },
    req,
  });

  return connection;
}

/** Accept an incoming request (recipient only). */
export async function acceptRequest({ connectionId, userId, req }) {
  const connection = await Connection.findOne({ _id: connectionId, recipient: userId, status: 'pending' });
  if (!connection) throw notFound('Connection request not found', 'REQUEST_NOT_FOUND');

  connection.status = 'accepted';
  connection.respondedAt = new Date();
  await connection.save();

  const acceptor = await User.findById(userId).select('name');
  await createNotification({
    recipientId: connection.requester,
    type: 'connection_accepted',
    title: 'Connection accepted',
    body: `${acceptor?.name ?? 'Your request'} is now connected with you`,
    data: { url: '/people' },
  });
  await logAudit({
    action: 'connection_accept',
    actorId: userId,
    targetType: 'connection',
    targetId: connection._id,
    req,
  });

  return connection;
}

/** Reject an incoming request (recipient only). */
export async function rejectRequest({ connectionId, userId, req }) {
  const connection = await Connection.findOneAndUpdate(
    { _id: connectionId, recipient: userId, status: 'pending' },
    { $set: { status: 'rejected', respondedAt: new Date() } },
    { new: true },
  );
  if (!connection) throw notFound('Connection request not found', 'REQUEST_NOT_FOUND');

  await logAudit({
    action: 'connection_reject',
    actorId: userId,
    targetType: 'connection',
    targetId: connection._id,
    req,
  });
  return connection;
}

/** Cancel an outgoing pending request (requester only). */
export async function cancelRequest({ connectionId, userId, req }) {
  const result = await Connection.deleteOne({ _id: connectionId, requester: userId, status: 'pending' });
  if (result.deletedCount === 0) throw notFound('Connection request not found', 'REQUEST_NOT_FOUND');

  await logAudit({
    action: 'connection_remove',
    actorId: userId,
    targetType: 'connection',
    targetId: connectionId,
    req,
  });
}

/** Remove an accepted connection (either party). */
export async function removeConnection({ connectionId, userId, req }) {
  const result = await Connection.deleteOne({
    _id: connectionId,
    status: 'accepted',
    $or: [{ requester: userId }, { recipient: userId }],
  });
  if (result.deletedCount === 0) throw notFound('Connection not found', 'CONNECTION_NOT_FOUND');

  await logAudit({
    action: 'connection_remove',
    actorId: userId,
    targetType: 'connection',
    targetId: connectionId,
    req,
  });
}

/**
 * Suggestions (spec §5, §6): same-department members, excluding self,
 * existing/pending connections, and blocked users; sorted by reputation.
 */
export async function getSuggestions({ userId, limit = 12 }) {
  const own = await User.findById(userId).select('role blockedUsers').lean();
  if (!own) return [];

  const ownProfile = PROFILE_MODELS[own.role] ? await PROFILE_MODELS[own.role].findOne({ user: userId }).select('department').lean() : null;
  if (!ownProfile?.department) return [];

  const existing = await Connection.find({ $or: [{ requester: userId }, { recipient: userId }] }).select('requester recipient').lean();
  const excluded = new Set([String(userId), ...(own.blockedUsers ?? []).map(String)]);
  existing.forEach((connection) => {
    excluded.add(String(connection.requester));
    excluded.add(String(connection.recipient));
  });

  const candidateIds = new Set();
  for (const role of ['student', 'alumni', 'faculty']) {
    const profiles = await PROFILE_MODELS[role].find({ department: ownProfile.department }).select('user').lean();
    profiles.forEach((profile) => candidateIds.add(String(profile.user)));
  }

  const eligible = [...candidateIds].filter((id) => !excluded.has(id)).slice(0, 40);
  if (eligible.length === 0) return [];

  const users = await User.find({ _id: { $in: eligible } })
    .sort({ reputationScore: -1 })
    .limit(limit)
    .select('name avatar role badges reputationScore')
    .lean();

  return Promise.all(
    users.map(async (user) => {
      const profile = PROFILE_MODELS[user.role]
        ? await PROFILE_MODELS[user.role].findOne({ user: user._id }).select(DIRECTORY_PROFILE_FIELDS).lean()
        : null;
      return { _id: user._id, name: user.name, role: user.role, avatar: user.avatar, badges: user.badges ?? [], profile };
    }),
  );
}

export { parsePagination };
