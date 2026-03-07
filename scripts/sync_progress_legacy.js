const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_FILE = path.resolve(__dirname, '../database/db.json');

function parseArgs(argv) {
  const args = {
    dryRun: false,
    mode: 'auto', // auto | json | mongodb | both
    help: false
  };

  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }

    if (token.startsWith('--mode=')) {
      args.mode = token.split('=')[1];
      continue;
    }

    if (token === '--mode') {
      throw new Error('Use --mode=<auto|json|mongodb|both>');
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  const allowedModes = new Set(['auto', 'json', 'mongodb', 'both']);
  if (!allowedModes.has(args.mode)) {
    throw new Error(`Invalid --mode value: ${args.mode}`);
  }

  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/sync_progress_legacy.js [--dry-run] [--mode=<auto|json|mongodb|both>]');
  console.log('');
  console.log('Description:');
  console.log('  Synchronize data from game_progress_legacy into game_progress and remove legacy records.');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run     Report changes without writing data');
  console.log('  --mode=...    Target storage mode: auto|json|mongodb|both');
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toArray(value, fallback = []) {
  return Array.isArray(value) ? value : fallback;
}

function uniqByStableString(arr) {
  const map = new Map();

  for (const item of arr) {
    const key = (item && typeof item === 'object')
      ? JSON.stringify(item)
      : String(item);

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function mergeModuleProgress(existingModules, legacyModules) {
  const map = new Map();
  const source = [...toArray(existingModules), ...toArray(legacyModules)];

  for (const item of source) {
    if (item && typeof item === 'object' && item.moduleId !== undefined && item.moduleId !== null) {
      const key = `module:${toNumber(item.moduleId, -1)}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
      continue;
    }

    const key = `raw:${JSON.stringify(item)}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function parseDateMs(value) {
  if (!value) return null;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function latestDateValue(a, b) {
  const ams = parseDateMs(a);
  const bms = parseDateMs(b);

  if (ams === null) return b || null;
  if (bms === null) return a || null;

  return ams >= bms ? a : b;
}

function earliestDateValue(a, b) {
  const ams = parseDateMs(a);
  const bms = parseDateMs(b);

  if (ams === null) return b || null;
  if (bms === null) return a || null;

  return ams <= bms ? a : b;
}

function buildProgressFromLegacy(legacyItem, nextId) {
  return {
    id: nextId,
    userId: toNumber(legacyItem.userId),
    currentChapter: toNumber(legacyItem.currentChapter, 1),
    totalSenPetals: toNumber(legacyItem.totalSenPetals, 0),
    totalPoints: toNumber(legacyItem.totalPoints, 0),
    level: toNumber(legacyItem.level, 1),
    coins: toNumber(legacyItem.coins, 1000),
    unlockedChapters: uniqByStableString(toArray(legacyItem.unlockedChapters, [1])),
    finishedChapters: uniqByStableString(toArray(legacyItem.finishedChapters, [])),
    completedLevels: uniqByStableString(toArray(legacyItem.completedLevels, [])),
    levelReviewHistory: uniqByStableString(toArray(legacyItem.levelReviewHistory, [])),
    collectedCharacters: uniqByStableString(toArray(legacyItem.collectedCharacters, [])),
    badges: uniqByStableString(toArray(legacyItem.badges, [])),
    achievements: uniqByStableString(toArray(legacyItem.achievements, [])),
    museumOpen: Boolean(legacyItem.museumOpen),
    museumIncome: toNumber(legacyItem.museumIncome, 0),
    streakDays: toNumber(legacyItem.streakDays, 0),
    completedModules: mergeModuleProgress([], legacyItem.completedModules),
    totalLearningTime: toNumber(legacyItem.totalLearningTime, 0),
    lastRewardClaim: legacyItem.lastRewardClaim || null,
    lastLogin: legacyItem.lastLogin || new Date().toISOString(),
    createdAt: legacyItem.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function mergeProgress(existing, legacyItem) {
  const merged = {
    ...existing,
    currentChapter: Math.max(toNumber(existing.currentChapter, 1), toNumber(legacyItem.currentChapter, 1)),
    totalSenPetals: Math.max(toNumber(existing.totalSenPetals, 0), toNumber(legacyItem.totalSenPetals, 0)),
    totalPoints: Math.max(toNumber(existing.totalPoints, 0), toNumber(legacyItem.totalPoints, 0)),
    level: Math.max(toNumber(existing.level, 1), toNumber(legacyItem.level, 1)),
    coins: Math.max(toNumber(existing.coins, 0), toNumber(legacyItem.coins, 0)),
    unlockedChapters: uniqByStableString([
      ...toArray(existing.unlockedChapters, []),
      ...toArray(legacyItem.unlockedChapters, [])
    ]),
    finishedChapters: uniqByStableString([
      ...toArray(existing.finishedChapters, []),
      ...toArray(legacyItem.finishedChapters, [])
    ]),
    completedLevels: uniqByStableString([
      ...toArray(existing.completedLevels, []),
      ...toArray(legacyItem.completedLevels, [])
    ]),
    collectedCharacters: uniqByStableString([
      ...toArray(existing.collectedCharacters, []),
      ...toArray(legacyItem.collectedCharacters, [])
    ]),
    badges: uniqByStableString([
      ...toArray(existing.badges, []),
      ...toArray(legacyItem.badges, [])
    ]),
    achievements: uniqByStableString([
      ...toArray(existing.achievements, []),
      ...toArray(legacyItem.achievements, [])
    ]),
    completedModules: mergeModuleProgress(existing.completedModules, legacyItem.completedModules),
    museumOpen: Boolean(existing.museumOpen) || Boolean(legacyItem.museumOpen),
    museumIncome: Math.max(toNumber(existing.museumIncome, 0), toNumber(legacyItem.museumIncome, 0)),
    streakDays: Math.max(toNumber(existing.streakDays, 0), toNumber(legacyItem.streakDays, 0)),
    totalLearningTime: Math.max(toNumber(existing.totalLearningTime, 0), toNumber(legacyItem.totalLearningTime, 0)),
    lastRewardClaim: latestDateValue(existing.lastRewardClaim, legacyItem.lastRewardClaim),
    lastLogin: latestDateValue(existing.lastLogin, legacyItem.lastLogin),
    createdAt: earliestDateValue(existing.createdAt, legacyItem.createdAt),
    updatedAt: new Date().toISOString()
  };

  const changed = JSON.stringify(existing) !== JSON.stringify(merged);
  return { changed, merged };
}

function ensureJsonArray(data, key) {
  if (!Array.isArray(data[key])) {
    data[key] = [];
  }
}

async function syncJsonMode({ dryRun }) {
  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const data = JSON.parse(raw);

  ensureJsonArray(data, 'users');
  ensureJsonArray(data, 'game_progress');
  ensureJsonArray(data, 'game_progress_legacy');

  const validUserIds = new Set(
    data.users
      .map((u) => toNumber(u?.id, NaN))
      .filter((id) => Number.isFinite(id))
  );

  const legacyItems = [...data.game_progress_legacy];
  const progressItems = [...data.game_progress];

  const report = {
    mode: 'json',
    dryRun,
    users: data.users.length,
    gameProgress: progressItems.length,
    legacyBefore: legacyItems.length,
    created: 0,
    merged: 0,
    skippedNoUser: 0,
    removedLegacy: legacyItems.length,
    touchedUsers: []
  };

  let nextId = progressItems.reduce((max, item) => Math.max(max, toNumber(item?.id, 0)), 0) + 1;

  for (const legacy of legacyItems) {
    const userId = toNumber(legacy?.userId, NaN);

    if (!Number.isFinite(userId) || !validUserIds.has(userId)) {
      report.skippedNoUser += 1;
      continue;
    }

    const index = progressItems.findIndex((p) => toNumber(p?.userId, NaN) === userId);

    if (index === -1) {
      const created = buildProgressFromLegacy(legacy, nextId++);
      progressItems.push(created);
      report.created += 1;
      report.touchedUsers.push(userId);
      continue;
    }

    const { changed, merged } = mergeProgress(progressItems[index], legacy);
    if (changed) {
      progressItems[index] = merged;
      report.merged += 1;
      report.touchedUsers.push(userId);
    }
  }

  report.touchedUsers = uniqByStableString(report.touchedUsers).sort((a, b) => a - b);

  if (!dryRun) {
    data.game_progress = progressItems;
    data.game_progress_legacy = [];
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  return report;
}

async function syncMongoMode({ dryRun }) {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing DATABASE_URL (or MONGODB_URI) for Mongo sync mode');
  }

  await mongoose.connect(uri);

  const usersCol = mongoose.connection.collection('users');
  const allCollections = await mongoose.connection.db.listCollections({}, { nameOnly: true }).toArray();
  const collectionNameSet = new Set(allCollections.map((c) => c.name));

  const progressCandidates = ['game_progresses', 'game_progress'];
  const legacyCandidates = ['game_progress_legacies', 'game_progress_legacy'];

  const progressCollectionName = progressCandidates.find((name) => collectionNameSet.has(name)) || 'game_progresses';
  const legacyCollectionNames = legacyCandidates.filter((name) => collectionNameSet.has(name));

  const progressCol = mongoose.connection.collection(progressCollectionName);

  const users = await usersCol.find({}).toArray();
  const progressItems = await progressCol.find({}).toArray();

  const legacyItemsRaw = [];
  for (const legacyCollectionName of legacyCollectionNames) {
    const legacyCol = mongoose.connection.collection(legacyCollectionName);
    const items = await legacyCol.find({}).toArray();
    legacyItemsRaw.push(...items);
  }

  const legacyItemsMap = new Map();
  for (const item of legacyItemsRaw) {
    if (!item) continue;
    const userId = toNumber(item.userId, NaN);
    const legacyId = toNumber(item.id, NaN);
    const key = Number.isFinite(userId) && Number.isFinite(legacyId)
      ? `${userId}:${legacyId}`
      : String(item._id || JSON.stringify(item));

    if (!legacyItemsMap.has(key)) {
      legacyItemsMap.set(key, item);
    }
  }

  const legacyItems = Array.from(legacyItemsMap.values());

  const validUserIds = new Set(
    users
      .map((u) => toNumber(u?.id, NaN))
      .filter((id) => Number.isFinite(id))
  );

  const report = {
    mode: 'mongodb',
    dryRun,
    progressCollection: progressCollectionName,
    legacyCollections: legacyCollectionNames,
    users: users.length,
    gameProgress: progressItems.length,
    legacyBefore: legacyItems.length,
    created: 0,
    merged: 0,
    skippedNoUser: 0,
    removedLegacy: legacyItems.length,
    touchedUsers: []
  };

  let nextId = progressItems.reduce((max, item) => Math.max(max, toNumber(item?.id, 0)), 0) + 1;

  for (const legacy of legacyItems) {
    const userId = toNumber(legacy?.userId, NaN);

    if (!Number.isFinite(userId) || !validUserIds.has(userId)) {
      report.skippedNoUser += 1;
      continue;
    }

    const existing = progressItems.find((p) => toNumber(p?.userId, NaN) === userId);

    if (!existing) {
      const created = buildProgressFromLegacy(legacy, nextId++);
      if (!dryRun) {
        await progressCol.insertOne(created);
      }
      report.created += 1;
      report.touchedUsers.push(userId);
      progressItems.push(created);
      continue;
    }

    const { changed, merged } = mergeProgress(existing, legacy);

    if (changed) {
      if (!dryRun) {
        await progressCol.updateOne(
          { _id: existing._id },
          { $set: merged }
        );
      }

      Object.assign(existing, merged);
      report.merged += 1;
      report.touchedUsers.push(userId);
    }
  }

  report.touchedUsers = uniqByStableString(report.touchedUsers).sort((a, b) => a - b);

  if (!dryRun) {
    for (const legacyCollectionName of legacyCollectionNames) {
      const legacyCol = mongoose.connection.collection(legacyCollectionName);
      await legacyCol.deleteMany({});
    }
  }

  return report;
}

async function runByMode(mode, options) {
  if (mode === 'json') {
    return [await syncJsonMode(options)];
  }

  if (mode === 'mongodb') {
    return [await syncMongoMode(options)];
  }

  if (mode === 'both') {
    const jsonReport = await syncJsonMode(options);
    const mongoReport = await syncMongoMode(options);
    return [jsonReport, mongoReport];
  }

  const autoMode = process.env.DB_CONNECTION === 'mongodb' ? 'mongodb' : 'json';
  return runByMode(autoMode, options);
}

async function closeMongoConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

async function main() {
  let args;

  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    printUsage();
    return { success: false, exitCode: 1 };
  }

  if (args.help) {
    printUsage();
    return { success: true, exitCode: 0 };
  }

  console.log(`Mode: ${args.mode}`);
  console.log(`Dry run: ${args.dryRun ? 'YES' : 'NO'}`);

  const reports = await runByMode(args.mode, { dryRun: args.dryRun });

  const summary = {
    dryRun: args.dryRun,
    reports
  };

  console.log(args.dryRun ? 'Dry run completed.' : 'Sync completed successfully.');
  console.log(JSON.stringify(summary, null, 2));

  if (args.dryRun) {
    console.log('Re-run without --dry-run to apply changes.');
  }

  return { success: true, exitCode: 0 };
}

(async () => {
  let exitCode = 0;

  try {
    const result = await main();
    exitCode = result?.exitCode ?? 0;
    console.log(`Final status: ${result?.success ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    exitCode = 1;
    console.error('Sync script error:', error.message);
    console.log('Final status: FAILED');
  } finally {
    await closeMongoConnection();
    process.exit(exitCode);
  }
})();
