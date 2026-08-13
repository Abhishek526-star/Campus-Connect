import { Schema, model } from 'mongoose';
import { MEETING_PARTICIPANT_STATUSES } from '../config/constants.js';

const meetingParticipantSchema = new Schema(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: MEETING_PARTICIPANT_STATUSES, default: 'invited' },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

meetingParticipantSchema.index({ meeting: 1, user: 1 }, { unique: true });
meetingParticipantSchema.index({ user: 1, status: 1 });

export default model('MeetingParticipant', meetingParticipantSchema);
