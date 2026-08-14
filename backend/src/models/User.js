import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  // Core auth fields (handled natively by base44; we own them ourselves now)
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String },
  full_name: { type: String },
  is_verified: { type: Boolean, default: false },
  otp_code: { type: String },
  otp_expires: { type: Date },
  reset_token: { type: String },
  reset_token_expires: { type: Date },
  auth_provider: { type: String, enum: ["local", "google"], default: "local" },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  user_type: { type: String, enum: ["buyer", "seller"] },
  phone: { type: String },
  national_id: { type: String },
  seller_id: { type: String },
  buyer_average_rating: { type: Number, default: 0 },
  buyer_total_ratings: { type: Number, default: 0 },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.User || mongoose.model('User', schema);