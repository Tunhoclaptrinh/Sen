import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * CONFIGURATION
 * Provide the source URI here or pass it via SOURCE_MONGO_URI env var.
 */
const SOURCE_URI = process.env.SOURCE_MONGO_URI || "YOUR_SOURCE_MONGODB_URI_HERE";
const DEST_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

if (!SOURCE_URI || SOURCE_URI.includes("YOUR_SOURCE_MONGODB_URI_HERE")) {
  console.error("❌ Error: Missing SOURCE_MONGO_URI.");
  console.log("Please edit scripts/migrate-db-to-db.mjs or set SOURCE_MONGO_URI environment variable.");
  process.exit(1);
}

if (!DEST_URI) {
  console.error("❌ Error: Missing destination DATABASE_URL in .env file.");
  process.exit(1);
}

async function runMigration() {
  const sourceClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {
    console.log("⏳ Connecting to databases...");
    await sourceClient.connect();
    await destClient.connect();
    
    const sourceDb = sourceClient.db();
    const destDb = destClient.db();

    console.log(`✅ Connected!`);
    console.log(`Source DB: "${sourceDb.databaseName}"`);
    console.log(`Target DB: "${destDb.databaseName}"`);

    // Get all collections from source
    const collections = await sourceDb.listCollections().toArray();
    console.log(`\n📦 Found ${collections.length} collections to migrate.`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        console.log(`⏭️  Skipping system collection: ${collectionName}`);
        continue;
      }

      console.log(`\n🚀 Migrating collection: "${collectionName}"...`);
      const sourceCol = sourceDb.collection(collectionName);
      const destCol = destDb.collection(collectionName);

      const count = await sourceCol.countDocuments();
      if (count === 0) {
        console.log(`  └─ Collection is empty, skipping.`);
        continue;
      }

      console.log(`  └─ Found ${count} documents. Clearing target collection...`);
      await destCol.deleteMany({}); // Optional: clear target before copy

      // Process in batches to handle large data
      const batchSize = 1000;
      let migratedCount = 0;
      const cursor = sourceCol.find();

      let batch = [];
      while (await cursor.hasNext()) {
        const doc = await cursor.next();
        batch.push(doc);

        if (batch.length === batchSize) {
          await destCol.insertMany(batch);
          migratedCount += batch.length;
          process.stdout.write(`  └─ Progress: ${migratedCount}/${count}\r`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await destCol.insertMany(batch);
        migratedCount += batch.length;
      }

      console.log(`  └─ ✅ Migration complete: ${migratedCount} documents.`);
    }

    console.log("\n✨ DATABASE MIGRATION COMPLETED SUCCESSFULLY! ✨");

  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:");
    console.error(error);
  } finally {
    await sourceClient.close();
    await destClient.close();
    process.exit(0);
  }
}

runMigration();
