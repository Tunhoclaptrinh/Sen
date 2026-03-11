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
  console.log("⏳ Initializing connections...");
  const sourceClient = new MongoClient(SOURCE_URI);
  const destClient = new MongoClient(DEST_URI);

  try {
    await sourceClient.connect();
    await destClient.connect();
    
    const sourceDb = sourceClient.db();
    const destDb = destClient.db();

    // Get connection details
    const sourceOptions = sourceClient.options;
    const destOptions = destClient.options;
    
    const sourceHost = sourceOptions.hosts[0];
    const destHost = destOptions.hosts[0];

    console.log(`✅ Connected!`);
    console.log(`📡 SOURCE: ${sourceHost} / Database: "${sourceDb.databaseName}"`);
    console.log(`📡 TARGET: ${destHost} / Database: "${destDb.databaseName}"`);

    // CRITICAL SAFETY CHECK
    if (sourceHost === destHost && sourceDb.databaseName === destDb.databaseName) {
      console.error("\n❌ DANGER: Source and Target are the SAME DATABASE!");
      console.error("Migration aborted to prevent data loss.");
      process.exit(1);
    }

    // List all databases on source to help user find the right one
    try {
      const dbs = await sourceClient.db('admin').admin().listDatabases();
      console.log("\n📁 Databases found on source server:");
      dbs.databases.forEach(db => {
        const isCurrent = db.name === sourceDb.databaseName ? " ⭐ (CURRENTLY SELECTED)" : "";
        console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)${isCurrent}`);
      });
    } catch (e) {
      console.log("\nℹ️  Note: Could not list all databases (limited permissions).");
    }

    const collections = await sourceDb.listCollections().toArray();
    console.log(`\n📦 Total collections in source: ${collections.length}`);

    let totalMigrated = 0;

    for (const col of collections) {
      if (col.name.startsWith('system.')) continue;

      const sourceCol = sourceDb.collection(col.name);
      const count = await sourceCol.countDocuments();

      if (count === 0) {
        console.log(`  [ ] "${col.name}": 0 docs (Skipped)`);
        continue;
      }

      console.log(`  [>] "${col.name}": ${count} docs. Migrating...`);
      const destCol = destDb.collection(col.name);
      await destCol.deleteMany({});

      const cursor = sourceCol.find();
      let batch = [];
      while (await cursor.hasNext()) {
        batch.push(await cursor.next());
        if (batch.length >= 1000) {
          await destCol.insertMany(batch);
          batch = [];
        }
      }
      if (batch.length > 0) await destCol.insertMany(batch);
      
      totalMigrated += count;
      console.log(`      ✅ Done.`);
    }

    if (totalMigrated === 0) {
      console.log("\n⚠️  WARNING: No data was found to migrate.");
      console.log("Please check if you connected to the correct database name.");
    } else {
      console.log(`\n✨ SUCCESS: Migrated ${totalMigrated} documents!`);
    }

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
  } finally {
    await sourceClient.close();
    await destClient.close();
    process.exit(0);
  }
}

runMigration();
