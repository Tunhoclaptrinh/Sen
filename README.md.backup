# 🏛️ SEN Backend - Game Giáo Dục Văn Hóa Việt Nam

**Phiên bản:** 2.0.0  
**Trạng thái:** Production Ready  
**Cập nhật:** December 2, 2024

---

## 🎯 Giới Thiệu

**SEN** là hệ thống backend cho game giáo dục tương tác, giúp người chơi khám phá lịch sử và văn hóa Việt Nam thông qua:

- 🎮 **Screen-based Gameplay**: Màn chơi đa dạng (Hidden Object, Quiz, Timeline, Dialogue)
- 🤖 **AI Chatbot**: Nhân vật NPC thông minh hướng dẫn người chơi
- 🌸 **Sen Flower System**: Thu thập cánh hoa sen để mở khóa nội dung mới
- 🏛️ **Digital Museum**: Xây dựng bảo tàng cá nhân với artifacts đã thu thập
- 📱 **QR Code Scan**: Tích hợp AR tại di tích thực tế
- 🎓 **Gamification**: Badges, achievements, leaderboard

---

## 🚀 Tính Năng Chính

### 1. Quản Lý Di Sản Văn Hóa

- 📍 Tìm kiếm di tích gần bạn (GPS-based)
- 🏺 Khám phá hiện vật lịch sử
- 📚 Timeline các sự kiện quan trọng
- 🎭 Triển lãm trực tuyến

### 2. Game System (Mới)

- **Chapters**: Lớp cánh hoa sen (3 layers)
- **Levels**: Màn chơi với nhiều screens tương tác
- **AI Characters**: NPCs với 2 trạng thái (Mất trí nhớ ↔ Hồi phục)
- **Rewards**: Cánh sen, coins, characters
- **Museum**: Bảo tàng sống kiếm thu nhập thụ động

### 3. AI Chatbot (Mới)

- Chat context-aware theo level đang chơi
- AI hóa thân nhân vật (Chú Tễu, Thị Kính...)
- Giải thích artifacts/heritage sites
- Cung cấp hints khi cần

### 4. Admin CMS (Mới)

- Tạo levels nhanh chóng với templates
- Preview và validate levels
- Clone và bulk import
- Quản lý characters, chapters, assets

---

## 🛠️ Công Nghệ

| Layer             | Technology                       |
| ----------------- | -------------------------------- |
| **Runtime**       | Node.js v18+                     |
| **Framework**     | Express.js 4.x                   |
| **Database**      | JSON File (Dev) / MongoDB (Prod) |
| **Auth**          | JWT (JSON Web Token)             |
| **Password**      | bcryptjs                         |
| **Validation**    | express-validator + Schema-based |
| **File Upload**   | multer, sharp                    |
| **Import/Export** | XLSX, CSV                        |

---

## 📦 Cài Đặt & Chạy

### Yêu Cầu

```bash
Node.js >= 18.0.0
npm >= 9.0.0
```

### Cài Đặt

```bash
# Clone repository
git clone https://github.com/yourname/sen-backend.git
cd sen-backend

# Install dependencies
npm install

# Setup environment
cp .env.develop .env

# Seed database
npm run seed

# Start development server
npm run dev
```

Server sẽ chạy tại: `http://localhost:3000`

### Test API

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@sen.com","password":"123456"}'
```

---

## 🎮 Game Flow

```
1. User Register/Login
   ↓
2. Unlock Chapter 1 (Lớp Cánh 1: Cội Nguồn)
   ↓
3. Complete Levels → Collect Sen Petals
   ↓
4. Unlock Chapter 2 (Lớp Cánh 2: Giao Thoa)
   ↓
5. Collect Characters → Build Museum
   ↓
6. Scan QR at Real Heritage Sites → Bonus Rewards
```

---

## 🎨 Level Structure

Mỗi level bao gồm nhiều **screens** xử lý tuần tự:

```javascript
{
  level_id: "lvl_bacbo_muaroi_01",
  name: "Ký ức chú Tễu",
  type: "mixed",
  ai_character_id: 1, // Chú Tễu

  screens: [
    {
      id: "screen_01",
      type: "DIALOGUE",
      content: [{ speaker: "AI", text: "Chào bạn!" }],
      next_screen_id: "screen_02"
    },
    {
      id: "screen_02",
      type: "HIDDEN_OBJECT",
      items: [
        { id: "item1", coordinates: {x: 15, y: 45}, points: 10 }
      ],
      required_items: 2
    },
    {
      id: "screen_03",
      type: "QUIZ",
      question: "Câu hỏi?",
      options: [
        { text: "Đáp án A", is_correct: true }
      ]
    }
  ],

  rewards: {
    petals: 2,
    coins: 100,
    character: "teu_full_color"
  }
}
```

**Screen Types:**

- `DIALOGUE`: Hội thoại với AI
- `HIDDEN_OBJECT`: Tìm đồ vật ẩn
- `QUIZ`: Câu hỏi trắc nghiệm
- `TIMELINE`: Sắp xếp sự kiện
- `IMAGE_VIEWER`: Xem hình ảnh
- `VIDEO`: Xem video

---

## 🤖 AI System

### AI Character States

Mỗi AI character có **2 trạng thái**:

```javascript
{
  // Trạng thái 1: Mất trí nhớ (Level chưa hoàn thành)
  avatar_locked: "teu_bw.png",
  persona_amnesia: "Hỡi ôi... Ta là ai? Đây là đâu?",

  // Trạng thái 2: Hồi phục (Level đã hoàn thành)
  avatar_unlocked: "teu_color.png",
  persona_restored: "Ta nhớ ra rồi! Ta là Chú Tễu!"
}
```

### AI Context-Aware

AI tự động thay đổi cách trả lời dựa trên:

- Level hiện tại
- Screen type (DIALOGUE, HIDDEN_OBJECT, QUIZ)
- Knowledge base của level
- Tiến độ hoàn thành của user

---

## 📚 Tài Liệu

| File                                          | Mô Tả                 |
| --------------------------------------------- | --------------------- |
| [API_ENDPOINTS.md](API_ENDPOINTS.md)          | Toàn bộ API endpoints |
| [ARCHITECTURE.md](ARCHITECTURE.md)            | Kiến trúc hệ thống    |
| [CONTRIBUTING.md](CONTRIBUTING.md)            | Hướng dẫn đóng góp    |
| [Sample Level Data](Sample%20Level%20Data.md) | Ví dụ tạo levels      |

---

## 🔐 Test Accounts

Database mặc định có sẵn các tài khoản test:

```
Admin:
  Email: admin@sen.com
  Password: 123456
  Role: admin

Researcher:
  Email: tuanpham@sen.com
  Password: 123456
  Role: researcher

Customer:
  Email: huong.do@sen.com
  Password: 123456
  Role: customer
```

---

## 🗂️ Cấu Trúc Thư Mục

```
sen-backend/
├── config/
│   ├── database.js          # Database CRUD
│   └── endpoints.js         # API reference
├── controllers/             # HTTP handlers
│   ├── auth.controller.js
│   ├── game.controller.js   # NEW: Game logic
│   ├── ai.controller.js     # NEW: AI chatbot
│   └── level_cms.controller.js  # NEW: Admin CMS
├── middleware/
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   └── query.middleware.js
├── routes/
│   ├── game.routes.js       # NEW
│   ├── ai.routes.js         # NEW
│   └── admin/
│       └── level.routes.js  # NEW
├── services/                # Business logic
│   ├── game_enhanced.service.js  # NEW
│   ├── ai.service.js        # NEW
│   └── level_cms.service.js # NEW
├── schemas/                 # Validation schemas
│   ├── game_level.schema.js # NEW
│   ├── game_character.schema.js # NEW
│   └── game_chapter.schema.js   # NEW
├── utils/
│   ├── BaseService.js       # Service base class
│   ├── BaseController.js
│   └── helpers.js
├── database/
│   └── db.json              # JSON database
├── server.js                # Entry point
└── package.json
```

---

## 🎯 Workflow Ví Dụ

### 1. User chơi Level "Ký ức chú Tễu"

```bash
# Bước 1: Start level
POST /api/game/levels/2/start
→ Nhận session_id + screen đầu tiên

# Bước 2: Chat với AI
POST /api/ai/chat
{
  "message": "Chú Tễu ơi, ta nên làm gì?",
  "context": { "levelId": 2 }
}
→ AI trả lời: "Hãy tìm cái quạt mo của ta!"

# Bước 3: Collect items
POST /api/game/levels/2/collect-clue
{ "clueId": "item_fan" }
→ Nhận điểm + progress

# Bước 4: Complete level
POST /api/game/levels/2/complete
{ "score": 85 }
→ Nhận rewards: petals + coins + character
```

### 2. Admin tạo Level mới

```bash
# Bước 1: Lấy template
GET /api/admin/levels/templates

# Bước 2: Clone level cũ
POST /api/admin/levels/1/clone
{ "newName": "Bản Sao Level 1" }

# Bước 3: Validate trước khi tạo
POST /api/admin/levels/validate
{ "screens": [...] }

# Bước 4: Tạo level
POST /api/admin/levels
{
  "chapter_id": 1,
  "name": "Level Mới",
  "screens": [...]
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Test specific file
npm test services/game.service.test.js

# Coverage
npm test -- --coverage
```

---

## 🚀 Deployment

### Docker

```bash
docker build -t sen-backend .
docker run -p 3000:3000 sen-backend
```

### PM2

```bash
pm2 start server.js --name sen-api
pm2 save
pm2 startup
```

---

## 🤝 Contributing

Đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết thêm chi tiết.

**Quick start:**

```bash
# Fork repo
git clone https://github.com/yourname/sen-backend.git

# Create branch
git checkout -b feature/amazing-feature

# Commit changes
git commit -m "feat: add amazing feature"

# Push
git push origin feature/amazing-feature

# Open Pull Request
```

---

## 📝 Changelog

### Version 2.0.0 (2024-12-02)

**New Features:**

- ✨ Screen-based gameplay system
- 🤖 AI chatbot with context awareness
- 🎮 Game progression with Sen Flowers
- 🏛️ Digital museum system
- 📱 QR code scanning
- 🎨 Admin CMS for level creation

**Improvements:**

- 🔧 Enhanced error handling
- 🔧 Better pagination
- 🔧 Schema-based validation

---

## 📞 Support

- 📧 Email: dev@sen.com
- 💬 GitHub Issues: [Issues](https://github.com/yourname/sen-backend/issues)
- 📚 Documentation: [Wiki](https://github.com/yourname/sen-backend/wiki)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Made with ❤️ for Vietnamese Cultural Heritage Preservation**

Last Updated: December 2, 2024
