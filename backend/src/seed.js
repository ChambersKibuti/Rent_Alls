// One-off setup script: creates the first admin account and a default
// PlatformConfig row so the admin dashboard has something to edit.
//
// Usage:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=changeme npm run seed
import 'dotenv/config';
import { connectDB } from './lib/db.js';
import { hashPassword } from './lib/auth.js';
import User from './models/User.js';
import PlatformConfig from './models/PlatformConfig.js';
import Notice from './models/Notice.js';

async function seed() {
  await connectDB();

  const email = (process.env.ADMIN_EMAIL || 'admin@rentalls.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  let admin = await User.findOne({ email });
  if (admin) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    admin = await User.create({
      email,
      password_hash: await hashPassword(password),
      full_name: 'RentAlls Admin',
      role: 'admin',
      is_verified: true,
    });
    console.log(`Created admin user: ${email} / ${password}`);
    console.log('IMPORTANT: log in and change this password.');
  }

  const existingConfig = await PlatformConfig.findOne();
  if (!existingConfig) {
    await PlatformConfig.create({
      commission_payment_method: 'Bank Transfer',
      commission_account_name: 'RentAlls Ltd',
      commission_account_number: '0000000000',
      commission_bank_name: 'Change Me Bank',
      commission_rate: 0.2,
      rebate_multiplier: 100,
      platform_name: 'RentAlls',
      created_by_id: String(admin._id),
      created_by_email: admin.email,
    });
    console.log('Created default PlatformConfig.');
  } else {
    console.log('PlatformConfig already exists, skipping.');
  }

  const existingNotice = await Notice.findOne();
  if (!existingNotice) {
    await Notice.create({
      title: 'Welcome to RentAlls',
      message: 'List your first item or browse available assets to get started.',
      priority: 'Featured',
      is_active: true,
      created_by_id: String(admin._id),
      created_by_email: admin.email,
    });
    console.log('Created a starter Notice (edit or add more from the admin dashboard).');
  } else {
    console.log('A Notice already exists, skipping.');
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
