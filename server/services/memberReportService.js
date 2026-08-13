import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import User from '../models/user.js';
import StudentProfile from '../models/studentProfile.js';
import FacultyProfile from '../models/facultyProfile.js';
import AlumniProfile from '../models/alumniProfile.js';
import { toPdfSafeText } from '../utils/exporters.js';
import { forbidden, notFound } from '../utils/ApiError.js';

const SERVER_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Roles allowed to download individual member reports (admin/faculty/alumni). */
export const REPORT_VIEWER_ROLES = ['admin', 'faculty', 'alumni'];

const PROFILE_MODELS = {
  student: StudentProfile,
  faculty: FacultyProfile,
  alumni: AlumniProfile,
};

const BADGE_LABELS = {
  verified_student: 'Verified student',
  verified_faculty: 'Verified faculty',
  verified_alumni: 'Verified alumni',
  verified_organizer: 'Verified organizer',
  mentor: 'Mentor',
  scholarship_sponsor: 'Scholarship sponsor',
};

/** Human-friendly label per role. */
const ROLE_LABELS = { admin: 'Administrator', student: 'Student', faculty: 'Faculty', alumni: 'Alumni' };

/**
 * Load a member's photo as a Buffer when available.
 * Local /uploads/... URLs resolve straight from disk; remote URLs (Cloudinary,
 * Google picture) are fetched with a short timeout. Failures are silent — the
 * report simply renders without a photo.
 */
async function loadPhoto(url) {
  if (!url) return null;
  try {
    if (url.startsWith('/uploads/')) {
      const filePath = path.join(SERVER_ROOT, url.replace(/^\//, ''));
      const buf = await fs.readFile(filePath);
      return { buffer: buf, mime: 'image/png' };
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > 10 * 1024 * 1024) return null;
    return { buffer, mime: contentType };
  } catch {
    return null;
  }
}

/** One labelled detail row (label column + value column, wraps long values). */
function drawDetailRow(doc, label, value, startY) {
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e3a8a').text(toPdfSafeText(label), 48, startY, { width: 150 });
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor('#0f172a')
    .text(toPdfSafeText(value ?? '—'), 208, startY, { width: 330, lineBreak: true });
  const labelHeight = doc.heightOfString(toPdfSafeText(label), { width: 150 });
  const valueHeight = doc.heightOfString(toPdfSafeText(value ?? '—'), { width: 330 });
  return Math.max(20, labelHeight, valueHeight) + 6;
}

/**
 * Individual member report PDF — full profile details + photo.
 * Accessible to admin, faculty and alumni.
 */
export async function generateMemberReport({ userId, viewerRole }) {
  if (!REPORT_VIEWER_ROLES.includes(viewerRole)) {
    throw forbidden('Only admins, faculty and alumni can download member reports', 'REPORT_FORBIDDEN');
  }

  const user = await User.findById(userId);
  if (!user) throw notFound('User not found', 'USER_NOT_FOUND');

  const profile = await PROFILE_MODELS[user.role]?.findOne({ user: user._id }).lean();
  const photo = await loadPhoto(user.avatar?.url);

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on('end', resolve));

  // Header band
  doc.rect(0, 0, 595.28, 70).fill('#1e3a8a');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(15).text('Campus Connect — Member Report', 48, 20, { width: 400 });
  doc.font('Helvetica').fontSize(9).fillColor('#cbd5e1').text(`Generated ${new Date().toLocaleString('en-IN')}`, 48, 44, { width: 400 });

  // Photo (circle-cropped) + identity
  let identityX = 48;
  if (photo) {
    try {
      doc.save();
      doc.circle(118, 130, 55).clip();
      doc.image(photo.buffer, 63, 75, { width: 110, height: 110, fit: [110, 110] });
      doc.restore();
    } catch {
      // photo failed to embed — continue without it
    }
    identityX = 200;
  }

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(20).text(toPdfSafeText(user.name), identityX, 95, { width: 340 });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#475569')
    .text(`${ROLE_LABELS[user.role] ?? user.role} · ${user.isVerified ? 'Verified' : 'Unverified'}`, identityX, 122, { width: 340 });
  if (user.avatar?.url && !photo) {
    doc.fontSize(8.5).fillColor('#94a3b8').text('(photo unavailable)', identityX, 140, { width: 340 });
  }

  // Detail sections
  const details = [
    ['Email', user.email],
    ['Phone', user.phone || profile?.phone || '—'],
    ['Location', profile?.location || '—'],
  ];
  if (user.role === 'student') {
    details.push(
      ['Roll number', profile?.rollNumber ?? '—'],
      ['Department', profile?.department ?? '—'],
      ['Course', profile?.course ?? '—'],
      ['Year', profile?.year ? String(profile.year) : '—'],
      ['Graduation year', profile?.graduationYear ? String(profile.graduationYear) : '—'],
    );
  } else if (user.role === 'faculty') {
    details.push(
      ['Employee ID', profile?.employeeId ?? '—'],
      ['Department', profile?.department ?? '—'],
      ['Designation', profile?.designation ?? '—'],
      ['Subjects', (profile?.subjects ?? []).join(', ') || '—'],
    );
  } else if (user.role === 'alumni') {
    details.push(
      ['Graduation year', profile?.graduationYear ? String(profile.graduationYear) : '—'],
      ['Degree', profile?.degree ?? '—'],
      ['Department', profile?.department ?? '—'],
      ['Company', profile?.currentCompany ?? '—'],
      ['Designation', profile?.designation ?? '—'],
      ['Industry', profile?.industry ?? '—'],
    );
  }

  let y = photo ? 200 : 150;
  doc.moveTo(48, y).lineTo(547, y).strokeColor('#e2e8f0').stroke();
  y += 14;
  doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(11).text('Profile details', 48, y);
  y += 24;

  for (const [label, value] of details) {
    if (y > 720) {
      doc.addPage();
      y = 70;
    }
    y += drawDetailRow(doc, label, value, y);
  }

  // Badges + reputation + membership
  if (y > 640) {
    doc.addPage();
    y = 70;
  }
  y += 8;
  doc.moveTo(48, y).lineTo(547, y).strokeColor('#e2e8f0').stroke();
  y += 14;
  doc.fillColor('#1e3a8a').font('Helvetica-Bold').fontSize(11).text('Community', 48, y);
  y += 24;

  const badges = (user.badges ?? []).map((b) => BADGE_LABELS[b] ?? b);
  const community = [
    ['Badges', badges.length ? badges.join(', ') : '—'],
    ['Reputation score', String(user.reputationScore ?? 0)],
    ['Member since', new Date(user.createdAt).toLocaleDateString('en-IN')],
    ['Last login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : 'Never'],
  ];
  for (const [label, value] of community) {
    if (y > 720) {
      doc.addPage();
      y = 70;
    }
    y += drawDetailRow(doc, label, value, y);
  }

  // Footer
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text('Campus Connect · Alumni–Student Community Platform', 48, 800, { width: 500, align: 'center' });

  doc.end();
  await done;

  const safeName = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'member';
  return {
    buffer: Buffer.concat(chunks),
    filename: `member-report-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`,
  };
}
