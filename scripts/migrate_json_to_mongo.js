const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_FILE = path.join(__dirname, '../database/db.json');
const MONGO_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

// Keep this list aligned with MongoAdapter model mapping.
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

function parseArgs(argv) {
  const args = {
    dryRun: false,
    skipCleanup: false,
  };

  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token === '--skip-cleanup') {
      args.skipCleanup = true;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

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

async function cleanupLegacyCollections(db, touchedSources, args) {
  if (args.skipCleanup || args.dryRun) {
    return [];
  }

  const dropped = [];
  const list = await db.listCollections({}, { nameOnly: true }).toArray();
  const existing = new Set(list.map((c) => c.name));

  for (const source of touchedSources) {
    const target = toRuntimeCollectionName(source);

    // Drop old singular source collection when runtime uses a different target.
    if (source !== target && existing.has(source)) {
      await db.collection(source).drop();
      dropped.push(source);
    }
  }

  for (const legacyName of ['game_progress_legacy', 'game_progress_legacies']) {
    if (existing.has(legacyName)) {
      await db.collection(legacyName).drop();
      dropped.push(legacyName);
    }
  }

  return dropped;
}

async function migrate(args) {
  if (!MONGO_URI) {
    throw new Error('Missing DATABASE_URL (or MONGODB_URI)');
  }

  if (!fs.existsSync(DB_FILE)) {
    throw new Error(`db.json not found: ${DB_FILE}`);
  }

  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const client = new MongoClient(MONGO_URI);

  await client.connect();
  const db = client.db();

  const summary = {
    dryRun: args.dryRun,
    imported: [],
    skippedLegacy: [],
    skippedUnknown: [],
    skippedEmpty: [],
    droppedLegacyCollections: [],
  };

  const touchedSources = [];

  try {
    for (const [sourceCollectionName, items] of Object.entries(dbData)) {
      if (EXPLICIT_SKIP_COLLECTIONS.has(sourceCollectionName)) {
        summary.skippedLegacy.push(sourceCollectionName);
        continue;
      }

      if (!SUPPORTED_SOURCE_COLLECTIONS.has(sourceCollectionName)) {
        summary.skippedUnknown.push(sourceCollectionName);
        continue;
      }

      if (!Array.isArray(items) || items.length === 0) {
        summary.skippedEmpty.push(sourceCollectionName);
        continue;
      }

      const targetCollectionName = toRuntimeCollectionName(sourceCollectionName);
      const safeItems = items.map((item) => sanitizeDocument(sourceCollectionName, item));

      console.log(
        `⏳ ${args.dryRun ? '[DRY-RUN] ' : ''}Import ${sourceCollectionName} -> ${targetCollectionName} (${safeItems.length})`
      );

      if (!args.dryRun) {
        await db.collection(targetCollectionName).deleteMany({});
        await db.collection(targetCollectionName).insertMany(safeItems, { ordered: false });
      }

      touchedSources.push(sourceCollectionName);
      summary.imported.push({
        source: sourceCollectionName,
        target: targetCollectionName,
        count: safeItems.length,
      });
    }

    const dropped = await cleanupLegacyCollections(db, touchedSources, args);
    summary.droppedLegacyCollections = dropped;

    return summary;
  } finally {
    await client.close();
  }
}

(async () => {
  let exitCode = 0;

  try {
    const args = parseArgs(process.argv.slice(2));
    const summary = await migrate(args);

    console.log(args.dryRun
      ? 'Dry run completed. No data was modified.'
      : 'Migration completed successfully.');

    console.log(JSON.stringify(summary, null, 2));
    console.log('Final status: SUCCESS');
  } catch (error) {
    exitCode = 1;
    console.error('Migration error:', error.message);
    console.log('Final status: FAILED');
  } finally {
    process.exit(exitCode);
  }
})();
