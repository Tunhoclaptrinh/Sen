const fs = require('fs');
const path = 'g:/SEN/Backend/database/db.json';

try {
  const data = fs.readFileSync(path, 'utf8');
  const db = JSON.parse(data);

  console.log('--- RAW DB CHECK ---');
  const teu = db.game_characters.find(c => c.name === 'Chú Tễu');
  console.log('Chú Tễu in game_characters:', teu);

  // Check ALL user_characters
  console.log('All user_characters:', db.user_characters);

  // Check inventory for User 3
  const inv3 = db.user_inventory.find(i => i.userId === 3);
  console.log('User 3 Items:', inv3 ? inv3.items : 'Not found');

  // Check Learning Module 1
  const module1 = db.learning_modules.find(m => m.id === 1);
  console.log('Learning Module 1:', module1);

  // Check IDs with content_url
  const withSnakeCase = db.learning_modules.filter(m => m.content_url !== undefined);
  console.log('Modules with content_url:', withSnakeCase.map(m => m.id));

  // Check IDs with contentUrl
  const withCamelCase = db.learning_modules.filter(m => m.contentUrl !== undefined);
  console.log('Modules with contentUrl:', withCamelCase.map(m => m.id));

} catch (e) {
  console.error('Error:', e.message);
}
