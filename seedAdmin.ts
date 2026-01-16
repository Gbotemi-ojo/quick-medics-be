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

  // Admin Credentials (Matches Login.js requirements)
  const ADMIN_USERNAME = 'admin';
  const ADMIN_EMAIL = 'hommzmum@gmail.com';
  const ADMIN_PASS = '1234'; 

  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);

    // 1. Check if user exists by USERNAME
    const [existingUser] = await db.select().from(users).where(eq(users.username, ADMIN_USERNAME)).limit(1);

    if (existingUser) {
      // FIX: Force update password and email if user exists
      await db.update(users)
        .set({ 
            password: hashedPassword,
            email: ADMIN_EMAIL 
        })
        .where(eq(users.username, ADMIN_USERNAME));
        
      console.log(`✅ Admin user '${ADMIN_USERNAME}' updated with password '${ADMIN_PASS}'.`);
    } else {
      // 2. Create new user if not exists
      await db.insert(users).values({
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
      });
      console.log(`✅ Admin user '${ADMIN_USERNAME}' created successfully.`);
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await pool.end();
  }
};

seedUsers();
