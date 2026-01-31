const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/db.json');
console.log('Resetting DB at:', dbPath);

// Hardcoded safe data to restore if file is broken
const safeData = {
  users: [
    {
      id: 1,
      name: "Admin Sen",
      email: "admin@sen.com",
      password: "$2a$10$ljLMJFWpt4uYURYEkQdvGeBijln.p8.XQjHSP/iKWCesuPVaLhg/m",
      role: "admin",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      name: "Phạm Văn Tuấn",
      email: "tuanpham@sen.com",
      password: "$2a$10$ljLMJFWpt4uYURYEkQdvGeBijln.p8.XQjHSP/iKWCesuPVaLhg/m",
      role: "researcher",
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      name: "Đỗ Thị Hương",
      email: "huong.do@sen.com",
      password: "$2a$10$ljLMJFWpt4uYURYEkQdvGeBijln.p8.XQjHSP/iKWCesuPVaLhg/m",
      role: "customer",
      isActive: true
    }
  ],
  heritage_sites: [
    {
      id: 1,
      name: "Phố Cổ Hội An",
      type: "historic_building",
      address: "Hội An, Quảng Nam",
      description: "Di sản văn hóa thế giới.",
      image: "https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2022/10/6/1101769/Hoi-An-22.jpeg",
      is_active: true,
      created_by: 1,
      author: "Admin Sen",
      status: "published",
      unesco_listed: true,
      region: "Trung"
    },
    {
      id: 2,
      name: "Hoàng Thành Thăng Long",
      type: "monument",
      address: "Hà Nội",
      description: "Di tích lịch sử quan trọng.",
      image: "/uploads/general/file-1769165335029.jpeg",
      is_active: true,
      created_by: 1,
      author: "Admin Sen",
      status: "published",
      unesco_listed: true,
      region: "Bắc"
    },
    {
      id: 3,
      name: "Chùa Một Cột",
      type: "temple",
      address: "Ba Đình, Hà Nội",
      description: "Biểu tượng văn hóa.",
      image: "https://ik.imagekit.io/tvlk/blog/2022/09/chua-mot-cot-1.jpg",
      is_active: true,
      created_by: 2,
      author: "Phạm Văn Tuấn",
      status: "pending",
      region: "Bắc"
    },
    {
      id: 4,
      name: "Dinh Độc Lập",
      type: "historic_building",
      address: "Quận 1, TP.HCM",
      description: "Di tích lịch sử thời chiến.",
      image: "https://photo-cms-tpo.zadn.vn/w890/Uploaded/2022/p_urauq/2018_04_30/dinh_doc_lap_1_ban_quyen_hinh_anh_thuoc_ve_tac_gia_shutterstock_com_yvgn.jpg",
      is_active: true,
      created_by: 2,
      author: "Phạm Văn Tuấn",
      status: "rejected",
      review_comment: "Vui lòng cập nhật hình ảnh chất lượng cao hơn.",
      region: "Nam"
    }
  ],
  cultural_categories: [],
  artifacts: [],
  timelines: [],
  exhibitions: [],
  collections: [],
  favorites: [],
  reviews: [],
  notifications: [],
  game_chapters: [],
  game_levels: [],
  learning_modules: [],
  scan_objects: []
};

// Write safe data
try {
  fs.writeFileSync(dbPath, JSON.stringify(safeData, null, 2), 'utf8');
  console.log('SUCCESS: DB reset with safe data.');
} catch (e) {
  console.error('ERROR Writing DB:', e.message);
}
