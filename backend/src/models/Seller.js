import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  business_name: { type: String, required: true },
  description: { type: String },
  subscription_plan: { type: String, enum: ["2_months", "6_months", "1_year"], required: true },
  subscription_start: { type: String },
  subscription_end: { type: String },
  subscription_fee: { type: Number },
  status: { type: String, enum: ["Active", "Expired", "Pending"], default: "Pending" },
  phone: { type: String },
  email: { type: String },
  location_name: { type: String },
  address: { type: String },
  payment_method: { type: String, enum: ["Bank Transfer", "Mobile Money", "Card"] },
  account_number: { type: String },
  initial_product_name: { type: String },
  initial_product_quantity: { type: Number },
  total_sales: { type: Number, default: 0 },
  rebate_status: { type: String, enum: ["None", "Eligible", "Paid", "Not Eligible"], default: "None" },
  rebate_amount: { type: Number },
  average_rating: { type: Number, default: 0 },
  total_ratings: { type: Number, default: 0 },
  fee_waiver: { type: Boolean, default: false },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Seller || mongoose.model('Seller', schema);