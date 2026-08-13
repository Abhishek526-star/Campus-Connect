import SystemSetting from '../models/systemSetting.js';
import { logAudit } from '../utils/audit.js';

/**
 * System settings (spec §20): key-value store with typed defaults.
 */

const DEFAULT_SETTINGS = [
  { key: 'allowStudentRegistration', value: true, description: 'Allow new student registrations' },
  { key: 'allowFacultyRegistration', value: true, description: 'Allow new faculty registrations' },
  { key: 'allowAlumniRegistration', value: true, description: 'Allow new alumni registrations' },
  { key: 'studentPostingAllowed', value: false, description: 'Allow students to post community content' },
  { key: 'requireResourceApproval', value: true, description: 'Require admin approval for uploaded resources' },
  { key: 'requireJobApproval', value: false, description: 'Require admin approval for job postings' },
  { key: 'maxEventParticipants', value: 500, description: 'Default maximum participants for events' },
  { key: 'resourceCategories', value: ['GATE', 'Semester', 'Placement Preparation', 'Development', 'Other Exams'], description: 'Available resource categories (admin-extensible)' },
  { key: 'defaultAnnouncementAudience', value: 'all', description: 'Default audience for announcements' },
];

/** Ensure defaults exist (called on first settings access). */
export async function ensureDefaultSettings() {
  for (const setting of DEFAULT_SETTINGS) {
    await SystemSetting.updateOne(
      { key: setting.key },
      { $setOnInsert: setting },
      { upsert: true },
    );
  }
}

/** Get all settings as a key→value map. */
export async function getSettings() {
  await ensureDefaultSettings();
  const settings = await SystemSetting.find({}).lean();
  const map = {};
  for (const setting of settings) {
    map[setting.key] = setting.value;
  }
  return map;
}

/** Update settings (admin) — audit-logged. */
export async function updateSettings({ updates, actorId, req }) {
  const result = {};
  for (const [key, value] of Object.entries(updates)) {
    const setting = await SystemSetting.findOneAndUpdate(
      { key },
      { $set: { value } },
      { new: true, upsert: true },
    );
    result[key] = setting.value;
  }

  await logAudit({
    action: 'admin_action',
    actorId,
    targetType: 'setting',
    details: { action: 'update_settings', keys: Object.keys(updates) },
    req,
  });

  return result;
}
