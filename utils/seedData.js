const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DB_FILE = path.join(__dirname, '../database/db.json');

// Password hashed for "123456"
const hashedPassword = bcrypt.hashSync('123456', 10);

// ==================== SEED DATA FOR SEN ====================
// const seedData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

// const _legacy_seedData = {
const seedData = {
  // ========== 1. USERS & ROLES ==========
  "users": [
    {
      "id": 1,
      "name": "Admin Sen",
      "email": "admin@sen.com",
      "password": hashedPassword,
      "phone": "0912345678",
      "role": "admin",
      "bio": "Quản trị viên hệ thống SEN - Người bảo vệ thời gian.",
      "avatar": "https://ui-avatars.com/api/?name=Admin+Sen&background=4F46E5&color=fff",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "GS. Phạm Văn Tuấn",
      "email": "tuanpham@sen.com",
      "password": hashedPassword,
      "phone": "0987654321",
      "role": "researcher",
      "bio": "Nhà nghiên cứu văn hóa dân gian, chuyên gia về rối nước và di tích cổ.",
      "avatar": "https://ui-avatars.com/api/?name=Tuan+Pham&background=F59E0B&color=fff",
      "isActive": true,
      "createdAt": "2024-01-02T10:00:00Z"
    },
    {
      "id": 3,
      "name": "Đỗ Thị Hương",
      "email": "huong.do@sen.com",
      "password": hashedPassword,
      "phone": "0901234567",
      "role": "customer",
      "bio": "Sinh viên lịch sử, yêu thích khám phá di sản qua game.",
      "avatar": "https://ui-avatars.com/api/?name=Huong+Do&background=EF4444&color=fff",
      "isActive": true,
      "createdAt": "2024-01-05T14:30:00Z"
    },
    {
      "id": 4,
      "name": "Nguyễn Minh Anh",
      "email": "minhanh@sen.com",
      "password": hashedPassword,
      "phone": "0909998888",
      "role": "customer",
      "bio": "Học sinh THPT, thích sưu tầm thẻ bài nhân vật lịch sử.",
      "avatar": "https://ui-avatars.com/api/?name=Minh+Anh&background=10B981&color=fff",
      "isActive": true,
      "createdAt": "2024-01-10T09:15:00Z"
    }
  ],

  // ========== 2. CULTURAL CATEGORIES ==========
  "cultural_categories": [
    {
      "id": 1,
      "name": "Kiến trúc cổ",
      "icon": "🏯",
      "description": "Đình, đền, chùa, miếu và các công trình kiến trúc lịch sử."
    },
    {
      "id": 2,
      "name": "Mỹ thuật",
      "icon": "🎨",
      "description": "Tranh dân gian, điêu khắc đá, tượng gỗ cổ."
    },
    {
      "id": 3,
      "name": "Tư liệu lịch sử",
      "icon": "📚",
      "description": "Sách cổ, văn bia, sắc phong, bản thảo."
    },
    {
      "id": 4,
      "name": "Gốm sứ & Đồ đồng",
      "icon": "🏺",
      "description": "Gốm Bát Tràng, Chu Đậu, trống đồng Đông Sơn."
    },
    {
      "id": 5,
      "name": "Di sản phi vật thể",
      "icon": "🎭",
      "description": "Nhã nhạc, ca trù, quan họ, múa rối nước."
    },
    {
      "id": 6,
      "name": "Trang phục",
      "icon": "👘",
      "description": "Áo dài, áo tứ thân, trang phục cung đình."
    }
  ],

  // ========== 3. HERITAGE SITES ==========
  "heritage_sites": [
    {
      "id": 1,
      "name": "Hoàng Thành Thăng Long",
      "short_description": "Di sản văn hóa thế giới, trung tâm quyền lực suốt 13 thế kỷ.",
      "description": "Hoàng thành Thăng Long là quần thể di tích gắn với lịch sử kinh thành Thăng Long - Hà Nội. Công trình được các triều vua xây dựng trong nhiều giai đoạn lịch sử và trở thành di tích quan trọng bậc nhất trong hệ thống các di tích Việt Nam.",
      "type": "historic_building",
      "cultural_period": "Lý - Trần - Lê - Nguyễn",
      "region": "Bắc",
      "latitude": 21.0341,
      "longitude": 105.8372,
      "address": "19C Hoàng Diệu, Ba Đình, Hà Nội",
      "year_established": 1010,
      "image": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800",
      "gallery": [
        "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800",
        "https://images.unsplash.com/photo-1528127269322-539801943592?w=800"
      ],
      "rating": 4.8,
      "total_reviews": 1250,
      "visit_hours": "08:00 - 17:00",
      "entrance_fee": 30000,
      "is_active": true,
      "unesco_listed": true,
      "significance": "international",
      "related_artifact_ids": [1, 2],
      "related_history_ids": [1]
    },
    {
      "id": 2,
      "name": "Phố Cổ Hội An",
      "short_description": "Đô thị cổ được bảo tồn gần như nguyên vẹn.",
      "description": "Hội An là một đô thị cổ nằm ở hạ lưu sông Thu Bồn, thuộc vùng đồng bằng ven biển tỉnh Quảng Nam, cách thành phố Đà Nẵng khoảng 30km về phía Nam. Phố cổ Hội An lưu giữ một nền văn hóa phi vật thể đa dạng và phong phú.",
      "type": "historic_building",
      "cultural_period": "Thế kỷ 17-19",
      "region": "Trung",
      "latitude": 15.8801,
      "longitude": 108.3380,
      "address": "Phường Minh An, Hội An, Quảng Nam",
      "year_established": 1600,
      "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800",
      "rating": 4.9,
      "total_reviews": 3200,
      "visit_hours": "07:00 - 22:00",
      "entrance_fee": 120000,
      "is_active": true,
      "unesco_listed": true,
      "significance": "international",
      "related_artifact_ids": [3],
      "related_history_ids": []
    },
    {
      "id": 3,
      "name": "Nhà Hát Lớn Hà Nội",
      "short_description": "Công trình kiến trúc Pháp độc đáo giữa lòng thủ đô.",
      "description": "Nhà hát Lớn Hà Nội là một công trình kiến trúc phục vụ biểu diễn nghệ thuật tọa lạc trên quảng trường Cách Mạng Tháng Tám. Công trình được người Pháp khởi công xây dựng năm 1901 và hoàn thành năm 1911.",
      "type": "monument",
      "cultural_period": "Pháp thuộc",
      "region": "Bắc",
      "latitude": 21.0255,
      "longitude": 105.8576,
      "address": "01 Tràng Tiền, Hoàn Kiếm, Hà Nội",
      "year_established": 1911,
      "image": "https://media.vneconomy.vn/w800/images/upload/2021/08/17/nha-hat-lon.jpg",
      "rating": 4.7,
      "visit_hours": "Chỉ mở khi có sự kiện",
      "entrance_fee": 0,
      "is_active": true,
      "unesco_listed": false,
      "significance": "national",
      "related_artifact_ids": [],
      "related_history_ids": []
    }
  ],

  // ========== 4. ARTIFACTS ==========
  "artifacts": [
    {
      "id": 1,
      "name": "Rồng đá Điện Kính Thiên",
      "short_description": "Đôi rồng đá nguyên khối tại thềm Điện Kính Thiên.",
      "description": "Đôi rồng đá chầu tại thềm Điện Kính Thiên được xây dựng năm 1467 dưới thời vua Lê Thánh Tông. Đây là kiệt tác điêu khắc đá thời Lê Sơ, tượng trưng cho quyền lực tối cao của nhà vua.",
      "heritage_site_id": 1,
      "category_id": 2,
      "artifact_type": "sculpture",
      "year_created": 1467,
      "material": "Đá xanh",
      "condition": "good",
      "is_on_display": true,
      "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg/1200px-R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg",
      "location_in_site": "Thềm Điện Kính Thiên",
      "dimensions": "Dài 5.3m"
    },
    {
      "id": 2,
      "name": "Ấn Vàng 'Sắc Mệnh Chi Bảo'",
      "short_description": "Ấn vàng biểu thị quyền lực của triều Nguyễn.",
      "description": "Ấn vàng được dùng để ban sắc phong cho các quan lại và thần thánh. Đây là hiện vật quý giá thể hiện kỹ thuật đúc vàng tinh xảo của nghệ nhân Huế.",
      "heritage_site_id": 1,
      "category_id": 5,
      "artifact_type": "jewelry",
      "year_created": 1827,
      "year_discovered": 1945,
      "condition": "excellent",
      "is_on_display": true,
      "image": "https://cdn.tuoitre.vn/thumb_w/730/2022/11/17/an-vang-16686524310532104526274.jpg",
      "location_in_site": "Phòng trưng bày Cổ vật",
      "weight": 8.5
    },
    {
      "id": 3,
      "name": "Chùa Cầu (Lai Viễn Kiều)",
      "short_description": "Biểu tượng kiến trúc của Hội An.",
      "description": "Ngôi chùa nằm trên chiếc cầu bắc qua lạch nhỏ trong khu phố cổ Hội An. Chùa Cầu được các thương nhân Nhật Bản góp tiền xây dựng vào khoảng thế kỷ 17.",
      "heritage_site_id": 2,
      "category_id": 1,
      "artifact_type": "historic_building",
      "year_created": 1600,
      "condition": "fair",
      "is_on_display": true,
      "image": "https://upload.wikimedia.org/wikipedia/commons/2/26/Chua_Cau_Hoi_An.jpg",
      "location_in_site": "Trung tâm phố cổ"
    }
  ],

  // ========== 5. HISTORY ARTICLES ==========
  "history_articles": [
    {
      "id": 1,
      "title": "Hoàng Thành Thăng Long - Dấu ấn nghìn năm",
      "short_description": "Lịch sử thăng trầm của kinh đô Đại Việt.",
      "content": "Hoàng thành Thăng Long là quần thể di tích gắn với lịch sử kinh thành Thăng Long - Hà Nội...",
      "author": "GS. Phạm Văn Tuấn",
      "image": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800",
      "publishDate": "2024-01-15T08:00:00Z",
      "views": 150,
      "category_id": 1,
      "related_heritage_ids": [1],
      "is_active": true
    }
  ],

  // ========== 6. GAME SYSTEM (Sen Framework) ==========

  // 6.1 CHAPTERS
  "game_chapters": [
    {
      "id": 1,
      "name": "Sen Hồng - Cội Nguồn",
      "description": "Những câu chuyện khởi nguồn của văn hóa Bắc Bộ.",
      "layer_index": 1,
      "petal_state": "blooming",
      "required_petals": 0,
      "is_active": true,
      "theme": "Văn Hóa Bắc Bộ",
      "order": 1,
      "color": "#D35400",
      "image": "https://images.unsplash.com/photo-1599525281489-0824b223c285?w=600",
      "petal_image_closed": "https://example.com/c1_closed.png",
      "petal_image_bloom": "https://example.com/c1_bloom.png",
      "petal_image_full": "https://example.com/c1_full.png"
    },
    {
      "id": 2,
      "name": "Sen Vàng - Giao Thoa",
      "description": "Sự giao thoa văn hóa thế kỷ 18-19.",
      "layer_index": 2,
      "petal_state": "closed",
      "required_petals": 5,
      "is_active": true,
      "theme": "Giao Thoa Văn Hóa",
      "order": 2,
      "color": "#F1C40F",
      "image": "https://images.unsplash.com/photo-1555169062-013468b47731?w=600",
      "petal_image_closed": "https://example.com/c2_closed.png",
      "petal_image_bloom": "https://example.com/c2_bloom.png",
      "petal_image_full": "https://example.com/c2_full.png"
    },
    {
      "id": 3,
      "name": "Sen Trắng - Di Sản",
      "description": "Thời kỳ phồn vinh của các triều đại phong kiến.",
      "layer_index": 3,
      "petal_state": "locked",
      "required_petals": 10,
      "is_active": true,
      "theme": "Di Sản Phong Kiến",
      "order": 3,
      "color": "#ECF0F1",
      "image": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600",
      "petal_image_closed": "https://example.com/c3_closed.png",
      "petal_image_bloom": "https://example.com/c3_bloom.png",
      "petal_image_full": "https://example.com/c3_full.png"
    }
  ],

  // 6.2 CHARACTERS
  "game_characters": [
    {
      "id": 1,
      "name": "Chú Tễu",
      "description": "Nhân vật dẫn chuyện hóm hỉnh, am hiểu lịch sử nhưng hay quên.",
      "persona": "Bạn là Chú Tễu, người dẫn chuyện rối nước. Bạn vui tính, hay cười 'Ha ha!', thích kể chuyện lịch sử bằng giọng điệu dân dã.",
      "speaking_style": "Vui vẻ, dân dã, hay dùng từ cảm thán.",
      "avatar": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff",
      "avatar_locked": "https://ui-avatars.com/api/?name=Teu&background=333&color=888",
      "avatar_unlocked": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff",
      "persona_amnesia": "Ớ... ta là ai? Đây là đâu? Cái trống cơm của ta đâu rồi?",
      "persona_restored": "Ha ha! Ta nhớ ra rồi! Ta là Chú Tễu, hồn vía của múa rối nước đây mà!",
      "rarity": "rare",
      "origin": "Múa rối nước",
      "is_collectible": true
    },
    {
      "id": 2,
      "name": "Rồng Thời Lý",
      "description": "Linh vật rồng uốn lượn mềm mại, biểu tượng của sự thịnh vượng.",
      "persona": "Bạn là Rồng Thời Lý, uy nghiêm nhưng nhân từ. Bạn nói năng văn hoa, cổ kính.",
      "speaking_style": "Trang trọng, uy nghi.",
      "avatar": "https://ui-avatars.com/api/?name=Rong+Ly&background=10B981&color=fff",
      "avatar_locked": "https://ui-avatars.com/api/?name=Rong+Ly&background=333&color=888",
      "avatar_unlocked": "https://ui-avatars.com/api/?name=Rong+Ly&background=10B981&color=fff",
      "rarity": "legendary",
      "origin": "Hoàng Thành Thăng Long",
      "is_collectible": true
    }
  ],

  // 6.3 LEVELS
  "game_levels": [
    // --- Chapter 1 Levels ---
    {
      "id": 1,
      "chapter_id": 1,
      "name": "Chào hỏi Chú Tễu",
      "description": "Làm quen với người dẫn chuyện và khôi phục ký ức cho chú ấy.",
      "type": "dialogue",
      "order": 1,
      "difficulty": "easy",
      "passing_score": 50,
      "ai_character_id": 1,
      "knowledge_base": "Kiến thức về múa rối nước và Chú Tễu",
      "background_music": null,
      "image": "https://images.unsplash.com/photo-1555169062-013468b47731?w=400",
      "screens": [
        {
          "id": "screen_1_1",
          "index": 0,
          "type": "DIALOGUE",
          "is_first": true,
          "is_last": false,
          "background_image": "https://images.unsplash.com/photo-1555169062-013468b47731?w=800",
          "content": [
            { "speaker": "AI", "text": "Hắt xì! ... Có ai ở đó không?", "avatar": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff", "emotion": "confused" },
            { "speaker": "USER", "text": "Chào bạn, bạn là ai thế?" },
            { "speaker": "AI", "text": "Ta... ta hình như là một nhân vật quan trọng. Nhưng ta quên mất tên mình rồi!", "avatar": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff", "emotion": "sad" }
          ]
        },
        {
          "id": "screen_1_2",
          "index": 1,
          "type": "QUIZ",
          "is_first": false,
          "is_last": true,
          "question": "Nhân vật nào thường mở màn cho các vở múa rối nước?",
          "options": [
            { "text": "Chú Tễu", "is_correct": true },
            { "text": "Thạch Sanh", "is_correct": false },
            { "text": "Thánh Gióng", "is_correct": false }
          ],
          "points": 100
        }
      ],
      "rewards": {
        "coins": 50,
        "petals": 1
      }
    },
    {
      "id": 2,
      "chapter_id": 1,
      "name": "Bí Ẩn Rồng Đá",
      "description": "Tìm hiểu về đôi rồng đá tại Điện Kính Thiên.",
      "type": "hidden_object",
      "order": 2,
      "difficulty": "medium",
      "required_level": 1,
      "ai_character_id": 1,
      "knowledge_base": "Sân khấu thủy đình và các tích trò rối nước",
      "background_music": null,
      "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg/600px-R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg",
      "screens": [
        {
          "id": "screen_2_1",
          "index": 0,
          "type": "HIDDEN_OBJECT",
          "is_first": true,
          "is_last": false,
          "background_image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg/1200px-R%E1%BB%93ng_%C4%91%C3%A1_%C4%91i%E1%BB%87n_K%C3%ADnh_Thi%C3%AAn.jpg",
          "items": [
            { "id": "dragon_head", "name": "Đầu Rồng", "x": 30, "y": 40, "fact_popup": "Đầu rồng thời Lê to, mũi nở, miệng ngậm ngọc." },
            { "id": "dragon_scale", "name": "Vảy Rồng", "x": 50, "y": 60, "fact_popup": "Vảy rồng tua tủa như ngọn lửa." }
          ],
          "required_items": 2
        },
        {
          "id": "screen_2_2",
          "index": 1,
          "type": "DIALOGUE",
          "is_first": false,
          "is_last": true,
          "content": [
            { "speaker": "AI", "text": "Tuyệt vời! Đây chính là Rồng Đá thời Lê Sơ. Nhìn oai phong lẫm liệt quá!", "avatar": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff" }
          ]
        }
      ],
      "rewards": {
        "coins": 100,
        "petals": 2,
        "badge": "dragon_seeker"
      }
    },
    // --- Chapter 2 Levels ---
    {
      "id": 3,
      "chapter_id": 2,
      "name": "Thương Cảng Hội An",
      "description": "Khám phá sự nhộn nhịp của Hội An xưa.",
      "type": "mixed",
      "order": 1,
      "difficulty": "medium",
      "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400",
      "ai_character_id": 1,
      "knowledge_base": "Các sự kiện lịch sử Việt Nam qua các thời kỳ",
      "background_music": null,
      "screens": [
        {
          "id": "screen_3_1",
          "index": 0,
          "type": "DIALOGUE",
          "is_first": true,
          "is_last": true,
          "content": [
            { "speaker": "AI", "text": "Chào mừng đến Hội An! Bạn có ngửi thấy mùi trầm hương thơm ngát không?", "avatar": "https://ui-avatars.com/api/?name=Teu&background=D35400&color=fff" }
          ]
        }
      ],
      "rewards": {
        "coins": 150,
        "petals": 2
      }
    }
  ],

  // 6.4 SHOP ITEMS
  "shop_items": [
    {
      "id": 1,
      "name": "Gợi ý thần kỳ",
      "description": "Hiện vị trí 1 vật phẩm trong màn Hidden Object.",
      "type": "hint",
      "price": 50,
      "icon": "💡",
      "is_consumable": true
    },
    {
      "id": 2,
      "name": "Đồng hồ cát",
      "description": "Thêm 30 giây cho màn chơi.",
      "type": "boost",
      "price": 100,
      "icon": "⏳",
      "is_consumable": true
    },
    {
      "id": 3,
      "name": "Trang phục Tễu Hoàng Gia",
      "description": "Trang phục đặc biệt cho Chú Tễu.",
      "type": "character_skin",
      "price": 500,
      "icon": "👑",
      "is_consumable": false
    }
  ],

  // 6.5 GAME BADGES
  "game_badges": [
    {
      "id": 1,
      "name": "Nhà Khởi Nguyên",
      "description": "Hoàn thành Chapter 1.",
      "icon": "🌱",
      "category": "completion"
    },
    {
      "id": 2,
      "name": "Dragon Seeker",
      "description": "Tìm thấy mọi bí mật về Rồng.",
      "icon": "🐉",
      "category": "exploration"
    }
  ],

  // ========== 7. USER PROGRESS ==========
  "game_progress": [
    {
      "user_id": 3,
      "level": 2,
      "total_points": 250,
      "coins": 300,
      "total_sen_petals": 6,
      "unlocked_chapters": [1],
      "finished_chapters": [1],
      "completed_levels": [1, 2],
      "collected_characters": ["char_1"],
      "badges": ["badge_1"],
      "achievements": [],
      "museum_open": true,
      "museum_income": 50,
      "stats": {
        "completion_rate": 33,
        "chapters_unlocked": 1,
        "total_chapters": 3
      }
    }
  ],

  "game_sessions": [],
  "learning_modules": [],
  "game_quests": [],
  "user_inventory": [
    {
      "user_id": 3,
      "item_id": 1,
      "quantity": 3
    }
  ],
  "ai_chat_history": [],
  "scan_history": [],
  "notifications": []
};

// ==================== SEEDING FUNCTIONS ====================

function seedJSON() {
  try {
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData, null, 2), 'utf-8');
    console.log('✅ JSON Database seeded successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error writing JSON db:', error);
    return false;
  }
}

async function seedMongoDB() {
  try {
    console.log('Connecting to MongoDB...');
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
      'game_progress': 'GameProgress'
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
    require('dotenv').config();
    seedDatabase().then(() => process.exit(0)).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { seedDatabase, seedData };