// seedDrugs.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';
import { drugs, categories } from './db/schema';
import { eq } from 'drizzle-orm';

// Sample Data (Paste your JSON array here)
const DRUG_DATA = [
  {
    "Product": "Jointgain With Omega-3",
    "API": "JOINTGAIN",
    "Tags": "glucosamine; Omega-3",
    "Volume": "-",
    "Retail_Price": "6500",
    "Cost_Price": "4500",
    "In_Stock": "50",
    "image_url": "https://victorydrugspharmacy.com/wp-content/uploads/2025/04/Jointgain-Omega-3.jpg",
    "Category": "multivitamins"
  },
  {
    "Product": "Panadol Extra",
    "API": "Paracetamol",
    "Tags": "pain; fever",
    "Volume": "500mg",
    "Retail_Price": "500",
    "Cost_Price": "300",
    "In_Stock": "100",
    "image_url": "",
    "Category": "painkillers"
  }
];

const seedDrugs = async () => {
  const pool = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT || 3306),
  });
  const db = drizzle(pool);

  console.log('Seeding drugs...');

  for (const drug of DRUG_DATA) {
    try {
      // 1. Handle Category
      let categoryId: number;
      const categoryName = drug.Category.trim().toLowerCase(); // Normalize
      
      const existingCat = await db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);

      if (existingCat.length > 0) {
        categoryId = existingCat[0].id;
      } else {
        const [newCat] = await db.insert(categories).values({ name: categoryName }).$returningId();
        categoryId = newCat.id;
        console.log(`Created new category: ${categoryName}`);
      }

      // 2. Insert Drug
      await db.insert(drugs).values({
        name: drug.Product,
        activeIngredient: drug.API,
        tags: drug.Tags,
        volume: drug.Volume,
        retailPrice: drug.Retail_Price.replace(/,/g, ''),
        costPrice: drug.Cost_Price.replace(/,/g, ''),
        stock: parseInt(drug.In_Stock),
        imageUrl: drug.image_url,
        categoryId: categoryId,
        isPrescriptionRequired: false
      });

    } catch (e) {
      console.error(`Failed to insert ${drug.Product}:`, e);
    }
  }

  console.log('Drug seeding complete.');
  await pool.end();
};

seedDrugs();
