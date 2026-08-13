import { Schema, model } from 'mongoose';
import { ATTENDANCE_METHODS, ATTENDANCE_STATUSES } from '../config/constants.js';

const attendanceSchema = new Schema(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    registrationStatus: { type: String, enum: ['registered', 'manual'], default: 'registered' },
    status: { type: String, enum: ATTENDANCE_STATUSES, default: 'registered', index: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    method: { type: String, enum: ATTENDANCE_METHODS, default: 'qr' },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true },
);

// One attendance record per user per event.
attendanceSchema.index({ event: 1, user: 1 }, { unique: true });
attendanceSchema.index({ event: 1, status: 1 });
attendanceSchema.index({ user: 1, createdAt: -1 });

export default model('Attendance', attendanceSchema);
