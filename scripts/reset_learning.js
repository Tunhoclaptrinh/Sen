const db = require('../config/database');

/**
 * Script to reset LEARNING PATH progress for ALL users.
 * USAGE: node scripts/reset_learning.js
 */
async function resetLearningData() {
  console.log('🔄 STARTING LEARNING DATA RESET...');
  console.log('-----------------------------------');

  try {
    // 1. Verify Database Connection
    if (!db.data) {
      console.error('❌ Error: Only JSON Adapter is currently supported for this script.');
      console.error('   (db.data is undefined)');
      process.exit(1);
    }
    
    // 2. Count impacted users
    let count = 0;
    
    // Switch to game_progress as per learning.service.js
    const targetTable = 'game_progress'; 
    if (db.data[targetTable]) {
        db.data[targetTable].forEach(progress => {
            if (progress.completed_modules && progress.completed_modules.length > 0) {
                count++;
                progress.completed_modules = [];
                // Reset badges related to learning if needed
                if (progress.badges) {
                   progress.badges = progress.badges.filter(b => b !== 'newbie' && b !== 'perfect_score');
                }
            }
        });
    } else {
        console.warn(`⚠️ Table '${targetTable}' not found in database.`);
    }

    console.log(`📊 Reset learning data for ${count} users.`);

    // 3. Save Changes
    if (typeof db.saveData === 'function') {
      const success = db.saveData();
      if (success) {
        console.log('-----------------------------------');
        console.log('✅ LEARNING PATH RESET SUCCESSFUL!');
      } else {
        console.error('❌ FAILED TO SAVE DATABASE. Check file permissions.');
      }
    } else {
      console.error('❌ Error: db.saveData is not a function.');
    }

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
}

resetLearningData();
