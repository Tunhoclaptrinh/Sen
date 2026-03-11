const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, '../database/db.json');
const SEED_FILE = path.join(__dirname, './seedData.json');

function loadSeedData() {
  if (fs.existsSync(SEED_FILE)) {
    return JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  }

  // Fallback to current db snapshot when dedicated seed file is not present.
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }

  throw new Error('No seed source found (missing utils/seedData.json and database/db.json)');
}

const seedData = loadSeedData();

const SUPPORTED_SOURCE_COLLECTIONS = new Set([
  'users',
  'heritage_sites',
  'artifacts',
  'cultural_categories',
  'exhibitions',
  'timelines',
  'collections',
  'favorites',
  'reviews',
  'notifications',
  'addresses',
  'game_chapters',
  'game_levels',
  'game_characters',
  'game_progress',
  'game_sessions',
  'user_inventory',
  'user_characters',
  'user_vouchers',
  'welfare_history',
  'scan_history',
  'game_badges',
  'game_achievements',
  'scan_objects',
  'shop_items',
  'history_articles',
  'learning_modules',
  'vouchers',
  'game_quests',
  'user_quests',
  'transactions',
  'ai_chat_history',
]);

const EXPLICIT_SKIP_COLLECTIONS = new Set([
  'game_progress_legacy',
]);

function toRuntimeCollectionName(sourceCollectionName) {
  const pluralize = mongoose.pluralize();
  return pluralize(sourceCollectionName);
}

function sanitizeDocument(collectionName, item) {
  const doc = { ...item };
  delete doc._id;

  if (collectionName === 'users') {
    if (!doc.phone) doc.phone = '0000000000';
    if (!doc.password) {
      doc.password = '$2b$10$nEqz.0q2m8F0oDkI00pUfe7lJ45.i.2w3uS7B5rT3X7G1s.E/O4.q';
    }
  }

  return doc;
}

// ==================== SEEDING FUNCTIONS ====================

function seedJSON() {
  try {
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Deep clone to avoid mutating the required source.
    const dataToWrite = JSON.parse(JSON.stringify(seedData));
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToWrite, null, 2), 'utf-8');

    console.log('✅ JSON Database seeded successfully from seedData.json!');
    return true;
  } catch (error) {
    console.error('❌ Error writing JSON db:', error);
    return false;
  }
}

async function seedMongoDB() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ Missing DATABASE_URL (or MONGODB_URI), skipping Mongo seed.');
    return false;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    for (const [sourceCollectionName, items] of Object.entries(seedData)) {
      if (EXPLICIT_SKIP_COLLECTIONS.has(sourceCollectionName)) {
        console.log(`⏭️ Skip legacy collection: ${sourceCollectionName}`);
        continue;
      }

      if (!SUPPORTED_SOURCE_COLLECTIONS.has(sourceCollectionName)) {
        console.log(`⏭️ Skip unknown collection: ${sourceCollectionName}`);
        continue;
      }

      if (!Array.isArray(items) || items.length === 0) {
        continue;
      }

      const targetCollectionName = toRuntimeCollectionName(sourceCollectionName);
      const safeItems = items.map((item) => sanitizeDocument(sourceCollectionName, item));

      await db.collection(targetCollectionName).deleteMany({});
      await db.collection(targetCollectionName).insertMany(safeItems, { ordered: false });

      console.log(`🌱 Seeded ${safeItems.length} items: ${sourceCollectionName} -> ${targetCollectionName}`);
    }

    return true;
  } catch (err) {
    console.error('❌ Mongo seed error:', err.message);
    return false;
  } finally {
    await client.close();
  }
}

async function seedDatabase() {
  const dbType = process.env.DB_CONNECTION || 'json';
  console.log(`\n🚀 Seeding Database [${dbType.toUpperCase()}]...\n`);

  if (dbType === 'mongodb') {
    await seedMongoDB();
  } else {
    seedJSON();
  }

  console.log('\n✨ Seeding completed!');
}

// ==================== CLI EXECUTION ====================
if (require.main === module) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
  seedDatabase().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedDatabase, seedData };
