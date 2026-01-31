const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');
console.log('Checking DB at:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('ERROR: DB file not found!');
  process.exit(1);
}

try {
  const raw = fs.readFileSync(dbPath, 'utf8');
  console.log('DB file size:', raw.length, 'bytes');

  const db = JSON.parse(raw);
  console.log('JSON Parse: SUCCESS');

  const collections = Object.keys(db);
  console.log('Collections:', collections.join(', '));

  if (db.heritage_sites) {
    console.log('Heritage Sites Count:', db.heritage_sites.length);
    if (db.heritage_sites.length > 0) {
      console.log('First Site:', db.heritage_sites[0].name);
      console.log('First Site Owner:', db.heritage_sites[0].created_by);
      console.log('First Site Status:', db.heritage_sites[0].status);
    }
  } else {
    console.error('ERROR: heritage_sites collection missing!');
  }

  if (db.users) {
    console.log('Users Count:', db.users.length);
    const admin = db.users.find(u => u.role === 'admin');
    const researcher = db.users.find(u => u.role === 'researcher');
    console.log('Admin found:', !!admin, admin ? admin.id : '');
    console.log('Researcher found:', !!researcher, researcher ? researcher.id : '');
  }

} catch (e) {
  console.error('CRITICAL: JSON Parse Failed:', e.message);
  // Print first 100 chars
  const raw = fs.readFileSync(dbPath, 'utf8');
  console.log('Start of file:', raw.substring(0, 100));
  console.log('End of file:', raw.substring(raw.length - 100));
}
