const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

console.log("--- LOADING DOTENV ---");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log("--- DATABASE_URL is: ", process.env.DATABASE_URL, " ---");

const client = new MongoClient(process.env.DATABASE_URL);

client.connect().then(() => {
  console.log('🔌 Đã kết nối MongoDB an toàn qua Driver. Vô hiệu hóa Mongoose Validation để giữ nguyên dữ liệu.');
  const db = client.db();
  
  const DB_FILE = path.join(__dirname, '../database/db.json');
  console.log(`📂 Đang đọc dữ liệu từ: ${DB_FILE}`);
  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  const ops = [];
  for (const collectionName of Object.keys(dbData)) {
    const items = dbData[collectionName];
    if (items && items.length > 0) {
      console.log(`⏳ Đang import ${items.length} records cho: ${collectionName}...`);
      ops.push(db.collection(collectionName).deleteMany({}).then(() => {
        const safeItems = items.map(item => {
          const c = { ...item };
          delete c._id;
          if (collectionName === 'users') {
            if (!c.phone) c.phone = "0000000000";
            if (!c.password) c.password = "$2b$10$nEqz.0q2m8F0oDkI00pUfe7lJ45.i.2w3uS7B5rT3X7G1s.E/O4.q";
          }
          return c;
        });
        return db.collection(collectionName).insertMany(safeItems, { ordered: false })
          .then(res => { console.log(`✅ Hoàn tất import: ${collectionName} (${res.insertedCount} dòng)`); })
          .catch(e => { console.log(`❌ Lỗi chèn ${collectionName}:`, e.message) });
      }));
    }
  }

  Promise.all(ops).then(() => {
    console.log("🎉 Tất cả Collection đã được import thành công.");
    client.close();
    process.exit(0);
  }).catch(err => {
    console.error("❌ Lỗi toàn cục:", err);
    client.close();
    process.exit(1);
  });
}).catch(e => {
  console.log("❌ Lỗi Connect MongoDB:", e);
});
