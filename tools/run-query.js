require('dotenv').config();
const db = require('../config/database');
const vm = require('vm');

/**
 * 🛠️ Tool chạy Query cho Database (Hỗ trợ cả SQL & MongoDB)
 * 
 * * Cách dùng:
 * 1. SQL (MySQL/Postgres):
 *    node tools/run-query.js "SELECT * FROM users LIMIT 5"
 * 
 * 2. MongoDB (Gọi method của MongoAdapter):
 *    node tools/run-query.js "db.findMany('users', { limit: 2 })"
 *    node tools/run-query.js "db.findOne('users', { email: 'admin@example.com' })"
 *    node tools/run-query.js "db.findAll('game_levels')"
 */

const run = async () => {
  const query = process.argv[2];
  const dbType = process.env.DB_CONNECTION || 'json';

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║             🚀 DATABASE QUERY RUNNER                   ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Database Type: ${dbType.toUpperCase()}`);
  
  if (!query) {
    if (dbType === 'mongodb') {
      console.log(`🔍 Default Query: db.findMany('users', { limit: 5 })`);
    } else {
      console.log(`🔍 Default Query: SELECT * FROM users LIMIT 5`);
    }
  } else {
    console.log(`🔍 Query: "${query}"`);
  }

  try {
    // 1. Wait for DB Connection
    if (!db.pool && !db.models && dbType !== 'json') {
        console.log('⏳ Waiting for database connection...');
        // Simple wait loop for async connections (like Mongo/MySQL pool)
        let attempts = 0;
        while (attempts < 5) {
            if ((dbType === 'mongodb' && db.models) || (dbType !== 'mongodb' && db.pool)) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
    }

    console.log('\n⚡ Executing...');
    conststart = Date.now();
    let result;

    // 2. Execute based on DB Type
    if (dbType === 'mongodb') {
        // === MONGODB EXECUTION ===
        const command = query || "db.findMany('users', { limit: 5 })";
        
        // Create a sandbox with the 'db' instance
        const sandbox = { 
            db: db, 
            console: console,
            result: null 
        };
        
        // Wrap command to capture result
        const script = new vm.Script(`
            (async () => {
                return await ${command};
            })()
        `);

        const context = vm.createContext(sandbox);
        result = await script.runInContext(context);

    } else if (dbType === 'mysql' || dbType === 'postgresql') {
        // === SQL EXECUTION ===
        const sql = query || 'SELECT * FROM users LIMIT 5';
        
        if (!db.pool) throw new Error('Not connected to SQL Database');

        if (dbType === 'mysql') {
            const [rows] = await db.pool.query(sql);
            result = rows;
        } else {
            const res = await db.pool.query(sql);
            result = res.rows;
        }
    } else {
        // === JSON/DEFAULT EXECUTION ===
         console.log('⚠️ JSON DB supports limited querying via this tool.');
         // Simple eval for JSON adapter methods
         const command = query || "db.findAll('users')";
         const sandbox = { db, console };
         result = vm.runInNewContext(command, sandbox);
    }

    const time = Date.now() - conststart;

    // 3. Display Results
    console.log(`✅ Success in ${time}ms`);
    
    if (Array.isArray(result)) {
        console.log(`📊 Rows returned: ${result.length}\n`);
        if (result.length > 0) {
            console.table(result.slice(0, 50)); // Limit display
            if (result.length > 50) console.log(`... and ${result.length - 50} more items`);
        } else {
            console.log('(No data returned)');
        }
    } else {
        console.log(`📊 Result:\n`);
        console.dir(result, { depth: null, colors: true });
    }

  } catch (error) {
    console.error('\n❌ Execution Error:', error.message);
  } finally {
    // 4. Cleanup
    if (db.pool) await db.pool.end();
    // For Mongo, we might need to close connection if the adapter exposes it, 
    // but usually process.exit(0) is fine for CLI tools.
    console.log('\n🔌 Connection closed.');
    process.exit(0);
  }
};

run();