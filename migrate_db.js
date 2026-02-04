const fs = require('fs');
const path = 'g:/SEN/Backend/database/db.json';

try {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  console.log('Read successful, objects count:', Object.keys(data).length);

  const migrate = (items, name) => {
    if (!items) {
      console.log(name, 'not found');
      return;
    };
    let count = 0;
    items.forEach(item => {
      let modified = false;
      if (item.status === undefined) {
        item.status = 'published';
        count++;
        modified = true;
      }
      if (item.createdBy === undefined && item.created_by === undefined) {
        item.createdBy = 1;
        modified = true;
      }
      if (item.created_by !== undefined) {
        item.createdBy = item.created_by;
        delete item.created_by;
        modified = true;
      }
    });
    console.log('Migrated', count, 'items in', name);
  };

  migrate(data.exhibitions, 'exhibitions');
  migrate(data.history_articles, 'history_articles');
  migrate(data.learning_modules, 'learning_modules');
  migrate(data.game_chapters, 'game_chapters');

  fs.writeFileSync(path, JSON.stringify(data, null, 2));
  console.log('Migration complete');
} catch (e) {
  console.error('Error during migration:', e);
}
