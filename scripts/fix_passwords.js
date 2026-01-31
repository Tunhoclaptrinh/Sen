const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../database/db.json');

(async () => {
  try {
    console.log('Reading DB...');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(raw);

    console.log('Generating new hash for "123456"...');
    const newHash = await bcrypt.hash('123456', 10);
    console.log('New Hash:', newHash);

    let count = 0;
    if (db.users && Array.isArray(db.users)) {
      db.users.forEach(user => {
        user.password = newHash;
        console.log(`Updated password for ${user.email}`);
        count++;
      });
    }

    console.log(`Saving ${count} users...`);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('SUCCESS: Passwords reset to "123456".');

  } catch (e) {
    console.error('ERROR:', e);
  }
})();
