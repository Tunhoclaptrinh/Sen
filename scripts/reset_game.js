const db = require('../config/database');

/**
 * Script to reset ALL game progress for ALL users.
 * USAGE: node scripts/reset_game.js
 */
async function resetGameData() {
  console.log('🔄 STARTING GAME DATA RESET...');
  console.log('-----------------------------------');

  try {
    // 1. Verify Database Connection
    if (!db.data) {
      console.error('❌ Error: Only JSON Adapter is currently supported for this script.');
      console.error('   (db.data is undefined)');
      process.exit(1);
    }

    // 2. Backup counts for logging
    const stats = {
      progress: db.data.game_progress?.length || 0,
      sessions: db.data.game_sessions?.length || 0,
      inventory: db.data.user_inventory?.length || 0,
      scans: db.data.scan_history?.length || 0,
      notifications: db.data.notifications?.length || 0
    };

    console.log(`📊 Found data to clear:`);
    console.log(`   - Player Progress: ${stats.progress}`);
    console.log(`   - Active Sessions: ${stats.sessions}`);
    console.log(`   - User Inventories: ${stats.inventory}`);
    console.log(`   - Scan Histories: ${stats.scans}`);

    // 3. Perform Reset
    // We strictly reset arrays to empty []
    db.data.game_progress = [];
    db.data.game_sessions = [];
    db.data.user_inventory = [];
    db.data.scan_history = [];
    
    // Optional: Clear game-related notifications only? 
    // For now, let's keep notifications as they might be system-wide.
    // If you want to clear them too, uncomment:
    // db.data.notifications = []; 

    // 4. Save Changes
    if (typeof db.saveData === 'function') {
      const success = db.saveData();
      if (success) {
        console.log('-----------------------------------');
        console.log('✅ RESET SUCCESSFUL!');
        console.log('All player states have been wiped clean.');
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

resetGameData();
