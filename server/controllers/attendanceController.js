import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { toCsvBuffer, toPdfBuffer, toXlsxBuffer } from '../utils/exporters.js';
import {
  checkIn,
  checkOut,
  editAttendance,
  generateQrToken,
  getEventSummary,
  listEventAttendance,
  listMyAttendance,
  markManual,
  notifyCheckIn,
} from '../services/attendanceService.js';
import { assertCanManageEvent } from '../services/attendanceService.js';

/** POST /api/attendance/event/:eventId/qr-token — organizer generates a fresh QR. */
export const generateQr = asyncHandler(async (req, res) => {
  const result = await generateQrToken({
    eventId: req.params.eventId,
    userId: req.user._id,
    role: req.user.role,
    durationMinutes: req.body.durationMinutes,
    req,
  });
  sendSuccess(res, { message: 'QR code generated', data: result });
});

/** POST /api/attendance/check-in — validate the scanned token. */
export const checkInHandler = asyncHandler(async (req, res) => {
  const result = await checkIn({ qrToken: req.body.qrToken, userId: req.user._id, req });
  await notifyCheckIn({ userId: req.user._id, eventTitle: result.event.title });
  sendSuccess(res, { status: 201, message: 'Attendance marked — welcome!', data: result });
});

/** POST /api/attendance/event/:eventId/check-out. */
export const checkOutHandler = asyncHandler(async (req, res) => {
  const attendance = await checkOut({ eventId: req.params.eventId, userId: req.user._id });
  sendSuccess(res, { message: 'Checked out', data: { attendance } });
});

/** GET /api/attendance/event/:eventId — organizer list. */
export const getEventAttendance = asyncHandler(async (req, res) => {
  const items = await listEventAttendance({ eventId: req.params.eventId, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Attendance records', data: { items } });
});

/** GET /api/attendance/event/:eventId/summary — counts + percentage. */
export const getSummary = asyncHandler(async (req, res) => {
  const result = await getEventSummary({ eventId: req.params.eventId, userId: req.user._id, role: req.user.role });
  sendSuccess(res, { message: 'Attendance summary', data: result });
});

/** POST /api/attendance/event/:eventId/manual — organizer marks someone. */
export const manualMark = asyncHandler(async (req, res) => {
  const attendance = await markManual({
    eventId: req.params.eventId,
    userId: req.user._id,
    role: req.user.role,
    data: req.body,
    req,
  });
  sendSuccess(res, { status: 201, message: 'Attendance marked', data: { attendance } });
});

/** PUT /api/attendance/:id?eventId=… — organizer edits a record (scoped to its event). */
export const edit = asyncHandler(async (req, res) => {
  const attendance = await editAttendance({
    eventId: req.query.eventId,
    attendanceId: req.params.id,
    userId: req.user._id,
    role: req.user.role,
    data: req.body,
    req,
  });
  sendSuccess(res, { message: 'Attendance updated', data: { attendance } });
});

/** GET /api/attendance/user/:userId — own history (self only). */
export const getMyAttendance = asyncHandler(async (req, res) => {
  const items = await listMyAttendance({ userId: req.params.userId });
  sendSuccess(res, { message: 'My attendance', data: { items } });
});

/** GET /api/attendance/event/:eventId/export?format=csv|xlsx|pdf — organizer. */
export const exportAttendance = asyncHandler(async (req, res) => {
  await assertCanManageEvent(req.params.eventId, { _id: req.user._id, role: req.user.role });

  const items = await listEventAttendance({ eventId: req.params.eventId, userId: req.user._id, role: req.user.role });
  const format = ['csv', 'xlsx', 'pdf'].includes(req.query.format) ? req.query.format : 'csv';

  const columns = [
    { key: 'name', header: 'Name', width: 26 },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'role', header: 'Role', width: 12 },
    { key: 'status', header: 'Status', width: 14 },
    { key: 'method', header: 'Method', width: 12 },
    { key: 'checkIn', header: 'Check-in time', width: 22, render: (r) => r.checkInTime ? new Date(r.checkInTime).toLocaleString('en-IN') : '—' },
    { key: 'checkOut', header: 'Check-out time', width: 22, render: (r) => r.checkOutTime ? new Date(r.checkOutTime).toLocaleString('en-IN') : '—' },
  ];

  const rows = items.map((record) => ({
    name: record.user?.name ?? '—',
    email: record.user?.email ?? '—',
    role: record.user?.role ?? '—',
    status: record.status,
    method: record.method,
    checkInTime: record.checkInTime,
    checkOutTime: record.checkOutTime,
  }));

  const filename = `attendance-${req.params.eventId}.${format}`;

  if (format === 'xlsx') {
    const buffer = await toXlsxBuffer(rows, columns);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  if (format === 'pdf') {
    const buffer = await toPdfBuffer({
      title: 'Attendance Report',
      subtitle: `Event ${req.params.eventId} · ${new Date().toLocaleString('en-IN')}`,
      rows,
      columns,
      landscape: true,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(buffer);
  }

  const buffer = toCsvBuffer(rows, columns);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
