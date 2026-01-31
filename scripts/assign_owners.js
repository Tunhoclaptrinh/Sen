const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');

try {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // User Mapping
  const USERS = {
    ADMIN: { id: 1, name: "Admin Sen" },
    RESEARCHER: { id: 2, name: "Phạm Văn Tuấn" }
  };

  // Helper to randomize owner
  const getRandomOwner = () => Math.random() > 0.5 ? USERS.ADMIN : USERS.RESEARCHER;

  // Helper to randomize status (heavily weighted towards pending/published)
  const getRandomStatus = () => {
    const r = Math.random();
    if (r < 0.45) return 'published';
    if (r < 0.90) return 'pending';
    return 'draft'; // 10% chance
  };

  // 1. HERITAGE SITES
  if (data.heritage_sites) {
    data.heritage_sites.forEach((item, index) => {
      const owner = index % 2 === 0 ? USERS.ADMIN : USERS.RESEARCHER; // Alternate
      item.created_by = owner.id;
      item.author = owner.name;

      // Ensure status is valid
      if (!['published', 'pending', 'draft', 'rejected'].includes(item.status)) {
        item.status = getRandomStatus();
      }

      // Force specific items for clear testing
      if (item.name.includes("Hội An")) item.status = 'published';
      if (item.name.includes("Hoàng Thành")) item.status = 'published';
      if (item.name.includes("Chùa Một Cột")) { item.status = 'pending'; item.created_by = USERS.RESEARCHER.id; } // pending for researcher
      if (item.name.includes("Dinh Độc Lập")) { item.status = 'rejected'; item.created_by = USERS.RESEARCHER.id; }
      if (item.name.includes("Vịnh Hạ Long")) { item.status = 'draft'; item.created_by = USERS.RESEARCHER.id; }

      console.log(`Updated Heritage: ${item.name} -> Owner: ${owner.name}, Status: ${item.status}`);
    });
  }

  // 2. ARTIFACTS
  if (data.artifacts) {
    data.artifacts.forEach((item, index) => {
      const owner = getRandomOwner();
      item.created_by = owner.id;
      item.author = owner.name; // Some artifacts use 'author' for creator name display

      // Default valid status if missing
      if (!['published', 'pending', 'draft', 'rejected'].includes(item.status)) {
        item.status = getRandomStatus();
      }
    });
  }

  // 3. LEARNING MODULES
  if (data.learning_modules) {
    data.learning_modules.forEach((item, index) => {
      const owner = index % 3 === 0 ? USERS.ADMIN : USERS.RESEARCHER;
      item.created_by = owner.id;
      // Learning modules might not have 'author' field but rely on created_by relation

      if (!['published', 'pending', 'draft', 'rejected'].includes(item.status)) {
        item.status = getRandomStatus();
      }
    });
  }

  // 4. EXHIBITIONS (If any)
  if (data.exhibitions) {
    data.exhibitions.forEach(item => {
      if (!item.created_by) item.created_by = 1;
      if (!item.status) item.status = 'published';
    });
  }

  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Owners assigned and statuses updated!');

} catch (err) {
  console.error('❌ Error updating DB:', err);
}
