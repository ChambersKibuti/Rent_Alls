import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  product_id: { type: String },
  payment_id: { type: String },
  product_title: { type: String },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["Open", "In Progress", "Resolved", "Closed"], default: "Open" },
  admin_reply: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Concern || mongoose.model('Concern', schema);