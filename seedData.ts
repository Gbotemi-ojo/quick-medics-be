import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const seedUsers = async () => {
  const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 3306),
  });
  const db = drizzle(pool);

  // --- CONFIGURATION ---
  const ADMIN_USER = 'admin';
  const ADMIN_EMAIL = 'admin@pharmacy.com'; 
  const ADMIN_PASS = 'admin123'; // Change this to your desired password
  // ---------------------

  try {
    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.username, ADMIN_USER)).limit(1);

    if (existingUser.length > 0) {
      console.log(`User '${ADMIN_USER}' already exists. Skipping.`);
    } else {
      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);

      // INSERT: Note that we use 'password', NOT 'passwordHash'
      await db.insert(users).values({
        username: ADMIN_USER,
        email: ADMIN_EMAIL,
        password: hashedPassword, // <--- FIXED HERE
        // role: 'owner',        <--- REMOVED: Your schema doesn't have a 'role' column yet
        // isActive: true,       <--- REMOVED: Your schema doesn't have an 'isActive' column yet
      });
      console.log(`User '${ADMIN_USER}' created successfully.`);
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await pool.end();
  }
};

seedUsers();