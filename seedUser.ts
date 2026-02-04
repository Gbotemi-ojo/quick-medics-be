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

  // Admin Credentials
  const ADMIN_NAME = '';
  const ADMIN_EMAIL = '';
  const ADMIN_PHONE = ''; 
  const ADMIN_PASS = ''; 

  try {
    const hashedPassword = await bcrypt.hash(ADMIN_PASS, 10);

    // 1. Check if user exists by EMAIL
    const [existingUser] = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

    if (existingUser) {
      // Update existing admin to ensure password is correct
      await db.update(users)
        .set({ 
            password: hashedPassword,
            fullName: ADMIN_NAME,
            phone: ADMIN_PHONE,
            role: 'admin' // Ensure role is set
        })
        .where(eq(users.email, ADMIN_EMAIL));
        
      console.log(`✅ Admin user '${ADMIN_EMAIL}' updated successfully.`);
    } else {
      // Create new admin
      await db.insert(users).values({
        fullName: ADMIN_NAME,
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`✅ Admin user '${ADMIN_EMAIL}' created successfully.`);
    }
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await pool.end();
  }
};

seedUsers();
