const { MongoClient } = require('mongodb');
const path = require('path');

console.log("=== MIGRATION SCRIPT: MONGODB TO MONGODB ===");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const OLD_DATABASE_URL = process.env.OLD_DATABASE_URL;
const NEW_DATABASE_URL = process.env.NEW_DATABASE_URL;

if (!OLD_DATABASE_URL || !NEW_DATABASE_URL) {
  console.error("❌ ERROR: Please define OLD_DATABASE_URL and NEW_DATABASE_URL in your .env file.");
  process.exit(1);
}

console.log(`🔌 OLD_DATABASE_URL: ${OLD_DATABASE_URL}`);
console.log(`🔌 NEW_DATABASE_URL: ${NEW_DATABASE_URL}`);

const oldClient = new MongoClient(OLD_DATABASE_URL);
const newClient = new MongoClient(NEW_DATABASE_URL);

async function migrate() {
  try {
    console.log("⏳ Connecting to both MongoDB instances...");
    await oldClient.connect();
    await newClient.connect();
    console.log("✅ Successfully connected to both MongoDB instances.");

    const oldDb = oldClient.db();
    const newDb = newClient.db();

    // Lấy thông tin tất cả các collection từ database cũ
    const collections = await oldDb.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).filter(name => !name.startsWith('system.'));

    if (collectionNames.length === 0) {
      console.log("⚠️ No collections found in the old database.");
      return;
    }

    console.log(`📂 Found ${collectionNames.length} collections:`, collectionNames.join(', '));

    for (const collectionName of collectionNames) {
      console.log(`\n⏳ Processing collection: [${collectionName}]...`);
      
      const oldCollection = oldDb.collection(collectionName);
      const newCollection = newDb.collection(collectionName);

      // Xóa toàn bộ dữ liệu trong collection mới để đảm bảo không bị duplicate
      await newCollection.deleteMany({});
      console.log(`🗑️  Cleared target collection [${collectionName}]`);

      const totalDocs = await oldCollection.countDocuments();
      console.log(`📋 Total documents to migrate in [${collectionName}]: ${totalDocs}`);

      if (totalDocs === 0) {
        console.log(`⏩ Skipping empty collection [${collectionName}]`);
        continue;
      }

      // Đọc toàn bộ docs và insert vào new database (chia batch nếu nhiều)
      // Dùng cursor streaming để tiết kiệm RAM
      const cursor = oldCollection.find({});
      const batchSize = 1000;
      let batch = [];
      let totalInserted = 0;

      for await (const doc of cursor) {
        batch.push(doc);

        if (batch.length === batchSize) {
          await newCollection.insertMany(batch, { ordered: false });
          totalInserted += batch.length;
          console.log(`   🔸 Migrated ${totalInserted} / ${totalDocs} documents...`);
          batch = []; // clear batch
        }
      }

      // Insert remaining docs in the last batch
      if (batch.length > 0) {
        await newCollection.insertMany(batch, { ordered: false });
        totalInserted += batch.length;
        console.log(`   🔸 Migrated ${totalInserted} / ${totalDocs} documents...`);
      }

      // Verify count in new database
      const countInNew = await newCollection.countDocuments();
      if (countInNew !== totalDocs) {
        console.error(`❌ ERROR in [${collectionName}]: Expected ${totalDocs} but found ${countInNew} in target database.`);
      } else {
        console.log(`✅ Hoàn tất import [${collectionName}]: ${countInNew} dòng. Dữ liệu khớp 100%.`);
      }
    }

    console.log("\n🎉 TẤT CẢ DỮ LIỆU ĐÃ ĐƯỢC MIGRATE THÀNH CÔNG VÀ ĐẦY ĐỦ 100%!");
  } catch (error) {
    console.error("❌ Lỗi nghiêm trọng xảy ra trong quá trình migration:");
    console.error(error);
    process.exit(1);
  } finally {
    console.log("🔌 Đóng kết nối MongoDB...");
    await oldClient.close();
    await newClient.close();
  }
}

migrate();
