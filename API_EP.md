# SEN API Documentation - Level System

## Admin CMS Endpoints

### 1. Level Management

#### GET `/api/admin/levels`

Lấy danh sách tất cả levels với filter, pagination

**Query Parameters:**

- `chapter_id` - Filter by chapter
- `difficulty` - easy/medium/hard
- `type` - hidden_object/timeline/quiz/etc
- `_page`, `_limit` - Pagination

**Response:**

```json
{
  "success": true,
  "count": 10,
  "data": [...],
  "pagination": {...}
}
```

#### POST `/api/admin/levels`

Tạo level mới

**Request Body:**

```json
{
  "name": "Ký ức chú Tễu",
  "chapter_id": 2,
  "type": "mixed",
  "difficulty": "medium",
  "ai_character_id": 1,
  "knowledge_base": "Múa rối nước...",
  "screens": [
    {
      "id": "screen_01",
      "type": "DIALOGUE",
      "content": [...]
    },
    {
      "id": "screen_02",
      "type": "HIDDEN_OBJECT",
      "items": [...]
    }
  ],
  "rewards": {
    "petals": 2,
    "coins": 100,
    "character": "teu_full_color"
  }
}
```

#### PUT `/api/admin/levels/:id`

Update level

#### DELETE `/api/admin/levels/:id`

Xóa level

---

### 2. Templates & Helpers

#### GET `/api/admin/levels/templates`

Lấy danh sách templates có sẵn

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "template_hidden_object",
      "name": "Hidden Object Game",
      "screens": [...]
    }
  ]
}
```

#### POST `/api/admin/levels/:id/clone`

Clone level để chỉnh sửa

**Request Body:**

```json
{
  "newName": "Ký ức chú Tễu (Copy)"
}
```

#### GET `/api/admin/levels/:id/preview`

Preview level với metadata (estimated time, difficulty score)

#### POST `/api/admin/levels/validate`

Validate cấu trúc screens trước khi tạo

**Request Body:**

```json
{
  "screens": [...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Validation passed",
  "data": {
    "processed": [...],
    "metadata": {
      "total_screens": 4,
      "screen_types": {
        "DIALOGUE": 2,
        "HIDDEN_OBJECT": 1,
        "QUIZ": 1
      },
      "estimated_time": 420
    }
  }
}
```

---

### 3. Bulk Operations

#### POST `/api/admin/levels/bulk/import`

Import nhiều levels từ JSON

**Request Body:**

```json
{
  "chapterId": 2,
  "levels": [...]
}
```

#### PUT `/api/admin/chapters/:chapterId/levels/reorder`

Sắp xếp lại thứ tự levels

**Request Body:**

```json
{
  "levelIds": [3, 1, 2, 4]
}
```

---

## Player Gameplay Endpoints

### 1. Level Session

#### POST `/api/game/levels/:id/start`

Bắt đầu chơi level

**Response:**

```json
{
  "success": true,
  "data": {
    "session_id": 123,
    "level": {
      "id": 2,
      "name": "Ký ức chú Tễu",
      "total_screens": 4
    },
    "current_screen": {
      "id": "screen_01",
      "type": "DIALOGUE",
      "index": 0,
      "is_first": true,
      "is_last": false,
      ...
    }
  }
}
```

#### POST `/api/game/sessions/:id/next-screen`

Chuyển sang màn hình tiếp theo

**Response:**

```json
{
  "success": true,
  "data": {
    "current_screen": {...},
    "progress": {
      "completed_screens": 1,
      "total_screens": 4,
      "percentage": 25
    }
  }
}
```

---

### 2. Screen Actions

#### POST `/api/game/sessions/:id/collect-item`

Thu thập item (Hidden Object screen)

**Request Body:**

```json
{
  "itemId": "item_fan"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {...},
    "points_earned": 15,
    "total_score": 45,
    "progress": {
      "collected": 1,
      "required": 3,
      "all_collected": false
    }
  }
}
```

#### POST `/api/game/sessions/:id/submit-answer`

Trả lời câu hỏi (Quiz screen)

**Request Body:**

```json
{
  "answerId": "Trên mặt nước (Thủy đình)"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "points_earned": 50,
    "total_score": 95
  }
}
```

---

### 3. AI Integration

#### POST `/api/ai/chat`

Chat với AI character

**Request Body:**

```json
{
  "message": "Cái quạt này dùng để làm gì?",
  "context": {
    "sessionId": 123,
    "levelId": 2,
    "screenId": "screen_02"
  }
}
```

#### POST `/api/ai/ask-hint`

Xin gợi ý từ AI (tốn coins)

**Request Body:**

```json
{
  "sessionId": 123,
  "itemId": "item_fan"
}
```

---

## Screen Types Reference

### DIALOGUE

```json
{
  "type": "DIALOGUE",
  "content": [
    {
      "speaker": "AI",
      "text": "Chào bạn!",
      "avatar": "url",
      "emotion": "happy"
    }
  ],
  "skip_allowed": true,
  "auto_advance": false
}
```

### HIDDEN_OBJECT

```json
{
  "type": "HIDDEN_OBJECT",
  "guide_text": "Tìm 3 vật phẩm",
  "items": [
    {
      "id": "item1",
      "name": "Cái quạt",
      "coordinates": {"x": 15, "y": 45, "width": 10, "height": 10},
      "fact_popup": "Mô tả",
      "points": 15,
      "hint": "Gợi ý"
    }
  ],
  "required_items": 3,
  "ai_hints_enabled": true
}
```

### QUIZ

```json
{
  "type": "QUIZ",
  "question": "Câu hỏi?",
  "options": [
    {"text": "Đáp án A", "is_correct": false},
    {"text": "Đáp án B", "is_correct": true}
  ],
  "time_limit": 60,
  "reward": {"points": 50, "coins": 20}
}
```

### TIMELINE

```json
{
  "type": "TIMELINE",
  "events": [
    {
      "id": "evt1",
      "year": 1802,
      "title": "Sự kiện",
      "description": "Mô tả"
    }
  ],
  "shuffle_on_start": true
}
```

### IMAGE_VIEWER

```json
{
  "type": "IMAGE_VIEWER",
  "image": "url",
  "caption": "Mô tả ảnh",
  "zoom_enabled": true
}
```

### VIDEO

```json
{
  "type": "VIDEO",
  "video": "url",
  "duration": 120,
  "skip_after": 30,
  "captions": "url"
}
```

---

## Error Codes

- `400` - Validation failed / Invalid request
- `401` - Not authenticated
- `403` - Not authorized / Level locked
- `404` - Level/Session not found
- `500` - Server error
