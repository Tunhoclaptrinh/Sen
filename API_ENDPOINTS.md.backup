# 📡 SEN API Endpoints - Toàn Bộ Chi Tiết

**Base URL:** `http://localhost:3000/api`  
**API Version:** 2.0.0  
**Last Updated:** 2024-12-02

---

## 📋 Mục Lục

1. [Authentication](#1-authentication)
2. [Heritage Sites](#2-heritage-sites)
3. [Artifacts](#3-artifacts)
4. [Collections](#4-collections)
5. [Reviews & Ratings](#5-reviews--ratings)
6. [Favorites](#6-favorites)
7. [Exhibitions](#7-exhibitions)
8. [Learning Modules](#8-learning-modules)
9. [Game System](#9-game-system-new)
10. [AI Chatbot](#10-ai-chatbot-new)
11. [Admin CMS](#11-admin-cms-new)
12. [User Management](#12-user-management)

---

## 1. Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "user@sen.com",
  "password": "123456",
  "phone": "0987654321"
}

Response 201:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGci..."
  }
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@sen.com",
  "password": "123456"
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer {token}

{
  "currentPassword": "123456",
  "newPassword": "newpass"
}
```

---

## 2. Heritage Sites

### Get All Heritage Sites

```http
GET /api/heritage-sites?page=1&limit=10&sort=rating&order=desc

Query Parameters:
- page: number (default: 1)
- limit: number (default: 10, max: 100)
- sort: string (name, rating, year_established)
- order: asc | desc
- type: monument | temple | museum | historic_building
- region: string (Quảng Nam, Hà Nội...)
- unesco_listed: boolean
- q: string (full-text search)

Response 200:
{
  "success": true,
  "count": 15,
  "data": [ ... ],
  "pagination": { ... }
}
```

### Get Heritage Site Details

```http
GET /api/heritage-sites/:id
```

### Find Nearby Heritage Sites

```http
GET /api/heritage-sites/nearby?latitude=15.8801&longitude=108.3288&radius=5

Parameters:
- latitude: number (required)
- longitude: number (required)
- radius: number (km, default: 5)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Phố Cổ Hội An",
      "distance": 0.5,
      "rating": 4.9
    }
  ]
}
```

### Get Artifacts of Heritage Site

```http
GET /api/heritage-sites/:id/artifacts
```

### Get Timeline of Heritage Site

```http
GET /api/heritage-sites/:id/timeline
```

---

## 3. Artifacts

### Get All Artifacts

```http
GET /api/artifacts?artifact_type=painting&condition=excellent

Query Parameters:
- artifact_type: sculpture | painting | pottery | textile
- condition: excellent | good | fair | poor
```

### Search Artifacts

```http
GET /api/artifacts/search?q=tranh+sơn+dầu
```

### Get Related Artifacts

```http
GET /api/artifacts/:id/related
```

---

## 4. Collections

### Get My Collections

```http
GET /api/collections
Authorization: Bearer {token}
```

### Create Collection

```http
POST /api/collections
Authorization: Bearer {token}

{
  "name": "Bộ Sưu Tập Mới",
  "description": "Mô tả...",
  "is_public": true,
  "artifact_ids": [1, 2, 3]
}
```

### Add Artifact to Collection

```http
POST /api/collections/:collectionId/artifacts/:artifactId
Authorization: Bearer {token}
```

### Remove Artifact from Collection

```http
DELETE /api/collections/:collectionId/artifacts/:artifactId
Authorization: Bearer {token}
```

---

## 5. Reviews & Ratings

### Get Reviews by Type

```http
GET /api/reviews/type/heritage_site?page=1&limit=10
```

### Create Review

```http
POST /api/reviews
Authorization: Bearer {token}

{
  "type": "heritage_site",
  "heritage_site_id": 1,
  "rating": 5,
  "comment": "Tuyệt vời!"
}
```

---

## 6. Favorites

### Get Favorites

```http
GET /api/favorites
Authorization: Bearer {token}
```

### Add to Favorites

```http
POST /api/favorites/:type/:id
Authorization: Bearer {token}

URL Examples:
/api/favorites/heritage_site/1
/api/favorites/artifact/5
```

### Toggle Favorite

```http
POST /api/favorites/:type/:id/toggle
Authorization: Bearer {token}
```

### Check Favorite Status

```http
GET /api/favorites/:type/:id/check
Authorization: Bearer {token}
```

---

## 7. Exhibitions

### Get All Exhibitions

```http
GET /api/exhibitions
```

### Get Active Exhibitions

```http
GET /api/exhibitions/active
```

---

## 8. Learning Modules

### Get Learning Path

```http
GET /api/learning/path
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Giới Thiệu Lịch Sử Hội An",
      "difficulty": "beginner",
      "is_completed": false
    }
  ],
  "progress": {
    "completed": 1,
    "total": 5,
    "percentage": 20
  }
}
```

### Complete Learning Module

```http
POST /api/learning/:id/complete
Authorization: Bearer {token}

{
  "score": 85
}

Response 200:
{
  "success": true,
  "data": {
    "points_earned": 50,
    "passed": true
  }
}
```

---

## 9. Game System (NEW)

### Get Game Progress

```http
GET /api/game/progress
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "current_chapter": 1,
    "total_sen_petals": 5,
    "total_points": 280,
    "level": 2,
    "coins": 1500,
    "collected_characters": ["teu_full_color"],
    "stats": {
      "completion_rate": 25,
      "chapters_unlocked": 1
    }
  }
}
```

### Get Chapters (Sen Flowers)

```http
GET /api/game/chapters
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Lớp Cánh 1: Cội Nguồn",
      "layer_index": 1,
      "is_unlocked": true,
      "total_levels": 5,
      "completed_levels": 2,
      "completion_rate": 40
    }
  ]
}
```

### Get Chapter Detail

```http
GET /api/game/chapters/:id
Authorization: Bearer {token}
```

### Unlock Chapter

```http
POST /api/game/chapters/:id/unlock
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "message": "Chapter unlocked",
  "data": {
    "chapter_id": 2,
    "chapter_name": "Lớp Cánh 2: Giao Thoa"
  }
}
```

### Get Levels in Chapter

```http
GET /api/game/levels/:chapterId
Authorization: Bearer {token}
```

### Get Level Detail

```http
GET /api/game/levels/:id/detail
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Ký ức chú Tễu",
    "type": "mixed",
    "difficulty": "medium",
    "screens": [
      {
        "id": "screen_01",
        "type": "DIALOGUE",
        "content": [ ... ]
      },
      {
        "id": "screen_02",
        "type": "HIDDEN_OBJECT",
        "items": [ ... ]
      }
    ],
    "rewards": {
      "petals": 2,
      "coins": 100,
      "character": "teu_full_color"
    }
  }
}
```

### Start Level

```http
POST /api/game/levels/:id/start
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "session_id": 123,
    "level": { ... },
    "current_screen": {
      "id": "screen_01",
      "type": "DIALOGUE",
      "index": 0,
      "is_first": true
    }
  }
}
```

### Collect Clue/Item

```http
POST /api/game/levels/:id/collect-clue
Authorization: Bearer {token}

{
  "clueId": "item_fan"
}

Response 200:
{
  "success": true,
  "data": {
    "item": {
      "id": "item_fan",
      "name": "Cái Quạt Mo",
      "points": 10
    },
    "progress": "1/3",
    "all_collected": false
  }
}
```

### Complete Level

```http
POST /api/game/levels/:id/complete
Authorization: Bearer {token}

{
  "score": 85,
  "timeSpent": 300
}

Response 200:
{
  "success": true,
  "data": {
    "passed": true,
    "score": 85,
    "rewards": {
      "petals": 2,
      "coins": 100,
      "character": "teu_full_color"
    }
  }
}
```

### Get Museum

```http
GET /api/game/museum
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": {
    "is_open": true,
    "income_per_hour": 25,
    "characters": ["teu_full_color", "thikinh"],
    "visitor_count": 20
  }
}
```

### Toggle Museum

```http
POST /api/game/museum/toggle
Authorization: Bearer {token}

{
  "isOpen": true
}
```

### Get Badges

```http
GET /api/game/badges
Authorization: Bearer {token}
```

### Get Achievements

```http
GET /api/game/achievements
Authorization: Bearer {token}
```

### Scan QR Code

```http
POST /api/game/scan
Authorization: Bearer {token}

{
  "code": "HOIAN001",
  "latitude": 15.8795,
  "longitude": 108.3274
}

Response 200:
{
  "success": true,
  "message": "Scan successful!",
  "data": {
    "artifact": { ... },
    "rewards": {
      "coins": 200,
      "petals": 2,
      "character": "guardian_hoian"
    }
  }
}
```

### Get Leaderboard

```http
GET /api/game/leaderboard?type=global&limit=20
Authorization: Bearer {token}

Response 200:
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "user_name": "Phạm Văn Tuấn",
      "total_points": 5200,
      "level": 12
    }
  ]
}
```

### Get Daily Reward

```http
GET /api/game/daily-reward
Authorization: Bearer {token}
```

### Purchase Shop Item

```http
POST /api/game/shop/purchase
Authorization: Bearer {token}

{
  "itemId": 1,
  "quantity": 5
}

Response 200:
{
  "success": true,
  "data": {
    "item": { ... },
    "total_cost": 50,
    "remaining_coins": 1450
  }
}
```

### Get Inventory

```http
GET /api/game/inventory
Authorization: Bearer {token}
```

### Use Item

```http
POST /api/game/inventory/use
Authorization: Bearer {token}

{
  "itemId": 1,
  "targetId": null
}
```

---

## 10. AI Chatbot (NEW)

### Chat with AI

```http
POST /api/ai/chat
Authorization: Bearer {token}

{
  "message": "Chú Tễu ơi, cái quạt này có ý nghĩa gì?",
  "context": {
    "levelId": 2,
    "characterId": 1,
    "screenType": "HIDDEN_OBJECT"
  }
}

Response 200:
{
  "success": true,
  "data": {
    "message": "Hề hề! Cái quạt mo này ta dùng để phe phẩy dẫn chuyện đấy!",
    "character": {
      "name": "Chú Tễu",
      "avatar": "...",
      "speaking_style": "Vui vẻ, dân dã"
    }
  }
}
```

### Get Chat History

```http
GET /api/ai/history?levelId=2&limit=20
Authorization: Bearer {token}
```

### Ask for Hint

```http
POST /api/ai/ask-hint
Authorization: Bearer {token}

{
  "levelId": 2,
  "clueId": "item_fan"
}

Response 200:
{
  "success": true,
  "data": {
    "hint": "Hãy tìm ở góc trái màn hình, gần con rối",
    "cost": 10,
    "remaining_coins": 1490
  }
}
```

### Explain Artifact/Heritage Site

```http
POST /api/ai/explain
Authorization: Bearer {token}

{
  "type": "artifact",
  "id": 1
}

Response 200:
{
  "success": true,
  "data": {
    "item": { ... },
    "explanation": "Bức tranh này thể hiện...",
    "character": { ... }
  }
}
```

### Generate Quiz

```http
POST /api/ai/quiz
Authorization: Bearer {token}

{
  "topicId": 1,
  "difficulty": "medium"
}
```

### Clear Chat History

```http
DELETE /api/ai/history
Authorization: Bearer {token}
```

---

## 11. Admin CMS (NEW)

### Manage Levels

#### Get All Levels

```http
GET /api/admin/levels?chapter_id=1
Authorization: Bearer {admin_token}
```

#### Get Level Templates

```http
GET /api/admin/levels/templates
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "template_hidden_object",
      "name": "Hidden Object Game",
      "screens": [ ... ]
    }
  ]
}
```

#### Create Level

```http
POST /api/admin/levels
Authorization: Bearer {admin_token}

{
  "chapter_id": 1,
  "name": "Màn Chơi Mới",
  "description": "Mô tả...",
  "type": "mixed",
  "difficulty": "medium",
  "screens": [
    {
      "id": "screen_01",
      "type": "DIALOGUE",
      "content": [ ... ]
    }
  ],
  "rewards": {
    "petals": 1,
    "coins": 50
  }
}

Response 201:
{
  "success": true,
  "data": { ... }
}
```

#### Update Level

```http
PUT /api/admin/levels/:id
Authorization: Bearer {admin_token}
```

#### Clone Level

```http
POST /api/admin/levels/:id/clone
Authorization: Bearer {admin_token}

{
  "newName": "Bản Sao Màn Chơi"
}
```

#### Preview Level

```http
GET /api/admin/levels/:id/preview
Authorization: Bearer {admin_token}

Response 200:
{
  "success": true,
  "data": {
    "metadata": {
      "total_screens": 5,
      "screen_types": {
        "DIALOGUE": 2,
        "HIDDEN_OBJECT": 1,
        "QUIZ": 2
      },
      "estimated_time": 420,
      "difficulty_score": 6
    }
  }
}
```

#### Validate Level

```http
POST /api/admin/levels/validate
Authorization: Bearer {admin_token}

{
  "screens": [ ... ]
}

Response 200:
{
  "success": true,
  "message": "Validation passed",
  "data": {
    "metadata": { ... }
  }
}
```

#### Bulk Import Levels

```http
POST /api/admin/levels/bulk/import
Authorization: Bearer {admin_token}

{
  "levels": [ ... ],
  "chapterId": 1
}
```

#### Reorder Levels

```http
PUT /api/admin/chapters/:chapterId/reorder
Authorization: Bearer {admin_token}

{
  "levelIds": [3, 1, 2, 4]
}
```

### Manage Chapters

```http
GET /api/admin/chapters
POST /api/admin/chapters
PUT /api/admin/chapters/:id
DELETE /api/admin/chapters/:id
```

### Manage Characters

```http
GET /api/admin/characters
POST /api/admin/characters
PUT /api/admin/characters/:id
DELETE /api/admin/characters/:id
```

### Manage Assets (Scan Objects)

```http
GET /api/admin/assets
POST /api/admin/assets
PUT /api/admin/assets/:id
DELETE /api/admin/assets/:id
```

---

## 12. User Management

### Get All Users (Admin)

```http
GET /api/users?page=1&limit=20&role=customer
Authorization: Bearer {admin_token}
```

### Get User Stats (Admin)

```http
GET /api/users/stats/summary
Authorization: Bearer {admin_token}
```

### Toggle User Status (Admin)

```http
PATCH /api/users/:id/status
Authorization: Bearer {admin_token}

{
  "isActive": false
}
```

### Update Profile

```http
PUT /api/users/profile
Authorization: Bearer {token}

{
  "name": "Tên Mới",
  "phone": "0912345678",
  "bio": "Yêu thích lịch sử"
}
```

---

## 📊 Response Status Codes

| Code | Meaning      | Example                  |
| ---- | ------------ | ------------------------ |
| 200  | OK           | GET request successful   |
| 201  | Created      | POST request successful  |
| 400  | Bad Request  | Validation error         |
| 401  | Unauthorized | Missing/invalid token    |
| 403  | Forbidden    | Insufficient permissions |
| 404  | Not Found    | Resource doesn't exist   |
| 500  | Server Error | Internal error           |

---

## 🔐 Authentication

All protected endpoints require:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to get token:**

1. Call `POST /api/auth/login`
2. Extract `data.token`
3. Include in `Authorization` header

---

## 📝 Query Parameters Reference

### Pagination

```
?page=1&limit=10
```

### Sorting

```
?sort=name&order=asc
?sort=rating,createdAt&order=desc
```

### Filtering

```
?type=monument&region=Hà%20Nội
?rating_gte=4&rating_lte=5
```

### Search

```
?q=kiến%20trúc
```

---

## 🧪 Testing with cURL

### Login Example

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@sen.com","password":"123456"}'
```

### Get Progress Example

```bash
export TOKEN="your_token_here"
curl http://localhost:3000/api/game/progress \
  -H "Authorization: Bearer $TOKEN"
```

### Start Level Example

```bash
curl -X POST http://localhost:3000/api/game/levels/2/start \
  -H "Authorization: Bearer $TOKEN"
```

---

**API Version:** 2.0.0  
**Last Updated:** December 2, 2024  
**Status:** Production Ready
