import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { User } from '../modules/identity/models/user.model.js';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDatabase();

  const passwordHash = await bcrypt.hash('AdminPassword123!', 12);
  const customerPasswordHash = await bcrypt.hash('CustomerPassword123!', 12);

  // Upsert Admin
  const existingAdmin = await User.findOne({ email: 'admin@autodock.lk' });
  if (!existingAdmin) {
    await User.create({
      email: 'admin@autodock.lk',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Platform',
      phone: '+94112345678',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    console.log('Created Admin user: admin@autodock.lk / AdminPassword123!');
  } else {
    console.log('Admin user already exists: admin@autodock.lk');
  }

  // Upsert Customer
  const existingCustomer = await User.findOne({ email: 'customer@autodock.lk' });
  if (!existingCustomer) {
    await User.create({
      email: 'customer@autodock.lk',
      passwordHash: customerPasswordHash,
      firstName: 'Kasun',
      lastName: 'Perera',
      phone: '+94771234567',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    console.log('Created Customer user: customer@autodock.lk / CustomerPassword123!');
  } else {
    console.log('Customer user already exists: customer@autodock.lk');
  }

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
