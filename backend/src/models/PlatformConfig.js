import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  commission_payment_method: { type: String, enum: ["Bank Transfer", "Mobile Money", "Card"], required: true },
  commission_account_name: { type: String },
  commission_account_number: { type: String },
  commission_bank_name: { type: String },
  commission_rate: { type: Number, default: 0.2 },
  rebate_multiplier: { type: Number, default: 100 },
  platform_name: { type: String, default: "RentAll" },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.PlatformConfig || mongoose.model('PlatformConfig', schema);