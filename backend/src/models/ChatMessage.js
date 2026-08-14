import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  product_id: { type: String },
  sender_name: { type: String },
  message: { type: String, required: true },
  is_admin: { type: Boolean, default: false },
  seller_id: { type: String },
  buyer_id: { type: String },
  conversation_type: { type: String, enum: ["Admin", "Seller"], default: "Admin" },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', schema);