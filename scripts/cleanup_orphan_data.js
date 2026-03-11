const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../config/database');
const mongoose = require('mongoose');

const DELETE_RULES = [
  { collection: 'game_progress', fields: ['userId'] },
  { collection: 'game_sessions', fields: ['userId'] },
  { collection: 'user_inventory', fields: ['userId'] },
  { collection: 'scan_history', fields: ['userId'] },
  { collection: 'favorites', fields: ['userId'] },
  { collection: 'reviews', fields: ['userId', 'createdBy'] },
  { collection: 'collections', fields: ['userId', 'createdBy'] },
  { collection: 'notifications', fields: ['userId'] },
  { collection: 'ai_chat_history', fields: ['userId'] },
  { collection: 'transactions', fields: ['userId'] },
  { collection: 'user_quests', fields: ['userId'] },
  { collection: 'user_characters', fields: ['userId'] },
  { collection: 'user_vouchers', fields: ['userId'] },
  { collection: 'welfare_history', fields: ['userId'] },
];

const SCRUB_CREATED_BY_COLLECTIONS = [
  'heritage_sites',
  'artifacts',
  'exhibitions',
  'history_articles',
  'learning_modules',
  'game_chapters',
  'game_levels'
];

function parseArgs(argv) {
  const args = {
    dryRun: false,
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

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/cleanup_orphan_data.js [--dry-run]');
  console.log('');
  console.log('Description:');
  console.log('  Sweep orphan records that reference non-existing users.');
  console.log('  - Delete records with orphan user references (userId/createdBy)');
  console.log('  - Clear createdBy on CMS content if author no longer exists');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run   Only report what would change, do not write data');
}

function normalizeUserId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

function hasOrphanUserReference(item, fields, validUserIds, orphanIdSet) {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(item, field)) {
      continue;
    }

    const normalized = normalizeUserId(item[field]);

    if (normalized === null) {
      continue;
    }

    if (!validUserIds.has(normalized)) {
      orphanIdSet.add(normalized);
      return true;
    }
  }

  return false;
}

function collectReviewTargets(items) {
  const targets = new Map();

  for (const review of items) {
    if (!review || !review.type || review.referenceId === undefined || review.referenceId === null) {
      continue;
    }

    const referenceId = Number(review.referenceId);
    if (!Number.isFinite(referenceId)) {
      continue;
    }

    const key = `${review.type}:${referenceId}`;

    if (!targets.has(key)) {
      targets.set(key, {
        type: review.type,
        referenceId
      });
    }
  }

  return targets;
}

async function deleteOrphanRecords(rule, validUserIds, dryRun) {
  const items = await db.findAll(rule.collection);
  const orphanIdSet = new Set();
  const candidates = [];

  for (const item of items) {
    if (!item || item.id === undefined || item.id === null) {
      continue;
    }

    if (hasOrphanUserReference(item, rule.fields, validUserIds, orphanIdSet)) {
      candidates.push(item);
    }
  }

  if (!dryRun) {
    for (const item of candidates) {
      await db.delete(rule.collection, item.id);
    }
  }

  return {
    scanned: items.length,
    count: candidates.length,
    items: candidates,
    orphanUserIds: Array.from(orphanIdSet)
  };
}

async function scrubOrphanCreatedBy(collection, validUserIds, dryRun) {
  const items = await db.findAll(collection);
  const orphanIdSet = new Set();
  const candidates = [];

  for (const item of items) {
    if (!item || item.id === undefined || item.id === null) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(item, 'createdBy')) {
      continue;
    }

    const normalized = normalizeUserId(item.createdBy);

    if (normalized === null) {
      continue;
    }

    if (!validUserIds.has(normalized)) {
      orphanIdSet.add(normalized);
      candidates.push(item);
    }
  }

  if (!dryRun) {
    for (const item of candidates) {
      await db.update(collection, item.id, {
        createdBy: null,
        updatedAt: new Date().toISOString()
      });
    }
  }

  return {
    scanned: items.length,
    count: candidates.length,
    orphanUserIds: Array.from(orphanIdSet)
  };
}

async function sweepOrphanData({ dryRun }) {
  const users = await db.findAll('users');
  const validUserIds = new Set();

  for (const user of users) {
    const normalized = normalizeUserId(user?.id);
    if (normalized !== null) {
      validUserIds.add(normalized);
    }
  }

  const report = {
    mode: process.env.DB_CONNECTION || 'json',
    dryRun,
    users: {
      total: users.length
    },
    scanned: {
      collections: 0,
      records: 0
    },
    deleted: {
      total: 0,
      byCollection: {}
    },
    scrubbed: {
      total: 0,
      byCollection: {}
    },
    orphanUserIds: [],
    affectedReviewItems: 0
  };

  const orphanUserIdSet = new Set();
  const reviewTargets = new Map();

  for (const rule of DELETE_RULES) {
    const result = await deleteOrphanRecords(rule, validUserIds, dryRun);

    report.scanned.collections += 1;
    report.scanned.records += result.scanned;
    report.deleted.byCollection[rule.collection] = result.count;
    report.deleted.total += result.count;

    for (const orphanUserId of result.orphanUserIds) {
      orphanUserIdSet.add(orphanUserId);
    }

    if (rule.collection === 'reviews' && result.items.length > 0) {
      const targets = collectReviewTargets(result.items);
      for (const [key, value] of targets.entries()) {
        reviewTargets.set(key, value);
      }
    }
  }

  for (const collection of SCRUB_CREATED_BY_COLLECTIONS) {
    const result = await scrubOrphanCreatedBy(collection, validUserIds, dryRun);

    report.scanned.collections += 1;
    report.scanned.records += result.scanned;
    report.scrubbed.byCollection[collection] = result.count;
    report.scrubbed.total += result.count;

    for (const orphanUserId of result.orphanUserIds) {
      orphanUserIdSet.add(orphanUserId);
    }
  }

  if (!dryRun && reviewTargets.size > 0) {
    const reviewService = require('../services/review.service');
    for (const target of reviewTargets.values()) {
      await reviewService.updateItemRating(target.type, target.referenceId);
    }
  }

  report.orphanUserIds = Array.from(orphanUserIdSet).sort((a, b) => a - b);
  report.affectedReviewItems = reviewTargets.size;

  return report;
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

  console.log(`DB mode: ${process.env.DB_CONNECTION || 'json'}`);
  console.log(`Dry run: ${args.dryRun ? 'YES' : 'NO'}`);

  const report = await sweepOrphanData({ dryRun: args.dryRun });

  const summary = args.dryRun
    ? 'Dry run completed. No data was modified.'
    : 'Orphan cleanup completed successfully.';

  console.log(summary);
  console.log(JSON.stringify(report, null, 2));

  if (args.dryRun) {
    console.log('Re-run without --dry-run to apply cleanup changes.');
  }

  return { success: true, exitCode: 0 };
}

async function closeMongoConnection() {
  if (process.env.DB_CONNECTION !== 'mongodb') {
    return;
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
    }
  } catch (error) {
    console.error('Warning: failed to close MongoDB connection:', error.message);
  }
}

(async () => {
  let exitCode = 0;

  try {
    const result = await main();
    exitCode = result?.exitCode ?? 0;
    console.log(`Final status: ${result?.success ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    exitCode = 1;
    console.error('Cleanup script error:', error.message);
    console.log('Final status: FAILED');
  } finally {
    await closeMongoConnection();
    process.exit(exitCode);
  }
})();
