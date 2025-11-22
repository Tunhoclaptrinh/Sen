# 🏗️ CultureVault Backend - Architecture & System Design

**Version:** 3.0.0  
**Design Pattern:** MVC + Service Layer  
**Last Updated:** 2024-11-22

---

## 📋 Mục Lục

1. [System Overview](#system-overview)
2. [Directory Structure](#directory-structure)
3. [Architectural Patterns](#architectural-patterns)
4. [Data Flow](#data-flow)
5. [Module Design](#module-design)
6. [Database Layer](#database-layer)
7. [API Layer](#api-layer)
8. [Middleware Stack](#middleware-stack)
9. [Authentication Flow](#authentication-flow)
10. [Error Handling](#error-handling)

---

## 🎯 System Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
│              (Web, Mobile, Desktop Clients)                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTP/HTTPS (REST API)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    EXPRESS.JS SERVER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MIDDLEWARE STACK                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • CORS & Security Headers                              │ │
│  │ • Request Logging & Monitoring                         │ │
│  │ • Body Parser (JSON/URL-Encoded)                       │ │
│  │ • Authentication (JWT Validation)                      │ │
│  │ • Query Parsing (Pagination, Filter, Search)           │ │
│  │ • Rate Limiting & Throttling                           │ │
│  │ • Error Handling                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ROUTING LAYER                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • /api/auth/*           (Authentication Routes)        │ │
│  │ • /api/heritage-sites/* (Heritage Management)          │ │
│  │ • /api/artifacts/*      (Artifact Management)          │ │
│  │ • /api/collections/*    (User Collections)             │ │
│  │ • /api/reviews/*        (Reviews & Ratings)            │ │
│  │ • /api/favorites/*      (Favorite Items)               │ │
│  │ • /api/exhibitions/*    (Exhibitions)                  │ │
│  │ • /api/learning/*       (Learning Modules)             │ │
│  │ • /api/quests/*         (Gamification)                 │ │
│  │ • /api/users/*          (User Management)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CONTROLLER LAYER                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Controllers handle HTTP requests and responses         │ │
│  │ Validate input, call services, format output           │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              SERVICE LAYER                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Services implement business logic                      │ │
│  │ Validate data, coordinate operations                   │ │
│  │ Transform between controllers and database             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              DATA ACCESS LAYER                         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Database abstraction (JSON/MongoDB)                    │ │
│  │ CRUD operations, Query building                        │ │
│  │ Schema validation, Data transformation                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    DATA STORAGE                             │
├─────────────────────────────────────────────────────────────┤
│  Development:  database/db.json (JSON File)                 │
│  Production:   MongoDB / PostgreSQL                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

### Complete File Organization

```
culturevault-backend/
│
├── 📁 config/
│   ├── database.js              # Database initialization & CRUD operations
│   └── endpoints.js             # API endpoints reference configuration
│
├── 📁 controllers/              # HTTP Request Handlers
│   ├── auth.controller.js       # Authentication (register, login, logout)
│   ├── heritage_site.controller.js  # Heritage sites operations
│   ├── artifact.controller.js   # Artifacts management
│   ├── collection.controller.js # Personal collections
│   ├── review.controller.js     # Reviews & ratings
│   ├── favorite.controller.js   # Favorites management
│   ├── exhibition.controller.js # Exhibitions
│   ├── learning.controller.js   # Learning modules
│   ├── quest.controller.js      # Quests & gamification
│   ├── user.controller.js       # User management
│   ├── timeline.controller.js   # Timeline events
│   ├── notification.controller.js   # Notifications
│   ├── payment.controller.js    # Payment processing
│   ├── promotion.controller.js  # Promotions & discounts
│   ├── manager.controller.js    # Manager dashboard
│   ├── importExport.controller.js   # Import/Export operations
│   └── address.controller.js    # Address management
│
├── 📁 middleware/               # Express Middleware
│   ├── auth.middleware.js       # JWT validation & protection
│   ├── rbac.middleware.js       # Role-based access control
│   ├── query.middleware.js      # Query parameter parsing
│   ├── validation.middleware.js # Schema validation
│   └── error.middleware.js      # Global error handling
│
├── 📁 routes/                   # Express Routes
│   ├── auth.routes.js
│   ├── heritage_site.routes.js
│   ├── artifact.routes.js
│   ├── collection.routes.js
│   ├── review.routes.js
│   ├── favorite.routes.js
│   ├── exhibition.routes.js
│   ├── learning.routes.js
│   ├── quest.routes.js
│   ├── user.routes.js
│   ├── timeline.routes.js
│   ├── notification.routes.js
│   ├── payment.routes.js
│   ├── promotion.routes.js
│   ├── manager.routes.js
│   └── index.js                 # Route aggregation
│
├── 📁 services/                 # Business Logic Layer
│   ├── heritage_site.service.js
│   ├── artifact.service.js
│   ├── collection.service.js
│   ├── review.service.js
│   ├── favorite.service.js
│   ├── exhibition.service.js
│   ├── learning.service.js
│   ├── quest.service.js
│   ├── user.service.js
│   ├── timeline.service.js
│   ├── notification.service.js
│   ├── payment.service.js
│   ├── promotion.service.js
│   └── importExport.service.js
│
├── 📁 schemas/                  # Data Validation Schemas
│   ├── user.schema.js
│   ├── artifact.schema.js
│   ├── heritage_site.schema.js
│   ├── collection.schema.js
│   ├── review.schema.js
│   ├── favorite.schema.js
│   ├── exhibition.schema.js
│   ├── timeline.schema.js
│   ├── notification.schema.js
│   ├── payment.schema.js
│   ├── promotion.schema.js
│   ├── address.schema.js
│   ├── cultural_category.schema.js
│   └── index.js                 # Schema aggregation
│
├── 📁 utils/                    # Utility Functions
│   ├── helpers.js               # JWT, password, distance calc
│   ├── BaseService.js           # Base service class (CRUD, validation)
│   ├── BaseController.js        # Base controller class
│   ├── constants.js             # App-wide constants
│   └── formatters.js            # Data formatting helpers
│
├── 📁 database/
│   ├── db.json                  # Development database
│   └── db.json.backup           # Database backup
│
├── 📁 logs/
│   ├── app.log                  # Application logs
│   ├── error.log                # Error logs
│   └── access.log               # Access logs
│
├── 📄 server.js                 # Express server entry point
├── 📄 package.json              # Dependencies & scripts
├── 📄 .env.develop              # Development environment
├── 📄 .env.example              # Environment template
├── 📄 .gitignore                # Git ignore rules
├── 📄 README.md                 # Project overview
└── 📄 CONTRIBUTING.md           # Contribution guidelines
```

---

## 🏛️ Architectural Patterns

### 1. MVC + Service Layer Pattern

```
Request → Route → Middleware → Controller → Service → Database
                                   ↓
                              Transform
                                   ↓
Response ← Format ← Transform ← Result
```

#### Responsibilities:

**Controller Layer:**

- Receive HTTP requests
- Parse & validate input parameters
- Call appropriate service methods
- Format and return responses
- Handle HTTP status codes

**Service Layer:**

- Implement business logic
- Validate data integrity
- Coordinate multiple operations
- Handle transactions
- Transform data between entities
- Enforce business rules

**Data Access Layer:**

- Database CRUD operations
- Query building and optimization
- Data persistence
- Schema validation

### 2. Singleton Pattern

```javascript
// Database instance - created once, reused everywhere
const db = require("./config/database");
module.exports = new Database();

// Service instances
module.exports = new HeritageSiteService();
```

### 3. Factory Pattern

```javascript
// Create service instances dynamically
function createService(entityName) {
  const services = {
    users: new UserService(),
    artifacts: new ArtifactService(),
    heritage_sites: new HeritageSiteService(),
  };
  return services[entityName];
}
```

### 4. Middleware Chain Pattern

```javascript
// Express middleware stack
app.use(cors()); // Layer 1
app.use(express.json()); // Layer 2
app.use(parseQuery); // Layer 3
app.use(logRequest); // Layer 4
app.use(protect); // Layer 5 (Auth)
app.use(errorHandler); // Layer 6 (Catch-all)
```

---

## 🔄 Data Flow

### Complete Request-Response Cycle

```
1. CLIENT REQUEST
   ↓
   POST /api/heritage-sites
   Authorization: Bearer token
   Content-Type: application/json
   {
     "name": "Phố Cổ Hội An",
     "type": "historic_building"
   }

2. MIDDLEWARE PROCESSING
   ├─ CORS Check ✓
   ├─ Body Parser (JSON) ✓
   ├─ Auth Middleware:
   │  ├─ Extract token
   │  ├─ Verify JWT signature
   │  ├─ Check expiration
   │  └─ Load user from DB
   ├─ Query Parser ✓
   └─ RBAC Check (admin only) ✓

3. ROUTING
   ├─ Match route: POST /api/heritage-sites
   └─ Route to: heritageSiteRoutes.js

4. CONTROLLER EXECUTION
   ├─ Receive request in controller
   ├─ Validate input:
   │  ├─ name: 5-200 chars ✓
   │  ├─ type: valid enum ✓
   │  └─ required fields ✓
   ├─ Extract user ID from req.user
   └─ Call service.create(data)

5. SERVICE LAYER
   ├─ Apply business logic
   ├─ Additional validation:
   │  ├─ Check name uniqueness
   │  ├─ Validate relationships
   │  └─ Apply transformations
   ├─ Call database layer
   └─ Return result with metadata

6. DATABASE LAYER
   ├─ Read current db.json
   ├─ Generate new ID
   ├─ Add timestamps:
   │  ├─ createdAt: 2024-11-22T10:30:00Z
   │  └─ updatedAt: 2024-11-22T10:30:00Z
   ├─ Write to db.json
   ├─ Sync filesystem
   └─ Return inserted document

7. RESPONSE FORMATTING
   ├─ Controller receives data
   ├─ Wrap in response object:
   │  ├─ success: true
   │  ├─ message: "Created successfully"
   │  └─ data: { id: 25, ... }
   ├─ Set HTTP status 201
   ├─ Set headers:
   │  ├─ Content-Type: application/json
   │  ├─ X-Total-Count: 1
   │  └─ Cache-Control: no-cache
   └─ Send response

8. CLIENT RECEIVES
   ├─ Status: 201 Created
   ├─ Headers parsed
   └─ Body:
      {
        "success": true,
        "message": "Heritage site created successfully",
        "data": {
          "id": 25,
          "name": "Phố Cổ Hội An",
          "type": "historic_building",
          "createdAt": "2024-11-22T10:30:00Z"
        }
      }
```

---

## 🧩 Module Design

### Authentication Module

```
┌─────────────────────────────────────┐
│      Auth Module Components         │
├─────────────────────────────────────┤
│                                     │
│  authController.js                  │
│  ├─ register()                      │
│  ├─ login()                         │
│  ├─ logout()                        │
│  ├─ getMe()                         │
│  └─ changePassword()                │
│                                     │
│  auth.middleware.js                 │
│  ├─ protect()      [JWT verify]     │
│  ├─ authorize()    [Role check]     │
│  └─ checkOwnership()                │
│                                     │
│  helpers.js (auth utils)            │
│  ├─ generateToken()                 │
│  ├─ hashPassword()                  │
│  ├─ comparePassword()               │
│  └─ sanitizeUser()                  │
│                                     │
│  user.schema.js                     │
│  └─ Validation rules                │
│                                     │
└─────────────────────────────────────┘
```

### Heritage Management Module

```
┌──────────────────────────────────────────────┐
│    Heritage Management Module                │
├──────────────────────────────────────────────┤
│                                              │
│  heritage_site.controller.js                 │
│  ├─ getAll()                                 │
│  ├─ getById()                                │
│  ├─ search()                                 │
│  ├─ findNearby()                             │
│  ├─ getArtifacts()                           │
│  ├─ getTimeline()                            │
│  ├─ create()                                 │
│  ├─ update()                                 │
│  └─ delete()                                 │
│                                              │
│  heritage_site.service.js                    │
│  ├─ Business logic                           │
│  ├─ Validation rules                         │
│  └─ Data transformation                      │
│                                              │
│  artifact.controller.js                      │
│  ├─ CRUD operations                          │
│  └─ Search & filter                          │
│                                              │
│  timeline.controller.js                      │
│  └─ Timeline events                          │
│                                              │
│  review.controller.js                        │
│  ├─ Get reviews                              │
│  ├─ Create review                            │
│  ├─ Update review                            │
│  └─ Delete review                            │
│                                              │
└──────────────────────────────────────────────┘
```

### Gamification Module

```
┌──────────────────────────────────────────────┐
│    Gamification Module                       │
├──────────────────────────────────────────────┤
│                                              │
│  quest.controller.js                         │
│  ├─ getAvailable()                           │
│  ├─ getById()                                │
│  ├─ complete()                               │
│  └─ getLeaderboard()                         │
│                                              │
│  quest.service.js                            │
│  ├─ Quest validation                         │
│  ├─ Score calculation                        │
│  ├─ Badge assignment                         │
│  ├─ Points tracking                          │
│  └─ Leaderboard generation                   │
│                                              │
│  learning.controller.js                      │
│  ├─ getPath()                                │
│  ├─ getModule()                              │
│  └─ complete()                               │
│                                              │
│  learning.service.js                         │
│  ├─ Progress tracking                        │
│  ├─ Module completion                        │
│  └─ Path recommendation                      │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🗄️ Database Layer

### Database Abstraction

```javascript
// config/database.js provides interface
class Database {
  // CRUD Operations
  findAll(collection)
  findById(collection, id)
  findOne(collection, query)
  findMany(collection, query)
  create(collection, data)
  update(collection, id, data)
  delete(collection, id)

  // Advanced Queries
  findAllAdvanced(collection, options)
  applyFilters(items, filters)
  applyFullTextSearch(items, query)
  applySorting(items, sortField, order)
  applyPagination(items, page, limit)

  // Utility
  getNextId(collection)
  saveData()
  loadData()
}
```

### Collections Schema

```javascript
{
  users,
    heritage_sites,
    artifacts,
    timelines,
    exhibitions,
    collections,
    reviews,
    favorites,
    learning_modules,
    game_quests,
    user_progress,
    cultural_categories,
    notifications,
    addresses,
    payments;
}
```

### Data Relationships

```
users
├─ n:m → collections    (owns collections)
├─ n:m → reviews        (creates reviews)
├─ n:m → favorites      (marks favorites)
└─ n:m → user_progress  (tracks progress)

heritage_sites
├─ 1:m → artifacts      (contains artifacts)
├─ 1:m → timelines      (has timeline events)
├─ n:m → reviews        (receives reviews)
└─ 1:m → exhibitions    (featured in exhibitions)

artifacts
├─ m:1 → heritage_sites (belongs to site)
├─ m:1 → category       (categorized)
├─ n:m → collections    (added to collections)
└─ n:m → reviews        (receives reviews)

collections
├─ m:1 → users          (owned by user)
├─ n:m → artifacts      (contains artifacts)
└─ n:m → exhibitions    (linked to exhibitions)
```

---

## 📡 API Layer

### Request Processing Pipeline

```
Request Received
    ↓
┌─────────────────────────────┐
│  CORS Middleware            │
│  ✓ Check origin             │
│  ✓ Allow credentials        │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Body Parser                │
│  ✓ Parse JSON               │
│  ✓ Parse URL-encoded        │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Request Logging            │
│  ✓ Log method + path        │
│  ✓ Track duration           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Query Parser               │
│  ✓ Parse pagination         │
│  ✓ Parse filters            │
│  ✓ Parse search query       │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Authentication             │
│  ✓ Extract token            │
│  ✓ Verify JWT               │
│  ✓ Load user                │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Authorization (RBAC)       │
│  ✓ Check role               │
│  ✓ Check permissions        │
│  ✓ Check ownership          │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Route Matching             │
│  ✓ Find handler             │
│  ✓ Extract params           │
└─────────────────────────────┘
    ↓
┌─────────────────────────────┐
│  Controller Execution       │
│  ✓ Validate input           │
│  ✓ Call service             │
│  ✓ Format response          │
└─────────────────────────────┘
    ↓
Response Sent
```

### Response Format

```javascript
// Standard Success Response
{
  success: true,
  message: "Operation successful",
  data: { /* resource */ },
  pagination: { /* if applicable */ }
}

// Standard Error Response
{
  success: false,
  message: "Error description",
  errors: [
    { field: "name", message: "Required" }
  ],
  statusCode: 400
}
```

---

## 🔐 Authentication Flow

### JWT Token Lifecycle

```
1. REGISTRATION/LOGIN
   User credentials
        ↓
   ✓ Validate credentials
   ✓ Hash password (bcryptjs)
   ✓ Generate JWT token
   ✓ Set expiration (30 days dev, 7 days prod)
        ↓
   Return token to client

2. TOKEN STORAGE (Client-side)
   ├─ localStorage.setItem(TOKEN_KEY, token)
   └─ Include in every request header

3. PROTECTED REQUEST
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        ↓
   ✓ Extract token from header
   ✓ Verify signature using JWT_SECRET
   ✓ Check expiration date
   ✓ Load user from database
   ✓ Attach user to req.user
        ↓
   Continue to next middleware

4. TOKEN EXPIRATION
   Token expires after 30 days
        ↓
   ✓ Next request fails auth
   ✓ User gets 401 response
   ✓ Client redirects to login
        ↓
   User logs in again

5. REFRESH (Future Implementation)
   Implement refresh token endpoint
   ├─ Issue long-lived refresh token
   ├─ Short-lived access token
   └─ Auto-refresh on expiration
```

### RBAC Implementation

```javascript
// Role permissions matrix
const PERMISSIONS = {
  admin: {
    users: ["create", "read", "update", "delete", "export", "import"],
    artifacts: ["create", "read", "update", "delete", "export", "import"],
    heritage_sites: ["create", "read", "update", "delete"],
    // Full access
  },

  customer: {
    products: ["read", "list"],
    collections: ["create", "read", "update", "delete"],
    reviews: ["create", "read", "update", "delete"],
    favorites: ["create", "read", "delete"],
    // Limited access
  },

  researcher: {
    artifacts: ["read", "export"],
    heritage_sites: ["read", "export"],
    reviews: ["read"],
    // Read-heavy access
  },
};

// Permission check
function hasPermission(role, resource, action) {
  return PERMISSIONS[role]?.[resource]?.includes(action) || false;
}
```

---

## ⚠️ Error Handling

### Error Hierarchy

```
ApplicationError (Base)
├─ ValidationError
│  ├─ Field validation failed
│  ├─ Type mismatch
│  └─ Required field missing
├─ AuthenticationError
│  ├─ Invalid token
│  ├─ Expired token
│  └─ No credentials
├─ AuthorizationError
│  ├─ Insufficient permissions
│  ├─ Role mismatch
│  └─ Ownership violation
├─ NotFoundError
│  └─ Resource not found
├─ ConflictError
│  └─ Duplicate entry
└─ ServerError
   ├─ Database error
   ├─ File system error
   └─ Unexpected error
```

### Error Handling Flow

```javascript
try {
  // 1. Input Validation
  if (!data.name) throw new ValidationError("Name required");

  // 2. Permission Check
  if (!hasPermission(user.role, "heritage_sites", "create")) {
    throw new AuthorizationError("Admin access required");
  }

  // 3. Business Logic
  const existing = db.findOne("heritage_sites", {name: data.name});
  if (existing) throw new ConflictError("Name already exists");

  // 4. Database Operation
  const result = db.create("heritage_sites", data);

  // 5. Response
  res.status(201).json({success: true, data: result});
} catch (error) {
  // 6. Error Response
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
  });
}
```

---

## 🔄 Service Layer Patterns

### BaseService Implementation

```javascript
class BaseService {
  async create(data) {
    // 1. Schema validation
    const validation = this.validateBySchema(data);
    if (!validation.success) return validation;

    // 2. Custom validation
    const customCheck = await this.validateCreate(data);
    if (!customCheck.success) return customCheck;

    // 3. Transform data
    const transformed = await this.beforeCreate(data);

    // 4. Persist
    const item = db.create(this.collection, transformed);

    // 5. Post-create hook
    await this.afterCreate(item);

    return {success: true, data: item};
  }
}
```

---

## 📊 Database Query Optimization

### Query Patterns

```javascript
// 1. Simple CRUD
db.findById("artifacts", 1);
db.create("artifacts", data);
db.update("artifacts", 1, updates);

// 2. Advanced Queries
db.findAllAdvanced("artifacts", {
  filter: {type: "painting", condition: "excellent"},
  sort: "rating",
  order: "desc",
  page: 1,
  limit: 10,
  q: "search term",
});

// 3. Relationships
db.findMany("reviews", {heritage_site_id: 1});
const site = db.findById("heritage_sites", 1);
const artifacts = db.findMany("artifacts", {heritage_site_id: 1});
```

---

## 🧪 Testing Architecture

### Test Structure

```
tests/
├── unit/
│  ├── services/
│  │  ├── heritage.service.test.js
│  │  ├── artifact.service.test.js
│  │  └── user.service.test.js
│  ├── utils/
│  │  ├── helpers.test.js
│  │  └── validators.test.js
│  └── schemas/
│     └── validation.test.js
├── integration/
│  ├── api/
│  │  ├── auth.api.test.js
│  │  ├── heritage.api.test.js
│  │  └── artifacts.api.test.js
│  └── database/
│     └── database.integration.test.js
└── e2e/
   ├── workflows/
   │  ├── register-login-browse.test.js
   │  └── create-collection.test.js
   └── performance/
      └── load.test.js
```

---

**Architecture Version:** 3.0.0  
**Last Updated:** November 22, 2024  
**Pattern:** MVC + Service Layer  
**Status:** Production Ready
