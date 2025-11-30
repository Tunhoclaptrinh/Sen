# 🏛️ SEN Backend - Tài Liệu Toàn Bộ

**Phiên bản:** 1.0.0  
**Trạng thái:** Development  
**Cập nhật lần cuối:** 2024

---

## 📋 Mục Lục

1. [Giới Thiệu Tổng Quan](#giới-thiệu-tổng-quan)
2. [Cài Đặt & Khởi Chạy](#cài-đặt--khởi-chạy)
3. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
4. [API Endpoints Chi Tiết](#api-endpoints-chi-tiết)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Quy Ước Phát Triển](#quy-ước-phát-triển)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Giới Thiệu Tổng Quan

### Mục Đích Dự Án

Sen là hệ thống quản lý và bảo tồn di sản văn hóa số, cung cấp nền tảng toàn diện cho:

- Khám phá và tra cứu di tích, hiện vật lịch sử
- Quản lý bộ sưu tập cá nhân
- Triển lãm trực tuyến
- Học tập thông qua gamification
- Cộng tác nghiên cứu

### Công Nghệ Stack

| Lớp                | Công Nghệ                                      |
| ------------------ | ---------------------------------------------- |
| **Runtime**        | Node.js v18+                                   |
| **Framework**      | Express.js 4.x                                 |
| **Database**       | JSON File (Development) / MongoDB (Production) |
| **Authentication** | JWT (JSON Web Token)                           |
| **Password**       | bcryptjs                                       |
| **Validation**     | express-validator                              |
| **File Upload**    | multer                                         |
| **Import/Export**  | XLSX, CSV, json2csv                            |

### Đặc Điểm Chính

✅ RESTful API đầy đủ  
✅ Role-based Access Control (RBAC)  
✅ Schema validation tự động  
✅ Import/Export dữ liệu  
✅ Tìm kiếm full-text và filtering nâng cao  
✅ Pagination tối ưu  
✅ Error handling toàn diện

---

## 🚀 Cài Đặt & Khởi Chạy

### Yêu Cầu Hệ Thống

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Git
```

### Cài Đặt Từng Bước

#### 1. Clone Repository

```bash
git clone https://github.com/yourname/sen-backend.git
cd sen-backend
```

#### 2. Cài Đặt Dependencies

```bash
npm install
```

#### 3. Cấu Hình Môi Trường

```bash
# Copy file mẫu
cp .env.develop .env

# Cấu hình file .env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRE=30d
```

#### 4. Khởi Chạy Server

**Development Mode** (với auto-reload):

```bash
npm run dev
```

**Production Mode**:

```bash
npm start
```

#### 5. Kiểm Tra Health

```bash
curl http://localhost:3000/api/health
```

Phản hồi:

```json
{
  "status": "OK",
  "message": "Sen API is running"
}
```

---

## 🏗️ Kiến Trúc Hệ Thống

### Cấu Trúc Thư Mục

```
sen-backend/
├── config/
│   ├── database.js           # Database configuration
│   └── endpoints.js          # API endpoints reference
├── controllers/              # Request handlers
│   ├── auth.controller.js
│   ├── heritage_site.controller.js
│   ├── artifact.controller.js
│   ├── collection.controller.js
│   ├── review.controller.js
│   ├── quest.controller.js
│   ├── learning.controller.js
│   ├── exhibition.controller.js
│   ├── user.controller.js
│   ├── importExport.controller.js
│   └── ...
├── middleware/
│   ├── auth.middleware.js      # JWT validation
│   ├── rbac.middleware.js      # Role-based access
│   ├── query.middleware.js     # Query parsing
│   ├── validation.middleware.js # Request validation
│   └── error.middleware.js
├── routes/
│   ├── auth.routes.js
│   ├── heritage_site.routes.js
│   ├── artifact.routes.js
│   ├── collection.routes.js
│   ├── ...
│   └── index.js
├── services/
│   ├── heritage_site.service.js
│   ├── artifact.service.js
│   ├── importExport.service.js
│   ├── payment.service.js
│   └── ...
├── schemas/
│   ├── user.schema.js
│   ├── artifact.schema.js
│   ├── heritage_site.schema.js
│   └── ...
├── utils/
│   ├── helpers.js              # Utility functions
│   ├── BaseService.js          # Base service class
│   ├── BaseController.js       # Base controller class
│   └── constants.js
├── database/
│   └── db.json                 # Development database
├── .env.develop                # Development environment
├── .env.example                # Environment template
├── server.js                   # Entry point
├── package.json
└── README.md
```

### Luồng Dữ Liệu (Data Flow)

```
Request
   ↓
Route Handler
   ↓
Middleware (Auth, Validation, RBAC)
   ↓
Controller (Business Logic)
   ↓
Service (Data Operations)
   ↓
Database
   ↓
Service (Transform Response)
   ↓
Controller (Format Response)
   ↓
Response
```

### Architecture Pattern

**MVC + Service Layer**

- **Model**: Schemas (`schemas/`)
- **View**: JSON responses
- **Controller**: Request handling (`controllers/`)
- **Service**: Business logic (`services/`)
- **Middleware**: Cross-cutting concerns

---

## 📡 API Endpoints Chi Tiết

### Base URL

```
http://localhost:3000/api
```

### 1. Authentication Endpoints

#### Register (Đăng Ký)

```
POST /auth/register
Content-Type: application/json

{
  "name": "Nguyễn Văn A",
  "email": "user@sen.com",
  "password": "SecurePassword123!",
  "phone": "0987654321"
}
```

**Response 201:**

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

#### Login (Đăng Nhập)

```
POST /auth/login
Content-Type: application/json

{
  "email": "user@sen.com",
  "password": "SecurePassword123!"
}
```

**Response 200:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "email": "user@sen.com",
      "role": "customer",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Get Current User (Lấy Thông Tin Hiện Tại)

```
GET /auth/me
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
    "role": "customer"
  }
}
```

### 2. Heritage Sites (Di Sản Văn Hóa)

#### Get All Heritage Sites

```
GET /heritage-sites?page=1&limit=10&sort=rating&order=desc&type=monument
```

**Query Parameters:**
| Tham Số | Kiểu | Mô Tả |
|---------|------|--------|
| `page` | number | Trang (default: 1) |
| `limit` | number | Số items/trang (max: 100) |
| `sort` | string | Sắp xếp theo field |
| `order` | string | asc hoặc desc |
| `type` | string | Filter theo loại |
| `region` | string | Filter theo vùng |
| `unesco_listed` | boolean | Chỉ UNESCO listed |
| `q` | string | Full-text search |

**Response 200:**

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "id": 1,
      "name": "Phố Cổ Hội An",
      "type": "historic_building",
      "description": "Thị trấn ven sông lịch sử...",
      "region": "Quảng Nam",
      "latitude": 15.8801,
      "longitude": 108.3288,
      "image": "https://...",
      "rating": 4.9,
      "total_reviews": 523,
      "unesco_listed": true,
      "significance": "international",
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

#### Get Heritage Site Details

```
GET /heritage-sites/:id
```

**Response 200:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Phố Cổ Hội An",
    "description": "...",
    "artifacts_count": 12,
    "reviews_count": 523,
    "timelines": [
      {
        "id": 1,
        "year": 1624,
        "title": "Thành lập Hội An",
        "description": "..."
      }
    ]
  }
}
```

#### Get Heritage Site Artifacts

```
GET /heritage-sites/:id/artifacts
```

#### Get Heritage Site Timeline

```
GET /heritage-sites/:id/timeline
```

#### Find Nearby Sites

```
GET /heritage-sites/nearby?latitude=20.8268&longitude=106.2674&radius=5
```

**Parameters:**

- `latitude` (required): Vĩ độ
- `longitude` (required): Kinh độ
- `radius` (optional): Bán kính km (default: 5)

### 3. Artifacts (Hiện Vật)

#### Get All Artifacts

```
GET /artifacts?page=1&limit=10&artifact_type=painting&condition=excellent
```

#### Search Artifacts

```
GET /artifacts/search?q=tranh+sơn+dầu
```

#### Get Artifact Details

```
GET /artifacts/:id
```

#### Get Related Artifacts

```
GET /artifacts/:id/related
```

### 4. Collections (Bộ Sưu Tập)

#### Get My Collections

```
GET /collections
Authorization: Bearer {token}
```

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "name": "Những Di Sản Yêu Thích",
      "description": "Bộ sưu tập...",
      "artifact_ids": [1, 2, 5],
      "total_items": 3,
      "is_public": true,
      "createdAt": "2024-10-15T10:00:00Z"
    }
  ]
}
```

#### Create Collection

```
POST /collections
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Bộ Sưu Tập Mới",
  "description": "Mô tả...",
  "is_public": true,
  "artifact_ids": [1, 2, 3]
}
```

#### Add Artifact to Collection

```
POST /collections/:collectionId/artifacts/:artifactId
Authorization: Bearer {token}
```

#### Remove Artifact from Collection

```
DELETE /collections/:collectionId/artifacts/:artifactId
Authorization: Bearer {token}
```

### 5. Reviews (Đánh Giá)

#### Get Reviews by Type

```
GET /reviews/type/heritage_site?page=1&limit=10
```

#### Create Review

```
POST /reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "heritage_site",
  "heritage_site_id": 1,
  "rating": 5,
  "comment": "Hội An thật tuyệt vời!"
}
```

#### Update Review

```
PUT /reviews/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated comment..."
}
```

### 6. Favorites (Yêu Thích)

#### Get Favorites

```
GET /favorites
Authorization: Bearer {token}
```

#### Add to Favorites

```
POST /favorites/heritage_site/:id
Authorization: Bearer {token}
```

#### Toggle Favorite

```
POST /favorites/heritage_site/:id/toggle
Authorization: Bearer {token}
```

#### Check Favorite Status

```
GET /favorites/heritage_site/:id/check
Authorization: Bearer {token}
```

### 7. Exhibitions (Triển Lãm)

#### Get All Exhibitions

```
GET /exhibitions?page=1&limit=10
```

#### Get Active Exhibitions

```
GET /exhibitions/active
```

#### Get Exhibition Details

```
GET /exhibitions/:id
```

### 8. Learning (Học Tập)

#### Get Learning Path

```
GET /learning/path
Authorization: Bearer {token}
```

#### Get Learning Module

```
GET /learning/:id
```

#### Complete Module

```
POST /learning/:id/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 85
}
```

### 9. Quests (Nhiệm Vụ)

#### Get Available Quests

```
GET /quests/available
Authorization: Bearer {token}
```

#### Get Leaderboard

```
GET /quests/leaderboard
```

#### Complete Quest

```
POST /quests/:id/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 100
}
```

### 10. Import/Export

#### Download Import Template

```
GET /artifacts/template?format=xlsx
Authorization: Bearer {token}
```

#### Import Data

```
POST /artifacts/import
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: [Excel/CSV file]
- options: {"skipEmpty": true}
```

**Response:**

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
    "inserted": [...],
    "errors": [
      {
        "row": 3,
        "data": {...},
        "errors": ["Field required"]
      }
    ]
  }
}
```

#### Export Data

```
GET /artifacts/export?format=xlsx&includeRelations=true
Authorization: Bearer {token}
```

---

## 🗄️ Database Schema

### Collections

#### users

```javascript
{
  id: number,
  name: string,
  email: string (unique),
  password: string (hashed),
  phone: string,
  avatar: string (URL),
  bio: string,
  role: enum['customer', 'researcher', 'curator', 'admin'],
  isActive: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601,
  lastLogin: ISO8601
}
```

#### heritage_sites

```javascript
{
  id: number,
  name: string (unique),
  type: enum['monument', 'temple', 'museum', ...],
  description: string,
  region: string,
  latitude: number,
  longitude: number,
  address: string,
  year_established: number,
  year_restored: number,
  image: string (URL),
  gallery: string[] (URLs),
  rating: number (0-5),
  total_reviews: number,
  visit_hours: string,
  entrance_fee: number,
  is_accessible: boolean,
  curator: string,
  institution: string,
  unesco_listed: boolean,
  significance: enum['local', 'national', 'international'],
  is_active: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

#### artifacts

```javascript
{
  id: number,
  name: string,
  description: string,
  heritage_site_id: number (FK),
  category_id: number (FK),
  artifact_type: enum['sculpture', 'painting', 'document', ...],
  year_created: number,
  year_discovered: number,
  creator: string,
  material: string,
  dimensions: string,
  weight: number,
  condition: enum['excellent', 'good', 'fair', 'poor'],
  damage_description: string,
  images: string[] (URLs),
  location_in_site: string,
  storage_location: string,
  historical_context: string,
  cultural_significance: string,
  story: string,
  rating: number,
  total_reviews: number,
  is_on_display: boolean,
  is_public: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

#### collections

```javascript
{
  id: number,
  user_id: number (FK),
  name: string,
  description: string,
  artifact_ids: number[],
  heritage_site_ids: number[],
  exhibition_ids: number[],
  total_items: number,
  is_public: boolean,
  is_shared: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

#### reviews

```javascript
{
  id: number,
  user_id: number (FK),
  type: enum['heritage_site', 'artifact'],
  heritage_site_id: number (FK),
  artifact_id: number (FK),
  rating: number (1-5),
  comment: string,
  is_verified: boolean,
  createdAt: ISO8601,
  updatedAt: ISO8601
}
```

#### favorites

```javascript
{
  id: number,
  user_id: number (FK),
  type: enum['heritage_site', 'artifact', 'exhibition'],
  reference_id: number,
  createdAt: ISO8601
}
```

#### exhibitions

```javascript
{
  id: number,
  name: string,
  description: string,
  heritage_site_id: number (FK),
  theme: string,
  curator: string,
  start_date: ISO8601,
  end_date: ISO8601,
  featured_artifacts: number[],
  featured_timelines: number[],
  poster: string (URL),
  visitor_count: number,
  rating: number,
  is_active: boolean,
  is_virtual: boolean,
  createdAt: ISO8601
}
```

#### timelines

```javascript
{
  id: number,
  title: string,
  description: string,
  year: number,
  heritage_site_id: number (FK),
  image: string (URL),
  category: enum['founded', 'damaged', 'restored', 'discovery', ...],
  impact: string,
  participants: string[],
  is_featured: boolean,
  createdAt: ISO8601
}
```

#### learning_modules

```javascript
{
  id: number,
  title: string,
  description: string,
  difficulty: enum['beginner', 'intermediate', 'advanced'],
  estimated_duration: number (minutes),
  content_type: enum['article', 'video', 'interactive'],
  order: number,
  body: string,
  content_url: string,
  artifacts: number[],
  heritage_sites: number[],
  learning_objectives: string[],
  key_concepts: string[],
  has_quiz: boolean,
  passing_score: number,
  rating: number,
  total_reviews: number,
  is_featured: boolean,
  createdAt: ISO8601
}
```

#### game_quests

```javascript
{
  id: number,
  title: string,
  description: string,
  quest_type: enum['discovery', 'timeline_puzzle', 'memory_game'],
  level: number,
  difficulty: enum['easy', 'medium', 'hard'],
  story_context: string,
  instructions: string,
  heritage_site_id: number (FK),
  artifact_ids: number[],
  order: number,
  points: number,
  badges: string[],
  game_config: object,
  questions: object[],
  completion_rate: number,
  average_time: number,
  is_active: boolean,
  createdAt: ISO8601
}
```

#### user_progress

```javascript
{
  id: number,
  user_id: number (FK),
  completed_modules: object[],
  completed_quests: object[],
  total_points: number,
  level: number,
  badges: string[],
  achievements: string[],
  streak: number,
  total_learning_time: number,
  bookmarked_artifacts: number[],
  bookmarked_sites: number[],
  createdAt: ISO8601
}
```

---

## 🔐 Authentication & Authorization

### JWT Implementation

#### Token Structure

```
Header: { alg: "HS256", typ: "JWT" }
Payload: { id: userId, iat: timestamp, exp: expirationTime }
Signature: HMACSHA256(base64(header) + base64(payload), JWT_SECRET)
```

#### Token Usage

Gửi token trong header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Expiration

```env
JWT_EXPIRE=30d        # Development
JWT_EXPIRE=7d         # Production
```

### Role-Based Access Control (RBAC)

#### Roles & Permissions

| Role           | Quyền                                    |
| -------------- | ---------------------------------------- |
| **admin**      | Toàn quyền quản lý hệ thống              |
| **customer**   | Xem, yêu thích, đánh giá, tạo collection |
| **researcher** | Truy cập dữ liệu chi tiết, xuất dữ liệu  |
| **curator**    | Quản lý triển lãm, chỉnh sửa di tích     |

#### Middleware Protection

```javascript
// Public route
router.get("/heritage-sites", getAllHeritageSites);

// Protected route (requires authentication)
router.post(
  "/collections",
  protect, // Check JWT
  createCollection
);

// Admin only
router.delete("/artifacts/:id", protect, authorize("admin"), deleteArtifact);

// Manager with ownership check
router.put("/orders/:id", protect, authorize("manager"), checkOwnership("order"), updateOrderStatus);
```

### Security Best Practices

**Password Hashing:**

```javascript
// Registration
const hashedPassword = await hashPassword(password);

// Login
const isMatch = await comparePassword(inputPassword, hashedPassword);
```

**Token Validation:**

- Token được validate ở mỗi request protected
- Expired token tự động reject
- Invalid signature return 401

**Rate Limiting:**

```javascript
// Per role limits (requests/hour)
customer: 100;
manager: 200;
admin: 1000;
```

---

## 📝 Quy Ước Phát Triển

### Naming Conventions

**Files & Folders:**

- Controllers: `camelCase` (e.g., `userController.js`)
- Routes: `kebab-case` (e.g., `user.routes.js`)
- Services: `camelCase` (e.g., `userService.js`)

**Variables & Functions:**

```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const API_TIMEOUT = 30000;

// Functions: camelCase with verb prefix
const getUserById = (id) => {};
const validateEmail = (email) => {};
const createNewUser = (data) => {};

// Booleans: is/has prefix
let isActive = true;
let hasPermission = false;
```

### Code Style

**Error Handling:**

```javascript
try {
  const result = await service.create(data);
  if (!result.success) {
    return res.status(result.statusCode || 400).json({
      success: false,
      message: result.message,
      errors: result.errors,
    });
  }
  res.status(201).json(result);
} catch (error) {
  console.error("Operation failed:", error);
  next(error);
}
```

**Async/Await Pattern:**

```javascript
// ✅ Good
const getUser = async (id) => {
  try {
    const user = await db.findById("users", id);
    if (!user) return {success: false, statusCode: 404};
    return {success: true, data: user};
  } catch (error) {
    throw error;
  }
};

// ❌ Avoid
const getUser = (id) => {
  return db.findById("users", id);
};
```

### Git Workflow

**Branch Naming:**

```
feature/add-export-functionality
bugfix/fix-authentication-issue
docs/update-api-docs
refactor/optimize-database-queries
```

**Commit Messages:**

```
feat(artifacts): add artifact search by category
fix(auth): resolve token expiration issue
docs(api): update authentication documentation
refactor(services): extract common logic to BaseService
perf(database): optimize heritage site queries with indexes
test(artifacts): add unit tests for artifact validation
```

### Testing Guidelines

**Unit Tests:**

```bash
npm test
```

**Test Structure:**

```javascript
describe("UserService", () => {
  describe("create", () => {
    it("should create user with valid data", async () => {
      const data = {name: "Test", email: "test@test.com"};
      const result = await userService.create(data);
      expect(result.success).toBe(true);
      expect(result.data.id).toBeDefined();
    });

    it("should reject duplicate email", async () => {
      // Test implementation
    });
  });
});
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Port Already in Use**

```bash
# Error: listen EADDRINUSE: address already in use :::3000
# Solution:
lsof -i :3000
kill -9 <PID>

# Or change port in .env
PORT=3001
```

**2. JWT Token Invalid**

```
Error: Token is invalid or expired

# Solution:
- Check JWT_SECRET matches
- Verify token format: "Bearer <token>"
- Ensure token not expired (check exp claim)
```

**3. Database Connection Failed**

```
Error: Cannot read property 'findById' of undefined

# Solution:
- Verify database file exists at database/db.json
- Check file permissions
- Restore from backup if corrupted
```

**4. Validation Errors**

```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ]
}

# Solution:
- Review schema validation rules
- Check required fields in request body
- Verify data types match schema
```

### Debug Mode

**Enable Detailed Logging:**

```javascript
// In server.js
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.query);
    next();
  });
}
```

**Check Database State:**

```bash
# View current database
cat database/db.json | jq

# Restore from backup
cp database/db.json.backup database/db.json
```

---

## 📚 Additional Resources

### API Documentation

- Base URL: `http://localhost:3000/api`
- Docs: `http://localhost:3000/api`
- Health: `http://localhost:3000/api/health`

### Environment Variables

**Development:**

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=funfood_secret_key_2024_change_this_in_production
JWT_EXPIRE=30d
```

**Production:**

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_strong_secret_key_32_chars_min
JWT_EXPIRE=7d
DATABASE_URL=mongodb://...
```

### Performance Tips

1. **Pagination:** Luôn sử dụng pagination cho danh sách lớn
2. **Indexing:** Tạo index cho các field search, sort
3. **Caching:** Cache kết quả queries thường xuyên
4. **Query Optimization:** Sử dụng `_expand` để tránh N+1 queries

### Monitoring & Logging

**Log Levels:**

```javascript
console.log("ℹ️ Info:", message);
console.warn("⚠️ Warning:", message);
console.error("❌ Error:", error);
```

**Response Times:**

- GET requests: < 100ms
- POST requests: < 200ms
- Export operations: < 2s
- Import operations: < 5s

---

## 🔄 Complete API Usage Examples

### Example 1: Full Workflow - Register & Browse Heritage Sites

#### Step 1: Đăng Ký Tài Khoản

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phạm Văn Tuấn",
    "email": "tuanpham@sen.com",
    "password": "SecurePass123!",
    "phone": "0987654321"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 5,
      "name": "Phạm Văn Tuấn",
      "email": "tuanpham@sen.com",
      "role": "customer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYXQiOjE2MzI1NDM0MDB9..."
  }
}
```

#### Step 2: Lấy Token và Dùng để Truy Cập

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Step 3: Duyệt Di Tích

```bash
curl "http://localhost:3000/api/heritage-sites?page=1&limit=5&sort=rating&order=desc" \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 4: Tìm Kiếm Di Tích Gần Đây

```bash
curl "http://localhost:3000/api/heritage-sites/nearby?latitude=20.8268&longitude=106.2674&radius=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### Step 5: Tạo Bộ Sưu Tập Cá Nhân

```bash
curl -X POST http://localhost:3000/api/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Những Di Sản Yêu Thích của Tôi",
    "description": "Bộ sưu tập các di tích tôi yêu thích nhất",
    "is_public": true,
    "artifact_ids": [1, 2, 3]
  }'
```

Response:

```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": {
    "id": 1,
    "user_id": 5,
    "name": "Những Di Sản Yêu Thích của Tôi",
    "total_items": 3,
    "createdAt": "2024-11-22T10:30:00Z"
  }
}
```

#### Step 6: Đánh Giá Di Tích

```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "heritage_site",
    "heritage_site_id": 1,
    "rating": 5,
    "comment": "Phố cổ Hội An thật tuyệt vời! Kiến trúc được bảo tồn rất tốt."
  }'
```

### Example 2: Admin Import Heritage Sites

#### Step 1: Download Template

```bash
curl "http://localhost:3000/api/heritage-sites/template?format=xlsx" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o template.xlsx
```

#### Step 2: Chuẩn Bị File Import

Mở file Excel và điền dữ liệu:

- name: "Tháp Hà Nội"
- type: "monument"
- region: "Hà Nội"
- latitude: 20.1234
- longitude: 106.5678
- ...

#### Step 3: Upload File

```bash
curl -X POST http://localhost:3000/api/heritage-sites/import \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@heritage_sites.xlsx" \
  -F "options={\"skipEmpty\": true}"
```

Response:

```json
{
  "success": true,
  "message": "Import completed: 15 succeeded, 0 failed",
  "data": {
    "summary": {
      "total": 15,
      "success": 15,
      "failed": 0
    },
    "inserted": [
      {
        "id": 50,
        "name": "Tháp Hà Nội",
        "type": "monument"
      }
    ],
    "errors": []
  }
}
```

### Example 3: Learning Path Completion

#### Step 1: Lấy Learning Path của User

```bash
curl "http://localhost:3000/api/learning/path" \
  -H "Authorization: Bearer $TOKEN"
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Giới Thiệu Lịch Sử Hội An",
      "difficulty": "beginner",
      "estimated_duration": 15,
      "is_completed": false,
      "score": null
    },
    {
      "id": 2,
      "title": "Gốm Sứ Thương Tín",
      "difficulty": "intermediate",
      "estimated_duration": 20,
      "is_completed": true,
      "score": 85
    }
  ],
  "progress": {
    "completed": 1,
    "total": 5,
    "percentage": 20
  }
}
```

#### Step 2: Hoàn Thành Module

```bash
curl -X POST http://localhost:3000/api/learning/1/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 92
  }'
```

Response:

```json
{
  "success": true,
  "message": "Module completed",
  "data": {
    "module_title": "Giới Thiệu Lịch Sử Hội An",
    "score": 92,
    "points_earned": 50,
    "passed": true
  }
}
```

#### Step 3: Hoàn Thành Quest để Kiếm Badges

```bash
curl -X POST http://localhost:3000/api/quests/1/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 100
  }'
```

Response:

```json
{
  "success": true,
  "message": "Quest completed successfully",
  "data": {
    "quest_title": "Khám Phá Hội An",
    "points_earned": 100,
    "badges_earned": ["Explorer", "History_Seeker"],
    "new_level": 2,
    "total_points": 280
  }
}
```

#### Step 4: Kiểm Tra Bảng Xếp Hạng

```bash
curl "http://localhost:3000/api/quests/leaderboard" \
  -H "Authorization: Bearer $TOKEN"
```

Response:

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

## 🛠️ Development & Deployment

### Local Development

#### Setup Development Environment

```bash
# 1. Cài đặt dependencies
npm install

# 2. Copy environment
cp .env.develop .env

# 3. Khởi chạy server
npm run dev

# 4. Kiểm tra
curl http://localhost:3000/api/health
```

#### Development Tools

**Thunder Client / Postman:**

```
Import collection từ: config/endpoints.js
```

**Database Management:**

```bash
# View database
cat database/db.json | jq

# Backup
cp database/db.json database/db.json.backup

# Reset
npm run seed
```

### Production Deployment

#### Environment Configuration

```env
# .env (Production)
PORT=3000
NODE_ENV=production
JWT_SECRET=your_very_strong_secret_key_at_least_32_chars
JWT_EXPIRE=7d
DATABASE_URL=mongodb://username:password@host:27017/sen
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

#### Deployment Steps

```bash
# 1. Build
npm run build

# 2. Start with PM2
pm2 start server.js --name "sen-api"

# 3. Enable auto-restart
pm2 startup
pm2 save

# 4. View logs
pm2 logs sen-api

# 5. Monitor
pm2 monit
```

#### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  sen-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

**Deploy:**

```bash
docker-compose up -d
```

---

## 📊 Database Migration Guide

### From JSON to MongoDB

#### Step 1: Chuẩn Bị MongoDB

```bash
# Local MongoDB
mongod --dbpath /data/db

# Or Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### Step 2: Tạo Migration Script

```javascript
// scripts/migrate-to-mongodb.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGODB_URI = process.env.DATABASE_URL;

async function migrate() {
  try {
    await mongoose.connect(MONGODB_URI);

    const dbJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../database/db.json"), "utf8"));

    // Migrate users
    const User = require("../models/User");
    await User.insertMany(dbJson.users);
    console.log("✓ Users migrated");

    // Migrate artifacts
    const Artifact = require("../models/Artifact");
    await Artifact.insertMany(dbJson.artifacts);
    console.log("✓ Artifacts migrated");

    // ... migrate other collections

    console.log("✅ Migration completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
```

#### Step 3: Chạy Migration

```bash
MONGODB_URI=mongodb://localhost:27017/sen node scripts/migrate-to-mongodb.js
```

---

## 🔍 Monitoring & Maintenance

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/api/health

# Response:
# {
#   "status": "OK",
#   "message": "Sen API is running"
# }
```

### Database Integrity

```bash
# Check database file
file database/db.json

# Validate JSON
jq empty database/db.json

# File size
du -h database/db.json
```

### Performance Metrics

```javascript
// Track response times
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});
```

### Backup Strategy

```bash
# Daily backup
0 2 * * * cp /app/database/db.json /backups/db-$(date +\%Y\%m\%d).json

# Keep last 30 days
find /backups -name "db-*.json" -mtime +30 -delete
```

---

## 🚨 Security Checklist

- ✅ Change JWT_SECRET in production
- ✅ Enable HTTPS/TLS
- ✅ Setup rate limiting
- ✅ Validate all inputs
- ✅ Sanitize database queries
- ✅ Use environment variables for secrets
- ✅ Enable CORS for specific origins
- ✅ Implement request logging
- ✅ Regular security updates
- ✅ Database backups

---

## 📞 Support & Troubleshooting

### Getting Help

1. **Check Logs:**

   ```bash
   tail -f logs/app.log
   ```

2. **Enable Debug Mode:**

   ```bash
   DEBUG=* npm run dev
   ```

3. **API Documentation:**

   ```
   GET http://localhost:3000/api
   ```

4. **Database Inspection:**
   ```bash
   jq . database/db.json
   ```

### Common Error Messages

| Error                    | Giải Pháp                           |
| ------------------------ | ----------------------------------- |
| EADDRINUSE               | Thay đổi PORT hoặc kill process     |
| Invalid token            | Kiểm tra JWT_SECRET và format token |
| Email already exists     | Dùng email khác hoặc xóa user cũ    |
| Collection not found     | Kiểm tra collectionId có tồn tại    |
| Insufficient permissions | Kiểm tra role và authorization      |

---

## 📝 Changelog

### Version 1.0.0 (2024-11-22)

**Features:**

- ✨ Complete API documentation
- ✨ Import/Export functionality
- ✨ Full-text search
- ✨ Gamification system
- ✨ Learning path tracking

**Improvements:**

- 🔧 Enhanced error handling
- 🔧 Better pagination
- 🔧 Optimized database queries
- 🔧 Comprehensive validation

**Fixes:**

- 🐛 Token refresh logic
- 🐛 Collection filtering
- 🐛 Review aggregation

---

## 📚 Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start with auto-reload
npm start              # Start production
npm test               # Run tests
npm run seed           # Seed database

# Database
npm run backup         # Backup database
npm run restore        # Restore from backup
npm run migrate        # Migrate to MongoDB

# Deployment
npm run build          # Build for production
npm run deploy         # Deploy to production
```

### HTTP Status Codes Used

```
200 OK                 - Request successful
201 Created            - Resource created
400 Bad Request        - Validation error
401 Unauthorized       - Missing/invalid token
403 Forbidden          - Insufficient permissions
404 Not Found          - Resource not found
409 Conflict           - Duplicate resource
422 Unprocessable      - Validation failed
500 Server Error       - Internal error
```

---

**Made with ❤️ for Cultural Heritage Preservation (SEN - WEB)**

Last Updated: November 22, 2024
