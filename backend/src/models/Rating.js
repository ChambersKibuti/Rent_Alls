import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  rater_id: { type: String, required: true },
  rater_name: { type: String },
  rated_id: { type: String, required: true },
  rated_name: { type: String },
  rated_role: { type: String, enum: ["buyer", "seller"] },
  product_id: { type: String },
  product_title: { type: String },
  payment_id: { type: String },
  rating: { type: Number, required: true },
  review: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Rating || mongoose.model('Rating', schema);