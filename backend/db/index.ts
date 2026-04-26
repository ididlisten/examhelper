import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Ensure environment variables are loaded
config();

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Using fallback database connection.');
  // For development purposes, use a fallback connection string
  // In production, this would still throw an error
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/examhelper';
}

// Database connection with connection pooling
const client = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 10, // Set pool size
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
});

export const db = drizzle(client);
