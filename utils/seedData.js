const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Source of Truth (The JSON snapshot)
const seedData = require('./seedData.json');

const DB_FILE = path.join(__dirname, '../database/db.json');

// ==================== SEEDING FUNCTIONS ====================

function seedJSON() {
  try {
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    // Deep clone to avoid mutating the required source
    const dataToWrite = JSON.parse(JSON.stringify(seedData));
    
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToWrite, null, 2), 'utf-8');
    console.log('✅ JSON Database seeded successfully from seedData.json!');
    return true;
  } catch (error) {
    console.error('❌ Error writing JSON db:', error);
    return false;
  }
}

async function seedMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️ MONGODB_URI not set, skipping Mongo seed.');
        return false;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Map seed keys to Mongoose Model names
    const mapping = {
      'users': 'User',
      'heritage_sites': 'HeritageSite',
      'artifacts': 'Artifact',
      'history_articles': 'HistoryArticle',
      'cultural_categories': 'CulturalCategory',
      'game_chapters': 'GameChapter',
      'game_levels': 'GameLevel',
      'game_characters': 'GameCharacter',
      'shop_items': 'ShopItem',
      'game_progress': 'GameProgress',
      'exhibitions': 'Exhibition',
      'favorites': 'Favorite',
      'reviews': 'Review'
    };

    for (const [key, modelName] of Object.entries(mapping)) {
      if (mongoose.models[modelName]) {
        await mongoose.models[modelName].deleteMany({});
        const items = seedData[key];
        if (items && items.length > 0) {
          await mongoose.models[modelName].insertMany(items);
          console.log(`🌱 Seeded ${items.length} items for ${modelName}`);
        }
      }
    }
    return true;
  } catch (err) {
    console.error('Mongo seed error:', err);
    return false;
  }
}

async function seedDatabase() {
  const dbType = process.env.DB_CONNECTION || 'json';
  console.log(`\n🚀 Seeding Database [${dbType.toUpperCase()}]...\n`);
  
  if (dbType === 'mongodb') {
    await seedMongoDB();
  } else {
    seedJSON();
  }
  
  console.log('\n✨ Seeding completed!');
}

// ==================== CLI EXECUTION ====================
if (require.main === module) {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedDatabase, seedData };