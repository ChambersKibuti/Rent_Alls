import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price_per_day: { type: Number, required: true },
  category: { type: String, enum: ["Tools", "Equipment", "Vehicles", "Electronics", "Furniture", "Houses", "Transport Services", "Hairdressing", "Other"], required: true },
  status: { type: String, enum: ["Available", "Leased", "Maintenance"], default: "Available" },
  image_url: { type: String },
  images: { type: [String] },
  specifications: { type: String },
  deposit_amount: { type: Number },
  location_name: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
  quantity_available: { type: Number, default: 1 },
  seller_id: { type: String },
  created_by_id: { type: String },
  created_by_email: { type: String },
}, { timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' } });

export default mongoose.models.Product || mongoose.model('Product', schema);