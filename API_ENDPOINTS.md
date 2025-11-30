# 📡 SEN API Endpoints - Chi Tiết Toàn Bộ

**Base URL:** `http://localhost:3000/api`  
**API Version:** 1.0.0  
**Last Updated:** 2024-11-22

---

## 📋 Mục Lục

1. [Authentication](#authentication-apis)
2. [Heritage Sites](#heritage-sites-apis)
3. [Artifacts](#artifacts-apis)
4. [Collections](#collections-apis)
5. [Reviews & Ratings](#reviews-ratings-apis)
6. [Favorites](#favorites-apis)
7. [Exhibitions](#exhibitions-apis)
8. [Learning & Quests](#learning-quests-apis)
9. [User Management](#user-management-apis)
10. [Import/Export](#import-export-apis)

---

## 🔐 Authentication APIs

### 1. Register (Đăng Ký)

**Endpoint:** `POST /auth/register`

**Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Nguyễn Văn A",
  "email": "user@sen.com",
  "password": "SecurePassword123!",
  "phone": "0987654321",
  "address": "123 Đường ABC, Hà Nội"
}
```

**Response 201 - Success:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "user@sen.com",
      "phone": "0987654321",
      "role": "customer",
      "avatar": "https://ui-avatars.com/api/?name=Nguyen+Van+A",
      "isActive": true,
      "createdAt": "2024-11-22T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 400 - Validation Error:**

```json
{
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

**Validation Rules:**

- `name`: 2-100 characters, required
- `email`: Valid email, unique, required
- `password`: Min 6 chars, required
- `phone`: 10-11 digits, required

---

### 2. Login (Đăng Nhập)

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
  "email": "user@sen.com",
  "password": "SecurePassword123!"
}
```

**Response 200 - Success:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "user@sen.com",
      "phone": "0987654321",
      "role": "customer",
      "avatar": "https://ui-avatars.com/api/?name=Nguyen+Van+A",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response 401 - Invalid Credentials:**

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@sen.com",
    "password": "SecurePassword123!"
  }'
```

---

### 3. Get Current User (Lấy Thông Tin Hiện Tại)

**Endpoint:** `GET /auth/me`

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "user@sen.com",
    "phone": "0987654321",
    "role": "customer",
    "avatar": "https://...",
    "bio": "Yêu thích lịch sử Việt Nam",
    "isActive": true,
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

**cURL Example:**

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Change Password (Đổi Mật Khẩu)

**Endpoint:** `PUT /auth/change-password`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Response 400 - Wrong Current Password:**

```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

### 5. Logout (Đăng Xuất)

**Endpoint:** `POST /auth/logout`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🏛️ Heritage Sites APIs

### 1. Get All Heritage Sites (Danh Sách Di Sản)

**Endpoint:** `GET /heritage-sites`

**Query Parameters:**

```
?page=1&limit=10&sort=rating&order=desc&type=monument&region=Quảng%20Nam&unesco_listed=true&q=hội
```

**Parameters Detail:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Trang (1-based) |
| `limit` | number | 10 | Items/trang (max: 100) |
| `sort` | string | id | Field để sort |
| `order` | string | asc | asc hoặc desc |
| `type` | string | - | monument, temple, museum... |
| `region` | string | - | Quảng Nam, Hà Nội... |
| `unesco_listed` | boolean | - | true/false |
| `q` | string | - | Full-text search |

**Response 200:**

```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": 1,
      "name": "Phố Cổ Hội An",
      "type": "historic_building",
      "description": "Thị trấn ven sông lịch sử...",
      "region": "Quảng Nam",
      "latitude": 15.8801,
      "longitude": 108.3288,
      "address": "Thành phố Hội An, Quảng Nam, Việt Nam",
      "year_established": 1624,
      "image": "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600",
      "rating": 4.9,
      "total_reviews": 523,
      "visit_hours": "08:00 - 17:00",
      "entrance_fee": 120000,
      "is_accessible": true,
      "curator": "ThS. Trần Văn An",
      "institution": "Bộ Văn Hóa, Thể Thao và Du Lịch",
      "unesco_listed": true,
      "significance": "international",
      "heritage_status": "active",
      "is_active": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**cURL Example:**

```bash
curl "http://localhost:3000/api/heritage-sites?page=1&limit=5&sort=rating&order=desc&type=monument" \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Get Heritage Site Details (Chi Tiết Di Sản)

**Endpoint:** `GET /heritage-sites/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Phố Cổ Hội An",
    "type": "historic_building",
    "description": "Phố cổ Hội An là một thị trấn ven sông lịch sử...",
    "cultural_period": "Triều Nguyễn - Pháp thuộc",
    "region": "Quảng Nam",
    "latitude": 15.8801,
    "longitude": 108.3288,
    "address": "Thành phố Hội An, Quảng Nam, Việt Nam",
    "year_established": 1624,
    "year_restored": 1999,
    "image": "https://...",
    "gallery": [
      "https://images.unsplash.com/photo-1578107982254-eb158fc3a0e7?w=600",
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600"
    ],
    "rating": 4.9,
    "total_reviews": 523,
    "visit_hours": "08:00 - 17:00",
    "entrance_fee": 120000,
    "is_accessible": true,
    "accessibility_info": "Có đường dành cho xe lăn",
    "curator": "ThS. Trần Văn An",
    "institution": "Bộ Văn Hóa, Thể Thao và Du Lịch",
    "unesco_listed": true,
    "significance": "international",
    "heritage_status": "active",
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-10-26T12:00:00Z"
  }
}
```

---

### 3. Search Heritage Sites (Tìm Kiếm)

**Endpoint:** `GET /heritage-sites/search?q=hội+an`

**Response 200:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "Phố Cổ Hội An",
      "description": "Thị trấn ven sông lịch sử..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 4. Find Nearby Heritage Sites (Tìm Quanh Đây)

**Endpoint:** `GET /heritage-sites/nearby?latitude=20.8268&longitude=106.2674&radius=10`

**Parameters:**

- `latitude` (required): Vĩ độ
- `longitude` (required): Kinh độ
- `radius` (optional): Bán kính km, default=5

**Response 200:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 2,
      "name": "Tháp Rùa - Hà Nội",
      "latitude": 20.8268,
      "longitude": 106.2674,
      "distance": 0.5,
      "rating": 4.7
    },
    {
      "id": 3,
      "name": "Khu Phố Cổ Hà Nội",
      "latitude": 20.83,
      "longitude": 106.265,
      "distance": 0.8,
      "rating": 4.5
    }
  ]
}
```

---

### 5. Get Heritage Site Artifacts (Hiện Vật Của Di Sản)

**Endpoint:** `GET /heritage-sites/:id/artifacts`

**Response 200:**

```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 1,
      "name": "Bức Tranh Sơn Dầu 'Phố Cổ Hội An'",
      "artifact_type": "painting",
      "year_created": 1985,
      "condition": "excellent",
      "image": "https://...",
      "rating": 4.8
    }
  ]
}
```

---

### 6. Get Heritage Site Timeline (Dòng Thời Gian)

**Endpoint:** `GET /heritage-sites/:id/timeline`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Thành lập Hội An",
      "year": 1624,
      "description": "Hội An được thành lập như một cảng thương mại...",
      "category": "founded",
      "image": "https://...",
      "impact": "Trở thành trung tâm thương mại"
    },
    {
      "id": 2,
      "title": "Tu bổ Phố cổ",
      "year": 1999,
      "description": "Bắt đầu công trình tu bổ toàn diện phố cổ",
      "category": "restored",
      "impact": "Bảo tồn di sản cho thế hệ tương lai"
    }
  ]
}
```

---

### 7. Create Heritage Site (Admin Only)

**Endpoint:** `POST /heritage-sites`

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Di Sản Mới",
  "type": "monument",
  "description": "Mô tả chi tiết...",
  "region": "Hà Nội",
  "latitude": 20.8268,
  "longitude": 106.2674,
  "address": "Địa chỉ cụ thể",
  "year_established": 1000,
  "image": "https://...",
  "is_active": true
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Heritage site created successfully",
  "data": {
    "id": 25,
    "name": "Di Sản Mới",
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

---

## 🏺 Artifacts APIs

### 1. Get All Artifacts (Danh Sách Hiện Vật)

**Endpoint:** `GET /artifacts?page=1&limit=10&artifact_type=painting&condition=excellent`

**Query Parameters:**

```
artifact_type: sculpture, painting, document, pottery, textile, tool, weapon, jewelry
condition: excellent, good, fair, poor
```

**Response 200:**

```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": 1,
      "name": "Bức Tranh Sơn Dầu 'Phố Cổ Hội An'",
      "description": "Tranh sơn dầu thế kỷ 20...",
      "heritage_site_id": 1,
      "category_id": 2,
      "artifact_type": "painting",
      "year_created": 1985,
      "creator": "Nguyễn Tường",
      "material": "Sơn dầu trên vải",
      "condition": "excellent",
      "image": "https://...",
      "rating": 4.8,
      "is_on_display": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 2. Search Artifacts (Tìm Kiếm Hiện Vật)

**Endpoint:** `GET /artifacts/search?q=tranh+sơn+dầu`

---

### 3. Get Artifact Details (Chi Tiết Hiện Vật)

**Endpoint:** `GET /artifacts/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Bức Tranh Sơn Dầu 'Phố Cổ Hội An'",
    "description": "Tranh sơn dầu thế kỷ 20 mô tả quang cảnh...",
    "heritage_site_id": 1,
    "category_id": 2,
    "artifact_type": "painting",
    "year_created": 1985,
    "year_discovered": 1990,
    "creator": "Nguyễn Tường",
    "material": "Sơn dầu trên vải",
    "dimensions": "100 x 80 cm",
    "weight": 5,
    "condition": "excellent",
    "damage_description": "Không có",
    "conservation_notes": "Được bảo quản trong phòng kiểm soát độ ẩm",
    "images": ["https://..."],
    "location_in_site": "Phòng tranh 1, Tầng 1",
    "storage_location": "Kho 3",
    "historical_context": "Được vẽ vào giai đoạn Việt Nam hiện đại",
    "cultural_significance": "Phản ánh vẻ đẹp kiến trúc Hội An",
    "story": "Tác phẩm này được tạo ra để lưu giữ hình ảnh...",
    "rating": 4.8,
    "total_reviews": 45,
    "is_on_display": true,
    "is_public": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Get Related Artifacts (Hiện Vật Liên Quan)

**Endpoint:** `GET /artifacts/:id/related`

**Response 200:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 2,
      "name": "Bộ Gốm Sứ Thương Tín",
      "artifact_type": "pottery",
      "rating": 4.6
    }
  ]
}
```

---

### 5. Create Artifact (Admin Only)

**Endpoint:** `POST /artifacts`

**Request Body:**

```json
{
  "name": "Hiện Vật Mới",
  "description": "Mô tả chi tiết...",
  "heritage_site_id": 1,
  "category_id": 2,
  "artifact_type": "painting",
  "year_created": 1980,
  "creator": "Tác Giả",
  "material": "Chất liệu",
  "condition": "good"
}
```

---

## 💾 Collections APIs

### 1. Get My Collections (Danh Sách Bộ Sưu Tập)

**Endpoint:** `GET /collections`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "name": "Những Di Sản Yêu Thích",
      "description": "Bộ sưu tập những di sản...",
      "artifact_ids": [1, 2, 5],
      "heritage_site_ids": [1, 2],
      "exhibition_ids": [1],
      "total_items": 8,
      "is_public": true,
      "is_shared": false,
      "createdAt": "2024-10-15T10:00:00Z",
      "updatedAt": "2024-10-20T14:30:00Z"
    }
  ]
}
```

---

### 2. Get Collection Details (Chi Tiết Bộ Sưu Tập)

**Endpoint:** `GET /collections/:id`

---

### 3. Create Collection (Tạo Bộ Sưu Tập)

**Endpoint:** `POST /collections`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Bộ Sưu Tập Mới",
  "description": "Mô tả bộ sưu tập",
  "is_public": true,
  "artifact_ids": [1, 2, 3]
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": {
    "id": 4,
    "user_id": 2,
    "name": "Bộ Sưu Tập Mới",
    "total_items": 3,
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

---

### 4. Update Collection (Cập Nhật Bộ Sưu Tập)

**Endpoint:** `PUT /collections/:id`

**Request Body:**

```json
{
  "name": "Bộ Sưu Tập Được Cập Nhật",
  "description": "Mô tả mới",
  "is_public": false
}
```

---

### 5. Add Artifact to Collection (Thêm Hiện Vật)

**Endpoint:** `POST /collections/:collectionId/artifacts/:artifactId`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Artifact added to collection",
  "data": {
    "id": 4,
    "total_items": 4
  }
}
```

---

### 6. Remove Artifact from Collection (Xóa Hiện Vật)

**Endpoint:** `DELETE /collections/:collectionId/artifacts/:artifactId`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Artifact removed from collection"
}
```

---

### 7. Delete Collection (Xóa Bộ Sưu Tập)

**Endpoint:** `DELETE /collections/:id`

**Headers:**

```
Authorization: Bearer {token}
```

---

## ⭐ Reviews & Ratings APIs

### 1. Get Reviews by Type (Danh Sách Đánh Giá)

**Endpoint:** `GET /reviews/type/:type?page=1&limit=10`

**Parameters:**

- `type`: heritage_site, artifact

**Response 200:**

```json
{
  "success": true,
  "count": 523,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "type": "heritage_site",
      "heritage_site_id": 1,
      "rating": 5,
      "comment": "Hội An thật tuyệt vời!",
      "user": {
        "id": 2,
        "name": "Nguyễn Văn A",
        "avatar": "https://..."
      },
      "createdAt": "2024-10-20T14:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 523
  }
}
```

---

### 2. Create Review (Tạo Đánh Giá)

**Endpoint:** `POST /reviews`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "heritage_site",
  "heritage_site_id": 1,
  "rating": 5,
  "comment": "Hội An thật tuyệt vời! Di sản văn hóa được bảo tồn rất tốt."
}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "id": 524,
    "user_id": 2,
    "type": "heritage_site",
    "heritage_site_id": 1,
    "rating": 5,
    "comment": "Hội An thật tuyệt vời!",
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

**Validation:**

- `rating`: 1-5, required
- `comment`: 5-1000 characters, required
- `type`: heritage_site hoặc artifact

---

### 3. Update Review (Cập Nhật Đánh Giá)

**Endpoint:** `PUT /reviews/:id`

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Cập nhật bình luận..."
}
```

---

### 4. Delete Review (Xóa Đánh Giá)

**Endpoint:** `DELETE /reviews/:id`

**Headers:**

```
Authorization: Bearer {token}
```

---

### 5. Get Reviews (Danh Sách Tất Cả)

**Endpoint:** `GET /reviews?page=1&limit=20`

---

### 6. Search Reviews (Tìm Kiếm)

**Endpoint:** `GET /reviews/search?q=kiến+trúc`

---

## ❤️ Favorites APIs

### 1. Get My Favorites (Danh Sách Yêu Thích)

**Endpoint:** `GET /favorites`

**Headers:**

```
Authorization: Bearer {token}
```

**Query Parameters:**

```
?page=1&limit=10&type=heritage_site
```

**Response 200:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "type": "heritage_site",
      "reference_id": 1,
      "item": {
        "id": 1,
        "name": "Phố Cổ Hội An",
        "image": "https://...",
        "rating": 4.9
      },
      "createdAt": "2024-10-15T10:00:00Z"
    }
  ]
}
```

---

### 2. Add to Favorites (Thêm Yêu Thích)

**Endpoint:** `POST /favorites/:type/:id`

**URL Examples:**

```
/favorites/heritage_site/1
/favorites/artifact/5
/favorites/exhibition/2
```

**Headers:**

```
Authorization: Bearer {token}
```

**Response 201:**

```json
{
  "success": true,
  "message": "Added to favorites",
  "data": {
    "id": 6,
    "type": "heritage_site",
    "reference_id": 1,
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

---

### 3. Toggle Favorite (Bật/Tắt Yêu Thích)

**Endpoint:** `POST /favorites/:type/:id/toggle`

**Response 200:**

```json
{
  "success": true,
  "message": "Favorite toggled",
  "data": {
    "isFavorited": true
  }
}
```

---

### 4. Check Favorite Status (Kiểm Tra)

**Endpoint:** `GET /favorites/:type/:id/check`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "isFavorited": true,
    "addedAt": "2024-10-15T10:00:00Z"
  }
}
```

---

### 5. Remove from Favorites (Xóa Yêu Thích)

**Endpoint:** `DELETE /favorites/:type/:id`

**Response 200:**

```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

---

## 🎭 Exhibitions APIs

### 1. Get All Exhibitions (Danh Sách Triển Lãm)

**Endpoint:** `GET /exhibitions?page=1&limit=10`

**Response 200:**

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "Hành Trình Hội An Qua 400 Năm",
      "description": "Triển lãm lịch sử toàn diện...",
      "heritage_site_id": 1,
      "theme": "Lịch sử & Văn Hóa Hội An",
      "curator": "ThS. Trần Văn An",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-12-31T23:59:59Z",
      "poster": "https://...",
      "visitor_count": 1500,
      "rating": 4.8,
      "is_active": true,
      "is_virtual": false
    }
  ]
}
```

---

### 2. Get Active Exhibitions (Triển Lãm Đang Diễn Ra)

**Endpoint:** `GET /exhibitions/active`

**Response 200:**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Hành Trình Hội An Qua 400 Năm",
      "is_active": true,
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-12-31T23:59:59Z"
    }
  ]
}
```

---

### 3. Get Exhibition Details (Chi Tiết Triển Lãm)

**Endpoint:** `GET /exhibitions/:id`

---

### 4. Create Exhibition (Admin Only)

**Endpoint:** `POST /exhibitions`

**Request Body:**

```json
{
  "name": "Triển Lãm Mới",
  "description": "Mô tả chi tiết...",
  "heritage_site_id": 1,
  "theme": "Chủ đề",
  "curator": "Người quản lý",
  "start_date": "2024-12-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "is_active": true
}
```

---

## 📚 Learning & Quests APIs

### 1. Get Learning Path (Lộ Trình Học Tập)

**Endpoint:** `GET /learning/path`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Giới Thiệu Lịch Sử Hội An",
      "difficulty": "beginner",
      "estimated_duration": 15,
      "content_type": "article",
      "is_completed": false,
      "score": null,
      "rating": 4.7
    },
    {
      "id": 2,
      "title": "Gốm Sứ Thương Tín",
      "difficulty": "intermediate",
      "estimated_duration": 20,
      "content_type": "video",
      "is_completed": true,
      "score": 85,
      "rating": 4.5
    }
  ],
  "progress": {
    "completed": 1,
    "total": 5,
    "percentage": 20
  }
}
```

---

### 2. Get Learning Module (Chi Tiết Module)

**Endpoint:** `GET /learning/:id`

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Giới Thiệu Lịch Sử Hội An",
    "description": "Tìm hiểu về lịch sử...",
    "difficulty": "beginner",
    "estimated_duration": 15,
    "content_type": "article",
    "body": "Nội dung bài học...",
    "artifacts": [1, 2],
    "heritage_sites": [1],
    "learning_objectives": ["Hiểu được lịch sử Hội An", "Nhận biết các công trình kiến trúc"],
    "key_concepts": ["Hội An", "Thương mại", "Kiến trúc"],
    "has_quiz": true,
    "passing_score": 70,
    "rating": 4.7,
    "total_reviews": 120
  }
}
```

---

### 3. Complete Learning Module (Hoàn Thành Module)

**Endpoint:** `POST /learning/:id/complete`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "score": 92
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Module completed",
  "data": {
    "module_title": "Giới Thiệu Lịch Sử Hội An",
    "score": 92,
    "points_earned": 50,
    "passed": true,
    "next_module_id": 2
  }
}
```

---

### 4. Get Available Quests (Nhiệm Vụ Khả Dụng)

**Endpoint:** `GET /quests/available`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Khám Phá Hội An",
      "description": "Khám phá phố cổ Hội An...",
      "quest_type": "discovery",
      "level": 1,
      "difficulty": "easy",
      "points": 100,
      "badges": ["Explorer", "History_Seeker"],
      "is_completed": false
    },
    {
      "id": 2,
      "title": "Sắp Xếp Dòng Thời Gian",
      "quest_type": "timeline_puzzle",
      "level": 2,
      "difficulty": "medium",
      "points": 150,
      "is_completed": false
    }
  ],
  "completed_count": 0,
  "available_count": 3
}
```

---

### 5. Complete Quest (Hoàn Thành Nhiệm Vụ)

**Endpoint:** `POST /quests/:id/complete`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "score": 100
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Quest completed successfully",
  "data": {
    "quest_title": "Khám Phá Hội An",
    "points_earned": 100,
    "badges_earned": ["Explorer"],
    "new_level": 2,
    "total_points": 380,
    "streak": 5
  }
}
```

---

### 6. Get Leaderboard (Bảng Xếp Hạng)

**Endpoint:** `GET /quests/leaderboard`

**Response 200:**

```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "user_name": "Phạm Văn Tuấn",
      "user_avatar": "https://...",
      "total_points": 5200,
      "level": 12,
      "badges_count": 8,
      "completed_quests": 45
    },
    {
      "rank": 2,
      "user_name": "Đỗ Thị Hương",
      "user_avatar": "https://...",
      "total_points": 4800,
      "level": 11,
      "badges_count": 7,
      "completed_quests": 42
    }
  ]
}
```

---

## 👥 User Management APIs

### 1. Get User Profile (Chi Tiết Hồ Sơ)

**Endpoint:** `GET /users/:id`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "user@sen.com",
    "phone": "0987654321",
    "role": "customer",
    "avatar": "https://...",
    "bio": "Yêu thích lịch sử Việt Nam",
    "isActive": true,
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

---

### 2. Update User Profile (Cập Nhật Hồ Sơ)

**Endpoint:** `PUT /users/profile`

**Headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Nguyễn Văn B",
  "phone": "0912345678",
  "bio": "Yêu thích lịch sử và tìm tòi",
  "avatar": "https://..."
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "Nguyễn Văn B",
    "phone": "0912345678",
    "bio": "Yêu thích lịch sử và tìm tòi"
  }
}
```

---

### 3. Get User Activity (Hoạt Động của User)

**Endpoint:** `GET /users/:id/activity`

**Headers:**

```
Authorization: Bearer {token}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "user@sen.com"
    },
    "stats": {
      "total_reviews": 12,
      "avg_rating": 4.5,
      "total_favorites": 25,
      "collections_count": 3,
      "learning_progress": "35%"
    },
    "recent_activities": [
      {
        "type": "review",
        "title": "Đánh giá Phố Cổ Hội An",
        "timestamp": "2024-11-20T10:00:00Z"
      },
      {
        "type": "collection",
        "title": "Tạo bộ sưu tập mới",
        "timestamp": "2024-11-19T14:30:00Z"
      }
    ]
  }
}
```

---

### 4. Get All Users (Admin Only)

**Endpoint:** `GET /users?page=1&limit=20&role=customer`

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Query Parameters:**

```
page: 1
limit: 20
role: customer, researcher, curator, admin
sort: name, email, createdAt
order: asc, desc
```

---

### 5. Toggle User Status (Admin Only)

**Endpoint:** `PATCH /users/:id/status`

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Request Body:**

```json
{
  "isActive": false
}
```

---

### 6. Get User Stats (Admin Only)

**Endpoint:** `GET /users/stats/summary`

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "total": 156,
    "active": 142,
    "inactive": 14,
    "byRole": {
      "customer": 120,
      "researcher": 25,
      "curator": 10,
      "admin": 1
    },
    "with_orders": 89,
    "recent_signups": 12
  }
}
```

---

## 📤 Import/Export APIs

### 1. Download Import Template (Tải Template)

**Endpoint:** `GET /:entity/template?format=xlsx`

**URL Examples:**

```
/heritage-sites/template?format=xlsx
/artifacts/template?format=csv
/users/template?format=xlsx
```

**Headers:**

```
Authorization: Bearer {token}
```

**Response:** File (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**cURL Example:**

```bash
curl "http://localhost:3000/api/artifacts/template?format=xlsx" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o artifacts_template.xlsx
```

---

### 2. Get Entity Schema (Lấy Schema)

**Endpoint:** `GET /:entity/schema`

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "entity": "artifacts",
    "schema": {
      "name": {
        "type": "string",
        "required": true,
        "minLength": 3,
        "maxLength": 150
      },
      "description": {
        "type": "string",
        "required": true,
        "minLength": 20,
        "maxLength": 3000
      },
      "heritage_site_id": {
        "type": "number",
        "required": true,
        "foreignKey": "heritage_sites"
      },
      "artifact_type": {
        "type": "enum",
        "enum": ["sculpture", "painting", "document", "pottery"],
        "required": true
      },
      "condition": {
        "type": "enum",
        "enum": ["excellent", "good", "fair", "poor"],
        "required": false,
        "default": "fair"
      }
    }
  }
}
```

---

### 3. Import Data from File (Import Dữ Liệu)

**Endpoint:** `POST /:entity/import`

**Headers:**

```
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data
```

**Form Data:**

```
file: (binary file - .xlsx, .xls, .csv)
options: (optional JSON string)
```

**Response 200 (or 207 for partial success):**

```json
{
  "success": true,
  "message": "Import completed: 50 succeeded, 2 failed",
  "data": {
    "summary": {
      "total": 52,
      "success": 50,
      "failed": 2
    },
    "inserted": [
      {
        "id": 45,
        "name": "Di Sản Mới",
        "type": "monument"
      }
    ],
    "errors": [
      {
        "row": 3,
        "data": {
          "name": "Invalid Data",
          "type": "monument"
        },
        "errors": ["heritage_site_id is required", "description length must be at least 20 characters"]
      },
      {
        "row": 15,
        "data": {
          "name": "Di Sản Duplicate"
        },
        "errors": ["name 'Di Sản Duplicate' already exists"]
      }
    ]
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/artifacts/import \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@artifacts.xlsx" \
  -F "options={\"skipEmpty\": true}"
```

---

### 4. Export Data to File (Export Dữ Liệu)

**Endpoint:** `GET /:entity/export?format=xlsx&includeRelations=true`

**Query Parameters:**

```
format: xlsx, csv (default: xlsx)
includeRelations: true, false (default: false)
page: 1
limit: 1000
sort: field
order: asc, desc
filter: custom filters
```

**Headers:**

```
Authorization: Bearer {admin_token}
```

**Response:** File

**cURL Example:**

```bash
curl "http://localhost:3000/api/artifacts/export?format=xlsx&includeRelations=true" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o artifacts_export.xlsx
```

---

### 5. Bulk Update (Cập Nhật Hàng Loạt)

**Endpoint:** `PATCH /:entity/bulk`

**Request Body:**

```json
{
  "ids": [1, 2, 3, 4, 5],
  "updates": {
    "is_active": true,
    "status": "approved"
  }
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "5 records updated successfully",
  "data": {
    "updated": 5,
    "failed": 0
  }
}
```

---

## 🔍 Query Parameters Reference

### Pagination

```
?page=1&limit=10
?_page=1&_limit=10    (alternative syntax)
```

### Sorting

```
?sort=name&order=asc
?sort=rating,createdAt&order=desc
?_sort=name&_order=asc    (alternative)
```

### Filtering

```
?type=monument&region=Hà%20Nội
?rating_gte=4&rating_lte=5
?name_like=hội
?is_active=true
?id_in=1,2,3,4
```

### Search

```
?q=kiến%20trúc
?_q=heritage      (alternative)
```

### Relationships

```
?_embed=artifacts,reviews
?_expand=category,author
```

### Combined

```
?page=1&limit=10&sort=rating&order=desc&q=hội&type=monument&rating_gte=4
```

---

## 📊 Response Status Codes

| Code    | Meaning       | Example                  |
| ------- | ------------- | ------------------------ |
| **200** | OK            | GET request successful   |
| **201** | Created       | POST request successful  |
| **204** | No Content    | DELETE successful        |
| **400** | Bad Request   | Validation error         |
| **401** | Unauthorized  | Missing/invalid token    |
| **403** | Forbidden     | Insufficient permissions |
| **404** | Not Found     | Resource doesn't exist   |
| **409** | Conflict      | Duplicate resource       |
| **422** | Unprocessable | Validation failed        |
| **500** | Server Error  | Internal error           |

---

## 🔐 Authentication Header Format

All protected endpoints require:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiYXQiOjE2MzI1NDM0MDB9...
```

**How to get token:**

1. Call `POST /auth/login` with email & password
2. Extract `data.token` from response
3. Include in `Authorization` header for protected endpoints

---

## 🐛 Error Response Format

**All errors follow this format:**

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "statusCode": 400
}
```

---

## ⚡ Rate Limiting

**Per hour limits by role:**

- **Guest:** 50 requests
- **Customer:** 100 requests
- **Researcher:** 500 requests
- **Admin:** 1000 requests

**Headers returned:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-11-22T12:00:00Z
```

---

**Last Updated:** November 22, 2024  
**API Version:** 1.0.0  
**Status:** Production Ready
