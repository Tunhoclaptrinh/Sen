/**
 * Script tạo tài khoản hàng loạt từ file email plain text
 * Usage: node scripts/create_accounts.js [path/to/emails.txt]
 * Default file: scripts/emails.txt
 */

const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
const DEFAULT_PASSWORD = 'Sen@2026';
const DEFAULT_ROLE = 'customer';
const DEFAULT_PHONE = '0000000000';

// Disable `id` virtual to avoid conflict with our numeric `id` field
const UserSchema = new mongoose.Schema({}, { strict: false, id: false, timestamps: true });
const User = mongoose.models.users || mongoose.model('users', UserSchema);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nameFromEmail(email) {
  const prefix = email.split('@')[0];
  return prefix
    .replace(/[._\-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || 'User';
}

// Fetch max ID once on startup, then just increment in memory
let _maxId = 0;
async function initMaxId() {
  const last = await User.findOne({}).sort({ id: -1 }).lean();
  _maxId = (last && typeof last.id === 'number') ? last.id : 0;
  console.log(`🔢 ID hiện tại cao nhất: ${_maxId}`);
}

function getNextId() {
  _maxId += 1;
  return _maxId;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const emailFile = process.argv[2] || path.join(__dirname, 'emails.txt');

  if (!fs.existsSync(emailFile)) {
    console.error(`❌ Không tìm thấy file: ${emailFile}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(emailFile, 'utf8')
    .split('\n')
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && l.includes('@') && !l.startsWith('#'));

  if (lines.length === 0) {
    console.error('❌ File không có email hợp lệ nào.');
    process.exit(1);
  }

  console.log(`📋 Tìm thấy ${lines.length} email. Đang kết nối MongoDB...`);

  if (!MONGO_URI) {
    throw new Error('Missing DATABASE_URL (or MONGODB_URI)');
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Kết nối thành công!\n');

  await initMaxId();

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const results = { created: [], skipped: [], failed: [] };

  for (const email of lines) {
    try {
      const existing = await User.findOne({ email }).lean();
      if (existing) {
        console.log(`⏭️  Bỏ qua (đã tồn tại): ${email}`);
        results.skipped.push(email);
        continue;
      }

      const nextId = getNextId();
      const name = nameFromEmail(email);

      await User.create({
        id: nextId,
        name,
        email,
        password: hashedPassword,
        phone: DEFAULT_PHONE,
        role: DEFAULT_ROLE,
        isActive: true,
      });

      console.log(`✅ Đã tạo: ${email}  (ID: ${nextId}, Tên: ${name})`);
      results.created.push(email);

    } catch (err) {
      console.error(`❌ Lỗi [${email}]: ${err.message}`);
      results.failed.push(email);
    }
  }

  console.log('\n─────────────────────────────────────────');
  console.log(`📊 Kết quả:`);
  console.log(`   ✅ Đã tạo:   ${results.created.length} tài khoản`);
  console.log(`   ⏭️  Bỏ qua:  ${results.skipped.length} (email đã tồn tại)`);
  console.log(`   ❌ Thất bại: ${results.failed.length}`);
  if (results.failed.length > 0) {
    console.log('   Failed:', results.failed.join(', '));
  }
  console.log(`   🔑 Password: ${DEFAULT_PASSWORD}`);
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
