import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  product_id: { type: String, required: true },
  product_title: { type: String },
  seller_id: { type: String },
  client_name: { type: String, required: true },
  client_phone: { type: String },
  client_email: { type: String },
  status: { type: String, enum: ["Active", "Dismissed"], default: "Active" },
  notes: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Client || mongoose.model('Client', schema);