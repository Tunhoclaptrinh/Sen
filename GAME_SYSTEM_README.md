# 🎮 SEN Game System - Backend Complete Guide

## 📋 Tổng quan

Backend đã được hoàn thiện với đầy đủ tính năng game theo ý tưởng:

- ✅ Sen Flowers (Chapter system)
- ✅ Level progression với nhiều loại gameplay
- ✅ AI Chatbot integration (OpenAI/Gemini)
- ✅ Museum system (Bảo tàng sống)
- ✅ Scan-to-play (QR codes tại di tích)
- ✅ Shop & Inventory
- ✅ Badges & Achievements
- ✅ Leaderboard & Daily rewards

---

## 🗂️ Cấu trúc Files Mới

```
backend/
├── controllers/
│   ├── game.controller.js       # Game mechanics controller
│   └── ai.controller.js          # AI chatbot controller
├── services/
│   ├── game.service.js           # Game business logic
│   └── ai.service.js             # AI integration logic
├── routes/
│   ├── game.routes.js            # Game API routes
│   └── ai.routes.js              # AI API routes
├── schemas/
│   ├── game_chapter.schema.js
│   ├── game_level.schema.js
│   ├── game_character.schema.js
│   ├── game_progress.schema.js
│   ├── scan_object.schema.js
│   └── shop_item.schema.js
└── database/
    └── db.json (cập nhật với game collections)
```

---

## 🚀 Setup & Installation

### 1. Cài đặt Dependencies

Không cần package mới! Tất cả đã có sẵn trong `package.json`

### 2. Cấu hình Environment Variables

Thêm vào `.env`:

```env
# AI Configuration
OPENAI_API_KEY=your_openai_key_here
# HOẶC
GEMINI_API_KEY=your_gemini_key_here

AI_MODEL=gpt-3.5-turbo
# HOẶC
AI_MODEL=gemini-pro
```

### 3. Cập nhật server.js

Thêm routes mới vào `server.js`:

```javascript
// Import routes
const gameRoutes = require("./routes/game.routes");
const aiRoutes = require("./routes/ai.routes");

// Mount routes
app.use("/api/game", gameRoutes);
app.use("/api/ai", aiRoutes);
```

### 4. Seed Game Data

Thêm game data vào `database/db.json`:

```javascript
{
  "users": [...],
  "heritage_sites": [...],

  // THÊM CÁC COLLECTIONS MỚI
  "game_chapters": [...],
  "game_characters": [...],
  "game_levels": [...],
  "game_progress": [],
  "game_sessions": [],
  "scan_objects": [...],
  "shop_items": [...],
  "user_inventory": [],
  "ai_chat_history": [],
  "scan_history": [],
  "game_badges": [...],
  "game_achievements": [...]
}
```

Copy data từ `game_seed_data.js` vào các collections tương ứng.

### 5. Khởi chạy

```bash
npm run dev
```

---

## 📡 API Endpoints

### Game Progress

```
GET    /api/game/progress              # Lấy tiến độ user
GET    /api/game/leaderboard           # Bảng xếp hạng
GET    /api/game/daily-reward          # Nhận thưởng hàng ngày
```

### Chapters (Sen Flowers)

```
GET    /api/game/chapters              # Danh sách chapters
GET    /api/game/chapters/:id          # Chi tiết chapter
POST   /api/game/chapters/:id/unlock   # Mở khóa chapter
```

### Levels (Màn chơi)

```
GET    /api/game/levels/:chapterId     # Levels trong chapter
GET    /api/game/levels/:id/detail     # Chi tiết level
POST   /api/game/levels/:id/start      # Bắt đầu chơi
POST   /api/game/levels/:id/collect-clue  # Thu thập manh mối
POST   /api/game/levels/:id/complete   # Hoàn thành level
```

### Museum (Bảo tàng)

```
GET    /api/game/museum                # Xem bảo tàng
POST   /api/game/museum/toggle         # Mở/đóng bảo tàng
```

### Shop & Inventory

```
POST   /api/game/shop/purchase         # Mua item
GET    /api/game/inventory             # Xem túi đồ
POST   /api/game/inventory/use         # Dùng item
```

### Scan to Play

```
POST   /api/game/scan                  # Scan QR code
```

### AI Chatbot

```
POST   /api/ai/chat                    # Chat với AI
GET    /api/ai/history                 # Lịch sử chat
POST   /api/ai/ask-hint                # Xin gợi ý
POST   /api/ai/explain                 # Giải thích artifact
POST   /api/ai/quiz                    # Tạo quiz
DELETE /api/ai/history                 # Xóa lịch sử
```

---

## 🎮 Game Flow

### Luồng chơi cơ bản

```
1. User đăng ký/đăng nhập
   └─> Tự động tạo game_progress

2. Xem danh sách Chapters (Sen flowers)
   └─> Chapter 1 mở sẵn
   └─> Chapter 2+ cần petals để mở

3. Vào Chapter → Chọn Level
   └─> Level 1 của mỗi chapter mở sẵn
   └─> Level tiếp theo cần hoàn thành level trước

4. Chơi Level
   ├─> Hidden Object: Tìm manh mối
   ├─> Timeline: Sắp xếp sự kiện
   ├─> Quiz: Trả lời câu hỏi
   ├─> Memory: Trò chơi trí nhớ
   └─> Puzzle: Ghép hình

5. Chat với AI trong level
   └─> AI hướng dẫn, giải thích
   └─> Có thể xin gợi ý (tốn coins)

6. Hoàn thành level
   └─> Nhận petals + coins + character

7. Thu thập characters → Bảo tàng
   └─> Mở bảo tàng → Kiếm thu nhập

8. Scan QR tại di tích thực
   └─> Bonus rewards
```

---

## 🤖 AI Integration

### Sử dụng OpenAI

```javascript
// .env
OPENAI_API_KEY = sk - xxx;
AI_MODEL = gpt - 3.5 - turbo;
```

### Sử dụng Gemini

```javascript
// .env
GEMINI_API_KEY = xxx;
AI_MODEL = gemini - pro;
```

### AI Context System

AI được cung cấp context từ:

- Character persona (Chú Tễu, Thị Kính...)
- Knowledge base từ level
- Heritage site information
- Artifact details

### Ví dụ Chat

```javascript
POST /api/ai/chat
{
  "message": "Cái cờ này dùng để làm gì hả Tễu?",
  "context": {
    "levelId": 2,
    "characterId": 1
  }
}

Response:
{
  "success": true,
  "data": {
    "message": "Hề hề, cái cờ hội đó để cắm quanh thủy đình cho thêm phần long trọng đấy bác ơi! Thiếu nó là thiếu hẳn không khí hội hè! 🎏",
    "character": {
      "name": "Chú Tễu",
      "avatar": "..."
    }
  }
}
```

---

## 🏛️ Museum System

### Cơ chế

- Thu thập characters từ levels
- Mỗi character = 1 vật phẩm trong bảo tàng
- Mở bảo tàng → Kiếm coins (passive income)
- Thu nhập = số characters × 5 coins/hour

### API Usage

```javascript
// Xem bảo tàng
GET /api/game/museum

// Mở bảo tàng
POST /api/game/museum/toggle
{ "isOpen": true }
```

---

## 📱 Scan to Play

### Setup

1. Tạo QR codes cho artifacts/heritage sites
2. Thêm vào `scan_objects` collection
3. User scan tại địa điểm thực

### Validation

- Kiểm tra GPS location (trong bán kính 500m)
- Mỗi code chỉ scan 1 lần
- Bonus rewards khi scan thành công

### API Usage

```javascript
POST /api/game/scan
{
  "code": "HOIAN001",
  "latitude": 15.8795,
  "longitude": 108.3274
}

Response:
{
  "success": true,
  "data": {
    "artifact": {...},
    "rewards": {
      "coins": 200,
      "petals": 2,
      "character": "guardian_hoian"
    }
  }
}
```

---

## 🏆 Gamification Features

### Progression System

- **Level**: Player level (tăng theo points)
- **Points**: Tổng điểm kiếm được
- **Sen Petals**: Cánh hoa sen (mở chapter)
- **Coins**: Tiền game (mua items)

### Rewards

```javascript
// Level completion
{
  "petals": 1-3,
  "coins": 50-200,
  "character": "character_id" (optional)
}

// Daily login
{
  "coins": 50,
  "petals": 1
}

// Scan object
{
  "coins": 100-300,
  "petals": 1-2,
  "character": "special_character" (optional)
}
```

### Badges & Achievements

- Tự động unlock khi đạt requirement
- Bonus coins khi unlock achievement
- Hiển thị trên profile

---

## 🔧 Customization

### Thêm Level mới

1. Tạo level config trong `game_levels`
2. Định nghĩa:
   - Type (hidden_object, timeline, quiz...)
   - Clues/Questions
   - AI character & knowledge base
   - Rewards
3. Restart server

### Thêm Character mới

1. Thêm vào `game_characters`
2. Định nghĩa persona & speaking style
3. Link với levels

### Thêm Shop Item

1. Thêm vào `shop_items`
2. Implement effect trong `game.service.js`

---

## 📊 Database Schema

### game_progress (User's game data)

```javascript
{
  "user_id": 1,
  "current_chapter": 2,
  "total_sen_petals": 8,
  "total_points": 450,
  "level": 3,
  "coins": 1200,
  "unlocked_chapters": [1, 2],
  "completed_levels": [1, 2, 3],
  "collected_characters": ["teu_full_color", "guardian_hoian"],
  "badges": [1, 2],
  "achievements": [1],
  "museum_open": true,
  "museum_income": 0,
  "streak_days": 5,
  "last_login": "2024-11-22T10:00:00Z"
}
```

---

## 🐛 Troubleshooting

### AI không hoạt động

```
Lỗi: "AI service temporarily unavailable"

Giải pháp:
1. Kiểm tra OPENAI_API_KEY hoặc GEMINI_API_KEY trong .env
2. Verify API key còn hạn
3. Xem fallback responses trong ai.service.js
```

### Scan không hoạt động

```
Lỗi: "You are too far from the location"

Giải pháp:
1. Kiểm tra GPS coordinates trong scan_objects
2. Radius mặc định = 500m, có thể tăng lên
3. Test với latitude/longitude = null để skip validation
```

### Level không unlock

```
Lỗi: "Level is locked"

Giải pháp:
1. Kiểm tra required_level trong game_levels
2. Verify user đã complete level trước chưa
3. Check completed_levels trong game_progress
```

---

## 📚 Next Steps

### Frontend Integration

1. **Game UI Components**

   - Sen flower visualization
   - Level selector
   - AI chat interface
   - Museum display

2. **Gameplay Mechanics**

   - Hidden object game
   - Timeline puzzle
   - Quiz interface
   - Memory game

3. **QR Scanner**
   - Camera integration
   - QR code detection
   - GPS validation

### Backend Enhancements

1. **Real-time Features**

   - WebSocket for live chat
   - Multiplayer quests
   - Live leaderboard

2. **Advanced AI**

   - Voice chat với AI
   - Image recognition (scan artifacts)
   - Personalized learning paths

3. **Analytics**
   - Gameplay metrics
   - User engagement tracking
   - A/B testing

---

## 🎯 Testing Endpoints

### Quick Test Flow

```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Player1","email":"player1@sen.com","password":"123456","phone":"0987654321"}'

# 2. Get Progress (auto-initialized)
curl http://localhost:3000/api/game/progress \
  -H "Authorization: Bearer $TOKEN"

# 3. Get Chapters
curl http://localhost:3000/api/game/chapters \
  -H "Authorization: Bearer $TOKEN"

# 4. Start Level
curl -X POST http://localhost:3000/api/game/levels/1/start \
  -H "Authorization: Bearer $TOKEN"

# 5. Chat with AI
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Xin chào Chú Tễu!","context":{"levelId":1}}'

# 6. Complete Level
curl -X POST http://localhost:3000/api/game/levels/1/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":90,"timeSpent":120}'
```

---

## 📞 Support

Nếu có vấn đề:

1. Check logs trong console
2. Verify database schema
3. Test API với Postman/Thunder Client
4. Review error messages

---

**Made with ❤️ for SEN - Kiến tạo trải nghiệm lịch sử, văn hoá bằng công nghệ**

Version: 1.0.0  
Last Updated: 2024-11-30
