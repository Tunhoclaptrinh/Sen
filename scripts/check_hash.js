const bcrypt = require('bcryptjs');
const db = require('../database/db.json');

const testPassword = '123456';

console.log('Testing password:', testPassword);
console.log('-------------------');

(async () => {
  for (const user of db.users) {
    if (!user.password) {
      console.log(`User ${user.email}: No password set`);
      continue;
    }

    try {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`User ${user.email} (ID: ${user.id}): Match=${isMatch}`);

      if (!isMatch) {
        // Try creating a new hash
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`  -> Valid hash for '123456' should be: ${newHash}`);
      }
    } catch (e) {
      console.log(`User ${user.email}: Error comparing - ${e.message}`);
    }
  }
})();
