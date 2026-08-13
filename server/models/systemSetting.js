import { Schema, model } from 'mongoose';

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true },
);

export default model('SystemSetting', systemSettingSchema);
