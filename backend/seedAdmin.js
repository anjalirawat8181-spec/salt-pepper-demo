import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from './models/User.js';
import { hashPasswordForStorage } from './utils/password.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment before running the seed script.');
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salt-pepper-demo';
    await mongoose.connect(mongoUri);

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() });
    if (existingAdmin) {
      console.log('Admin user already exists. No changes were made.');
      process.exit(0);
    }

    const passwordRecord = await hashPasswordForStorage(adminPassword, undefined, process.env.PASSWORD_PEPPER);
    await User.create({
      name: 'System Administrator',
      email: adminEmail.toLowerCase(),
      passwordHash: passwordRecord.passwordHash,
      passwordSalt: passwordRecord.passwordSalt,
      passwordVersion: passwordRecord.passwordVersion,
      role: 'admin',
    });

    console.log(`Admin seeded successfully with ${adminEmail}.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
