import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ["Normal", "Urgent", "Featured"], default: "Normal" },
  is_active: { type: Boolean, default: true },
  product_id: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Notice || mongoose.model('Notice', schema);