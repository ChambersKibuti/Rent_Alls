import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  host_id: { type: String, required: true },
  host_name: { type: String },
  product_id: { type: String },
  product_title: { type: String },
  category: { type: String, enum: ["Tools", "Equipment", "Vehicles", "Electronics", "Furniture", "Houses", "Transport Services", "Hairdressing", "Other"] },
  status: { type: String, enum: ["live", "ended"], default: "live" },
  active_speaker_id: { type: String },
  active_speaker_name: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Showroom || mongoose.model('Showroom', schema);