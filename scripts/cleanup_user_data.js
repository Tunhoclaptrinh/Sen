const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const db = require('../config/database');
const userService = require('../services/user.service');
const mongoose = require('mongoose');

function parseArgs(argv) {
  const args = {
    userId: null,
    email: null,
    dryRun: false,
    keepUser: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (token === '--keep-user') {
      args.keepUser = true;
      continue;
    }

    if (token.startsWith('--userId=')) {
      args.userId = token.split('=')[1];
      continue;
    }

    if (token === '--userId' && argv[i + 1]) {
      args.userId = argv[i + 1];
      i++;
      continue;
    }

    if (token.startsWith('--email=')) {
      args.email = token.split('=')[1];
      continue;
    }

    if (token === '--email' && argv[i + 1]) {
      args.email = argv[i + 1];
      i++;
      continue;
    }
  }

  return args;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/cleanup_user_data.js --userId <id> [--dry-run] [--keep-user]');
  console.log('  node scripts/cleanup_user_data.js --email <email> [--dry-run] [--keep-user]');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run   Only report what would be deleted');
  console.log('  --keep-user Cleanup traces but keep user record');
}

async function resolveUserId({ userId, email }) {
  if (userId !== null && userId !== undefined) {
    const numericUserId = Number(userId);
    if (!Number.isFinite(numericUserId)) {
      throw new Error('Invalid --userId value');
    }

    const user = await db.findById('users', numericUserId);
    if (!user) {
      throw new Error(`User not found: ${numericUserId}`);
    }

    return { id: numericUserId, email: user.email || null };
  }

  if (email) {
    const normalized = String(email).trim().toLowerCase();
    const users = await db.findAll('users');
    const found = users.find((u) => String(u.email || '').toLowerCase() === normalized);

    if (!found) {
      throw new Error(`User not found by email: ${email}`);
    }

    return { id: Number(found.id), email: found.email || null };
  }

  throw new Error('Either --userId or --email is required');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.userId && !args.email) {
    printUsage();
    return { success: false, exitCode: 1 };
  }

  const mode = process.env.DB_CONNECTION || 'json';
  console.log(`DB mode: ${mode}`);

  const target = await resolveUserId(args);
  console.log(`Target user: ${target.id}${target.email ? ` (${target.email})` : ''}`);
  console.log(`Dry run: ${args.dryRun ? 'YES' : 'NO'}`);
  console.log(`Delete user record: ${args.keepUser ? 'NO' : 'YES'}`);

  const result = await userService.purgeUserData(target.id, {
    deleteUserRecord: !args.keepUser,
    dryRun: args.dryRun,
  });

  if (!result.success) {
    console.error('Cleanup failed:', result.message);
    return { success: false, exitCode: result.statusCode || 1 };
  }

  console.log(result.message);
  console.log(JSON.stringify(result.data, null, 2));

  if (args.dryRun) {
    console.log('Dry run completed. Re-run without --dry-run to execute cleanup.');
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
