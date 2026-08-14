import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  product_id: { type: String, required: true },
  product_title: { type: String, required: true },
  amount: { type: Number, required: true },
  rental_amount: { type: Number },
  commission_amount: { type: Number },
  commission_paid: { type: Boolean, default: false },
  rent_paid: { type: Boolean, default: false },
  seller_revealed: { type: Boolean, default: false },
  seller_contact: { type: String },
  payment_type: { type: String, enum: ["Commission", "Rent"], default: "Commission" },
  payment_method: { type: String, enum: ["Card", "Mobile Money", "USSD", "Bank Transfer"], required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed", "Refunded"], default: "Pending" },
  rental_days: { type: Number },
  reference_number: { type: String },
  notes: { type: String },
  client_id: { type: String },
  seller_id: { type: String },
  seller_payment_method: { type: String },
  seller_account_number: { type: String },
  commission_destination: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Payment || mongoose.model('Payment', schema);