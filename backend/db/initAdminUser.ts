import { db } from './db';
import { users, InsertUser } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Admin user credentials will be created through the signup process
async function initAdminUser() {
  try {
    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error during database initialization:', error);
  }
}

export { initAdminUser };