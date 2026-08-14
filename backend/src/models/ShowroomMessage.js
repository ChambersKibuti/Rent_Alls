import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  showroom_id: { type: String, required: true },
  sender_id: { type: String, required: true },
  sender_name: { type: String },
  type: { type: String, enum: ["comment", "reaction", "speak_request", "join"], default: "comment", required: true },
  content: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.ShowroomMessage || mongoose.model('ShowroomMessage', schema);