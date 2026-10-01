export async function ensureAdminUser({ userModel, email, password, hashPassword }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await userModel.findOne({ email: normalizedEmail });

  if (existing) {
    let changed = false;
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      changed = true;
    }
    if (!existing.is_verified) {
      existing.is_verified = true;
      changed = true;
    }
    if (changed) await existing.save();
    return existing;
  }

  return userModel.create({
    email: normalizedEmail,
    password_hash: await hashPassword(password),
    full_name: 'RentAlls Admin',
    role: 'admin',
    is_verified: true,
  });
}