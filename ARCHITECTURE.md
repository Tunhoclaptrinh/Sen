# 🏗️ SEN Backend - Architecture & System Design

**Version:** 2.0.0  
**Design Pattern:** MVC + Service Layer  
**Last Updated:** December 3, 2025

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Directory Structure](#directory-structure)
4. [Architectural Patterns](#architectural-patterns)
5. [Data Flow](#data-flow)
6. [Module Design](#module-design)
7. [Database Layer](#database-layer)
8. [API Layer](#api-layer)
9. [Middleware Stack](#middleware-stack)
10. [Authentication & Authorization](#authentication--authorization)
11. [Game System Architecture](#game-system-architecture)
12. [Error Handling](#error-handling)
13. [Security](#security)
14. [Performance & Optimization](#performance--optimization)

---

## 🎯 System Overview

### Core Technologies

- **Runtime:** Node.js v16+
- **Framework:** Express.js 4.x
- **Database:** JSON File (Development) / MongoDB (Production)
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** express-validator
- **File Upload:** Multer
- **Password Hashing:** bcryptjs
- **Image Processing:** Sharp

### System Characteristics

- **Architecture Style:** Layered (MVC + Service Layer)
- **API Style:** RESTful
- **Data Format:** JSON
- **Authentication:** Token-based (JWT)
- **Authorization:** Role-Based Access Control (RBAC)

---

## 📐 Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
│         (Web Browser, Mobile App, Desktop Client)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTP/HTTPS (REST API)
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    EXPRESS.JS SERVER                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MIDDLEWARE STACK                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • CORS & Security Headers                              │ │
│  │ • Request Logging (Logger Middleware)                  │ │
│  │ • Body Parser (JSON/URL-Encoded)                       │ │
│  │ • Query Parser (Pagination, Filter, Search)            │ │
│  │ • Authentication (JWT Validation)                      │ │
│  │ • Authorization (RBAC - Role Check)                    │ │
│  │ • Request Validation (Schema Validation)               │ │
│  │ • Error Handling (Global Error Handler)                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              ROUTING LAYER                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ Public Routes:                                         │ │
│  │ • /api/auth/*           Authentication                 │ │
│  │ • /api/heritage-sites/* Heritage Sites (Read)          │ │
│  │ • /api/artifacts/*      Artifacts (Read)               │ │
│  │ • /api/exhibitions/*    Exhibitions (Read)             │ │
│  │ • /api/categories/*     Categories (Read)              │ │
│  │                                                        │ │
│  │ Protected Routes (Require Auth):                       │ │
│  │ • /api/game/*           Game System                    │ │
│  │ • /api/ai/*             AI Assistant                   │ │
│  │ • /api/learning/*       Learning Paths                 │ │
│  │ • /api/quests/*         Quest System                   │ │
│  │ • /api/collections/*    User Collections               │ │
│  │ • /api/favorites/*      Favorites                      │ │
│  │ • /api/reviews/*        Reviews & Ratings              │ │
│  │ • /api/notifications/*  Notifications                  │ │
│  │ • /api/users/*          User Management                │ │
│  │                                                        │ │
│  │ Admin Routes (Require Admin Role):                     │ │
│  │ • /api/admin/levels/*   Level CMS                      │ │
│  │ • /api/admin/chapters/* Chapter CMS                    │ │
│  │ • /api/admin/characters/* Character CMS                │ │
│  │ • /api/admin/assets/*   Asset Management               │ │
│  │ • /api/upload/*         File Upload                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CONTROLLER LAYER                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • Handle HTTP Requests & Responses                     │ │
│  │ • Validate Request Parameters                          │ │
│  │ • Call Service Layer Methods                           │ │
│  │ • Format & Return API Responses                        │ │
│  │ • Set HTTP Status Codes                                │ │
│  │ • Handle Controller-Level Errors                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              SERVICE LAYER                             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • Implement Business Logic                             │ │
│  │ • Data Validation & Transformation                     │ │
│  │ • Coordinate Multiple Operations                       │ │
│  │ • Handle Complex Calculations                          │ │
│  │ • Manage Transactions                                  │ │
│  │ • Apply Business Rules                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              DATA ACCESS LAYER                         │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │ • Database Abstraction (config/database.js)            │ │
│  │ • CRUD Operations (Create, Read, Update, Delete)       │ │
│  │ • Query Building & Optimization                        │ │
│  │ • Advanced Filtering & Searching                       │ │
│  │ • Pagination & Sorting                                 │ │
│  │ • Schema Validation                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    DATA STORAGE                             │
├─────────────────────────────────────────────────────────────┤
│  Development:  database/db.json (JSON File Storage)         │
│  Production:   MongoDB / PostgreSQL (Planned)               │
│  Uploads:      database/uploads/ (File System)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Directory Structure

### Complete Project Organization

```
sen-backend/
│
├── 📁 config/                      # Configuration Files
│   ├── database.js                 # Database abstraction & CRUD operations
│   └── endpoints.js                # API endpoints reference
│
├── 📁 controllers/                 # HTTP Request Handlers (16 controllers)
│   ├── auth.controller.js          # Authentication (register, login, logout)
│   ├── user.controller.js          # User management & profiles
│   ├── heritage_site.controller.js # Heritage sites CRUD
│   ├── artifact.controller.js      # Artifacts management
│   ├── category.controller.js      # Categories management
│   ├── exhibition.controller.js    # Exhibitions management
│   ├── collection.controller.js    # Personal collections
│   ├── favorite.controller.js      # Favorites management (unified)
│   ├── review.controller.js        # Reviews & ratings
│   ├── game.controller.js          # Game system (unified)
│   ├── ai.controller.js            # AI assistant/chatbot
│   ├── learning.controller.js      # Learning modules
│   ├── quest.controller.js         # Quest system
│   ├── notification.controller.js  # Notifications
│   ├── upload.controller.js        # File uploads
│   ├── timeline.controller.js      # Timeline events
│   ├── address.controller.js       # Address management
│   ├── cultural_category.controller.js  # Cultural categories
│   ├── importExport.controller.js  # Import/Export operations
│   │
│   └── CMS Controllers (Admin):
│       ├── level_cms.controller.js     # Level management
│       ├── chapter_cms.controller.js   # Chapter management
│       ├── character_cms.controller.js # Character management
│       └── asset_cms.controller.js     # Asset management
│
├── 📁 middleware/                  # Express Middleware (5 modules)
│   ├── auth.middleware.js          # JWT validation, protect routes
│   ├── rbac.middleware.js          # Role-based access control
│   ├── query.middleware.js         # Query parsing (JSON Server style)
│   ├── validation.middleware.js    # Schema validation
│   └── logger.middleware.js        # Request logging
│
├── 📁 routes/                      # Express Routes (17+ route files)
│   ├── index.js                    # Route aggregator
│   ├── auth.routes.js              # Authentication endpoints
│   ├── user.routes.js              # User management endpoints
│   ├── heritage_site.routes.js     # Heritage sites endpoints
│   ├── artifact.routes.js          # Artifacts endpoints
│   ├── category.routes.js          # Categories endpoints
│   ├── exhibition.routes.js        # Exhibitions endpoints
│   ├── collection.routes.js        # Collections endpoints
│   ├── favorite.routes.js          # Favorites endpoints (unified)
│   ├── review.routes.js            # Reviews endpoints
│   ├── game.routes.js              # Game system endpoints (unified)
│   ├── ai.routes.js                # AI assistant endpoints
│   ├── learning.routes.js          # Learning paths endpoints
│   ├── quest.routes.js             # Quest system endpoints
│   ├── notification.routes.js      # Notifications endpoints
│   ├── upload.routes.js            # Upload endpoints
│   │
│   └── 📁 admin/                   # Admin CMS Routes
│       ├── index.js                # Admin route aggregator
│       ├── level.routes.js         # Level CMS routes
│       ├── chapter.routes.js       # Chapter CMS routes
│       ├── character.routes.js     # Character CMS routes
│       └── asset.routes.js         # Asset CMS routes
│
├── 📁 services/                    # Business Logic Layer (21+ services)
│   ├── user.service.js             # User business logic
│   ├── heritage_site.service.js    # Heritage sites logic
│   ├── artifact.service.js         # Artifacts logic
│   ├── category.service.js         # Categories logic
│   ├── exhibition.service.js       # Exhibitions logic
│   ├── favorite.service.js         # Favorites logic
│   ├── review.service.js           # Reviews logic
│   ├── game.service.js             # Game system logic (unified)
│   ├── ai.service.js               # AI assistant logic
│   ├── learning.service.js         # Learning paths logic
│   ├── quest.service.js            # Quest system logic
│   ├── notification.service.js     # Notifications logic
│   ├── upload.service.js           # File upload logic
│   ├── timeline.service.js         # Timeline logic
│   ├── address.service.js          # Address logic
│   ├── promotion.service.js        # Promotions logic
│   ├── importExport.service.js     # Import/Export logic
│   │
│   └── CMS Services:
│       ├── level_cms.service.js        # Level CMS logic
│       ├── chapter_cms.service.js      # Chapter CMS logic
│       ├── character_cms.service.js    # Character CMS logic
│       └── asset_cms.service.js        # Asset CMS logic
│
├── 📁 schemas/                     # Data Validation Schemas (15+ schemas)
│   ├── index.js                    # Schema aggregator
│   ├── user.schema.js              # User validation schema
│   ├── heritage_site.schema.js     # Heritage site schema
│   ├── artifact.schema.js          # Artifact schema
│   ├── cultural_category.schema.js # Cultural category schema
│   ├── exhibition.schema.js        # Exhibition schema
│   ├── collection.schema.js        # Collection schema
│   ├── favorite.schema.js          # Favorite schema
│   ├── review.schema.js            # Review schema
│   ├── timeline.schema.js          # Timeline schema
│   ├── notification.schema.js      # Notification schema
│   ├── address.schema.js           # Address schema
│   ├── scan_object.schema.js       # Scan object schema
│   ├── shop_item.schema.js         # Shop item schema
│   │
│   └── Game Schemas:
│       ├── game_chapter.schema.js      # Chapter schema
│       ├── game_level.schema.js        # Level schema
│       ├── game_character.schema.js    # Character schema
│       └── game_progress.schema.js     # Progress schema
│
├── 📁 utils/                       # Utility Functions
│   ├── helpers.js                  # JWT, password, distance calc
│   └── constants.js                # Application constants
│
├── 📁 database/                    # Data Storage
│   ├── db.json                     # Main database (Development)
│   ├── db.json.backup              # Database backup
│   └── uploads/                    # Uploaded files directory
│
├── 📁 docs/                        # Documentation
│   ├── API_ENDPOINTS.md            # Complete API documentation
│   ├── ARCHITECTURE.md             # This file
│   ├── GAME_SYSTEM_README.md       # Game system documentation
│   └── CONTRIBUTING.md             # Contribution guidelines
│
├── 📄 server.js                    # Express server entry point
├── 📄 package.json                 # Dependencies & scripts
├── 📄 .env.example                 # Environment variables template
├── 📄 .gitignore                   # Git ignore rules
└── 📄 README.md                    # Project overview
```

---

## 🏛️ Architectural Patterns

### 1. MVC + Service Layer Pattern

```
┌──────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                          │
└──────────────────────────────────────────────────────────┘

Client Request
      ↓
[Route] - Match URL pattern
      ↓
[Middleware Stack]
  ├─ CORS
  ├─ Body Parser
  ├─ Logger
  ├─ Query Parser
  ├─ Authentication (protect)
  ├─ Authorization (authorize)
  └─ Validation
      ↓
[Controller] - HTTP Handler
  ├─ Extract parameters
  ├─ Validate input
  ├─ Call service method
  └─ Format response
      ↓
[Service] - Business Logic
  ├─ Apply business rules
  ├─ Validate data integrity
  ├─ Coordinate operations
  ├─ Transform data
  └─ Call database layer
      ↓
[Database] - Data Access
  ├─ Execute CRUD operations
  ├─ Apply filters & queries
  ├─ Handle relationships
  └─ Return results
      ↓
[Service] - Post-processing
  ├─ Transform results
  ├─ Calculate derived data
  └─ Return to controller
      ↓
[Controller] - Response
  ├─ Wrap in standard format
  ├─ Set HTTP status
  └─ Send JSON response
      ↓
Client Response
```

### 2. Layer Responsibilities

#### **Controller Layer**

```javascript
// controllers/heritage_site.controller.js
class HeritageSiteController {
  async getById(req, res, next) {
    try {
      // 1. Extract parameters
      const { id } = req.params;
      
      // 2. Call service
      const result = await heritageSiteService.getById(id);
      
      // 3. Handle result
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      // 4. Return response
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

#### **Service Layer**

```javascript
// services/heritage_site.service.js
class HeritageSiteService {
  async getById(id) {
    // 1. Validate input
    if (!id) {
      return { success: false, message: 'ID is required' };
    }
    
    // 2. Fetch from database
    const site = db.findById('heritage_sites', id);
    
    if (!site) {
      return { success: false, message: 'Heritage site not found' };
    }
    
    // 3. Enrich data (load relations)
    const artifacts = db.findMany('artifacts', { heritage_site_id: id });
    const reviews = db.findMany('reviews', { 
      type: 'heritage_site',
      heritage_site_id: id 
    });
    
    // 4. Calculate derived data
    const avgRating = this.calculateAverageRating(reviews);
    
    // 5. Transform & return
    return {
      success: true,
      data: {
        ...site,
        artifacts,
        reviewCount: reviews.length,
        averageRating: avgRating
      }
    };
  }
}
```

#### **Database Layer**

```javascript
// config/database.js
class Database {
  findById(collection, id) {
    return this.data[collection]?.find(item => item.id === parseInt(id));
  }
  
  findMany(collection, query) {
    return this.data[collection]?.filter(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    }) || [];
  }
  
  findAllAdvanced(collection, options) {
    let items = [...(this.data[collection] || [])];
    
    // Apply filters
    if (options.filter) {
      items = this.applyFilters(items, options.filter);
    }
    
    // Apply search
    if (options.q) {
      items = this.applyFullTextSearch(items, options.q);
    }
    
    // Apply sorting
    if (options.sort) {
      items = this.applySorting(items, options.sort, options.order);
    }
    
    // Apply pagination
    return this.applyPagination(items, options.page, options.limit);
  }
}
```

### 3. Design Patterns Used

#### **Singleton Pattern**

```javascript
// Database instance - created once, shared everywhere
// config/database.js
class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.data = this.loadData();
    Database.instance = this;
  }
}

module.exports = new Database(); // Export singleton instance
```

#### **Factory Pattern**

```javascript
// Service factory for dynamic service creation
function getService(entityName) {
  const services = {
    users: require('./user.service'),
    artifacts: require('./artifact.service'),
    heritage_sites: require('./heritage_site.service')
  };
  
  return services[entityName];
}
```

#### **Middleware Chain Pattern**

```javascript
// Express middleware chain
app.use(cors());                    // Layer 1: CORS
app.use(express.json());            // Layer 2: Body Parser
app.use(parseQuery);                // Layer 3: Query Parser
app.use(logRequest);                // Layer 4: Logger
app.use('/api/game', protect);      // Layer 5: Auth
app.use('/api/admin', authorize('admin')); // Layer 6: RBAC
app.use(errorHandler);              // Layer 7: Error Handler
```

#### **Strategy Pattern**

```javascript
// Different validation strategies
const validators = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  phone: (value) => /^[0-9]{10}$/.test(value),
  required: (value) => value !== undefined && value !== null
};

function validate(field, strategy, value) {
  return validators[strategy](value);
}
```

---

## 🔄 Data Flow

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                           │
├─────────────────────────────────────────────────────────────┤
│ POST /api/game/levels/1/start                               │
│ Authorization: Bearer eyJhbGciOiJIUzI1NiIs...                │
│ Content-Type: application/json                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE PROCESSING                                    │
├─────────────────────────────────────────────────────────────┤
│ ✓ CORS Check (Allow Origin)                                │
│ ✓ Body Parser (Parse JSON)                                 │
│ ✓ Logger (Log request)                                     │
│ ✓ Query Parser (Parse query params)                        │
│ ✓ Authentication:                                          │
│   - Extract token from header                              │
│   - Verify JWT signature                                   │
│   - Check token expiration                                 │
│   - Load user from database                                │
│   - Attach user to req.user                                │
│ ✓ Authorization: Check user role                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ROUTING                                                  │
├─────────────────────────────────────────────────────────────┤
│ Match route: POST /api/game/levels/:id/start               │
│ Extract params: { id: '1' }                                │
│ Route to: game.routes.js → gameController.startLevel       │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER EXECUTION                                     │
├─────────────────────────────────────────────────────────────┤
│ gameController.startLevel(req, res, next)                   │
│ - Extract: levelId = req.params.id                         │
│ - Extract: userId = req.user.id                            │
│ - Validate: levelId is valid                               │
│ - Call: gameService.startLevel(levelId, userId)            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SERVICE LAYER                                            │
├─────────────────────────────────────────────────────────────┤
│ gameService.startLevel(levelId, userId)                     │
│                                                             │
│ Business Logic:                                             │
│ 1. Check if level exists                                   │
│ 2. Check if level is unlocked for user                     │
│ 3. Check if level is already in progress                   │
│ 4. Create new game session                                 │
│ 5. Load first screen of level                              │
│ 6. Update user progress                                    │
│ 7. Return session data                                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. DATABASE LAYER                                           │
├─────────────────────────────────────────────────────────────┤
│ db.findById('game_levels', 1)                               │
│ db.findOne('game_progress', { user_id: userId })            │
│ db.create('game_sessions', sessionData)                     │
│ db.update('game_progress', progressId, updates)             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. RESPONSE FORMATTING                                      │
├─────────────────────────────────────────────────────────────┤
│ Controller receives result from service                     │
│ Wrap in standard response format:                          │
│ {                                                           │
│   success: true,                                           │
│   message: "Level started",                                │
│   data: {                                                  │
│     sessionId: "session_123",                              │
│     level: { id: 1, name: "..." },                         │
│     currentScreen: { ... }                                 │
│   }                                                        │
│ }                                                          │
│ Set status: 200 OK                                         │
│ Set headers: Content-Type, Cache-Control                   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. CLIENT RECEIVES                                          │
├─────────────────────────────────────────────────────────────┤
│ Status: 200 OK                                              │
│ Headers: Content-Type: application/json                    │
│ Body: { success: true, data: {...} }                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Module Design

### Authentication Module

```
┌─────────────────────────────────────────────────────┐
│           AUTHENTICATION MODULE                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📁 controllers/auth.controller.js                  │
│  ├─ register()        → Create new user            │
│  ├─ login()           → Authenticate user          │
│  ├─ logout()          → End session                │
│  ├─ getMe()           → Get current user           │
│  └─ changePassword()  → Update password            │
│                                                     │
│  📁 middleware/auth.middleware.js                   │
│  ├─ protect()         → Verify JWT token           │
│  ├─ authorize()       → Check user role            │
│  └─ checkOwnership()  → Verify resource ownership  │
│                                                     │
│  📁 utils/helpers.js                                │
│  ├─ generateToken()   → Create JWT                 │
│  ├─ hashPassword()    → Hash with bcrypt           │
│  ├─ comparePassword() → Verify password            │
│  └─ sanitizeUser()    → Remove sensitive data      │
│                                                     │
│  📁 schemas/user.schema.js                          │
│  └─ Validation rules for user data                 │
│                                                     │
│  📁 routes/auth.routes.js                           │
│  └─ Authentication endpoints                        │
│                                                     │
└─────────────────────────────────────────────────────┘

Flow:
1. User sends credentials → auth.routes
2. Route calls → auth.controller
3. Controller validates → calls hashPassword/comparePassword
4. On success → generateToken()
5. Return token to client
6. Client stores token
7. Include in Authorization header for protected requests
8. protect() middleware verifies token
9. authorize() middleware checks role
```

### Game System Module

```
┌──────────────────────────────────────────────────────┐
│              GAME SYSTEM MODULE                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📁 controllers/game.controller.js                   │
│  ├─ getProgress()          → User progress          │
│  ├─ getChapters()          → List chapters          │
│  ├─ unlockChapter()        → Unlock new chapter     │
│  ├─ getLevels()            → List levels            │
│  ├─ startLevel()           → Start level session    │
│  ├─ navigateToNextScreen() → Move to next screen    │
│  ├─ submitAnswer()         → Submit quiz answer     │
│  ├─ collectClue()          → Collect item/clue      │
│  ├─ completeLevel()        → Finish level           │
│  ├─ getMuseum()            → Museum collection      │
│  ├─ getBadges()            → User badges            │
│  ├─ scanObject()           → QR code scanning       │
│  ├─ purchaseItem()         → Buy shop items         │
│  └─ getLeaderboard()       → Rankings               │
│                                                      │
│  📁 services/game.service.js                         │
│  ├─ Progress tracking                               │
│  ├─ Chapter unlocking logic                         │
│  ├─ Level session management                        │
│  ├─ Screen navigation                               │
│  ├─ Answer validation                               │
│  ├─ Reward calculation                              │
│  ├─ Badge assignment                                │
│  └─ Leaderboard generation                          │
│                                                      │
│  📁 schemas/                                         │
│  ├─ game_chapter.schema.js                          │
│  ├─ game_level.schema.js                            │
│  ├─ game_character.schema.js                        │
│  └─ game_progress.schema.js                         │
│                                                      │
│  📁 routes/game.routes.js                            │
│  └─ All game endpoints (require auth)               │
│                                                      │
│  📁 Admin CMS:                                       │
│  ├─ controllers/level_cms.controller.js             │
│  ├─ controllers/chapter_cms.controller.js           │
│  ├─ controllers/character_cms.controller.js         │
│  └─ routes/admin/*.routes.js                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Heritage Management Module

```
┌──────────────────────────────────────────────────────┐
│         HERITAGE MANAGEMENT MODULE                   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📁 controllers/                                     │
│  ├─ heritage_site.controller.js                      │
│  │  ├─ getAll()         → List sites                │
│  │  ├─ getById()        → Site details              │
│  │  ├─ search()         → Search sites              │
│  │  ├─ getNearby()      → GPS-based search          │
│  │  ├─ getArtifacts()   → Site's artifacts          │
│  │  ├─ getTimeline()    → Historical timeline       │
│  │  ├─ create()         → Add new site (Auth)       │
│  │  ├─ update()         → Edit site (Auth)          │
│  │  └─ delete()         → Remove site (Auth)        │
│  │                                                   │
│  ├─ artifact.controller.js                           │
│  │  ├─ getAll()         → List artifacts            │
│  │  ├─ search()         → Search artifacts          │
│  │  ├─ getRelated()     → Related artifacts         │
│  │  └─ CRUD operations                              │
│  │                                                   │
│  ├─ category.controller.js                           │
│  │  └─ Category management                          │
│  │                                                   │
│  └─ exhibition.controller.js                         │
│     └─ Exhibition management                         │
│                                                      │
│  📁 services/                                        │
│  ├─ heritage_site.service.js                         │
│  ├─ artifact.service.js                              │
│  ├─ category.service.js                              │
│  └─ exhibition.service.js                            │
│                                                      │
│  📁 utils/helpers.js                                 │
│  ├─ calculateDistance()  → GPS distance calc        │
│  └─ formatDistance()     → Display formatting       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### AI Assistant Module

```
┌──────────────────────────────────────────────────────┐
│            AI ASSISTANT MODULE                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📁 controllers/ai.controller.js                     │
│  ├─ chat()           → Chat with AI character       │
│  ├─ getHistory()     → Retrieve chat history        │
│  ├─ askHint()        → Request game hint            │
│  ├─ explain()        → Explain artifact/site        │
│  ├─ generateQuiz()   → Create quiz questions        │
│  └─ clearHistory()   → Delete chat history          │
│                                                      │
│  📁 services/ai.service.js                           │
│  ├─ Process chat messages                           │
│  ├─ Generate contextual responses                   │
│  ├─ Provide gameplay hints                          │
│  ├─ Explain cultural artifacts                      │
│  └─ Generate educational quizzes                    │
│                                                      │
│  📁 routes/ai.routes.js                              │
│  └─ AI endpoints (all require auth)                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Layer

### Database Abstraction

```javascript
// config/database.js provides unified interface

class Database {
  constructor() {
    this.data = this.loadData(); // Load from db.json
  }
  
  // ==================== BASIC CRUD ====================
  
  findAll(collection)
  findById(collection, id)
  findOne(collection, query)
  findMany(collection, query)
  create(collection, data)
  update(collection, id, data)
  delete(collection, id)
  
  // ==================== ADVANCED QUERIES ====================
  
  findAllAdvanced(collection, options) {
    // Supports:
    // - Filtering (operators: _gte, _lte, _ne, _like, _in)
    // - Full-text search (q parameter)
    // - Sorting (sort, order)
    // - Pagination (page, limit)
    // - Relations (embed, expand)
  }
  
  applyFilters(items, filters)
  applyFullTextSearch(items, query)
  applySorting(items, sortField, order)
  applyPagination(items, page, limit)
  applyRelations(items, collection, options)
  
  // ==================== UTILITY ====================
  
  getNextId(collection)
  saveData()
  loadData()
}
```

### Collections Schema

```javascript
Database Collections:

{
  // User Management
  users: [],                    // User accounts
  addresses: [],                // User addresses
  
  // Heritage & Culture
  heritage_sites: [],           // Heritage sites/monuments
  artifacts: [],                // Cultural artifacts
  timelines: [],                // Historical timelines
  exhibitions: [],              // Exhibitions/events
  cultural_categories: [],      // Cultural classifications
  
  // User Content
  collections: [],              // Personal collections
  reviews: [],                  // User reviews & ratings
  favorites: [],                // Favorited items
  notifications: [],            // User notifications
  
  // Game System
  game_chapters: [],            // Game chapters (Sen flowers)
  game_levels: [],              // Game levels/stages
  game_characters: [],          // Game NPCs/characters
  game_progress: [],            // User game progress
  game_sessions: [],            // Active game sessions
  scan_objects: [],             // QR scannable objects
  shop_items: [],               // In-game shop items
  
  // Learning & Quests
  learning_modules: [],         // Educational content
  game_quests: [],              // Quest missions
  
  // Other
  promotions: [],               // Promotional campaigns
  ai_chat_history: []           // AI conversation logs
}
```

### Data Relationships

```
┌────────────────────────────────────────────────────┐
│            DATABASE RELATIONSHIPS                  │
└────────────────────────────────────────────────────┘

users (1) ────────> (*) game_progress
      (1) ────────> (*) collections
      (1) ────────> (*) favorites
      (1) ────────> (*) reviews
      (1) ────────> (*) notifications
      (1) ────────> (*) addresses

heritage_sites (1) ────> (*) artifacts
               (1) ────> (*) timelines
               (1) ────> (*) reviews
               (*) <───> (*) exhibitions

artifacts (*) ────────> (1) heritage_sites
          (*) ────────> (1) categories
          (*) <───────> (*) collections
          (*) ────────> (*) reviews

game_chapters (1) ─────> (*) game_levels
              (1) ─────> (*) game_progress

game_levels (*) ───────> (1) game_chapters
            (1) ───────> (*) game_sessions

game_progress (*) ─────> (1) users
              (*) ─────> (1) game_chapters

collections (*) ───────> (1) users
            (*) <──────> (*) artifacts

favorites (*) ─────────> (1) users
          
reviews (*) ───────────> (1) users
```

---

## 📡 API Layer

### Request Processing Pipeline

```
┌─────────────────────────────────────────────────┐
│          REQUEST PROCESSING FLOW                │
└─────────────────────────────────────────────────┘

1. Request Received
   ↓
2. CORS Middleware
   - Check origin
   - Allow credentials
   - Set CORS headers
   ↓
3. Body Parser
   - Parse JSON
   - Parse URL-encoded
   - Set size limits
   ↓
4. Request Logger
   - Log method + path
   - Log timestamp
   - Log user info (if auth)
   ↓
5. Query Parser
   - Parse pagination (_page, _limit)
   - Parse filters (key=value)
   - Parse search (_q)
   - Parse sorting (_sort, _order)
   - Parse relations (_embed, _expand)
   ↓
6. Authentication (protect)
   - Extract Authorization header
   - Verify Bearer token
   - Decode JWT
   - Load user from DB
   - Attach to req.user
   ↓
7. Authorization (authorize)
   - Check user role
   - Verify permissions
   - Check resource ownership
   ↓
8. Validation
   - Validate request body
   - Check required fields
   - Verify data types
   - Apply schema rules
   ↓
9. Route Matching
   - Find matching route
   - Extract path parameters
   - Call controller handler
   ↓
10. Controller Execution
    - Process request
    - Call service layer
    - Format response
    ↓
11. Response Sent
    - Set HTTP status
    - Set headers
    - Send JSON body
```

### Standard Response Format

```javascript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* resource or array */ },
  "pagination": { /* if applicable */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error"
    }
  ],
  "statusCode": 400
}

// Pagination Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔐 Authentication & Authorization

### JWT Authentication Flow

```
┌───────────────────────────────────────────────────┐
│          JWT AUTHENTICATION LIFECYCLE             │
└───────────────────────────────────────────────────┘

1. USER REGISTRATION / LOGIN
   ↓
   Credentials (email, password)
   ↓
   Validate credentials
   ↓
   Hash password (bcryptjs)
   ↓
   Generate JWT Token
   {
     id: userId,
     iat: timestamp,
     exp: timestamp + 30 days
   }
   ↓
   Sign with JWT_SECRET
   ↓
   Return token to client

2. TOKEN STORAGE (Client-side)
   ↓
   localStorage.setItem('token', token)
   OR
   sessionStorage.setItem('token', token)

3. AUTHENTICATED REQUEST
   ↓
   Include in header:
   Authorization: Bearer <token>
   ↓
   Server receives request
   ↓
   protect() middleware:
     - Extract token from header
     - Verify signature
     - Check expiration
     - Decode payload
     - Load user from DB
     - Attach to req.user
   ↓
   Continue to next middleware

4. TOKEN EXPIRATION
   ↓
   Token expires after 30 days
   ↓
   Next request fails (401)
   ↓
   Client redirects to login
   ↓
   User logs in again
```

### RBAC (Role-Based Access Control)

```javascript
// User Roles
const ROLES = {
  CUSTOMER: 'customer',      // Regular user
  ADMIN: 'admin'             // System administrator
};

// Permission Matrix
const PERMISSIONS = {
  admin: {
    // Full system access
    users: ['create', 'read', 'update', 'delete'],
    heritage_sites: ['create', 'read', 'update', 'delete'],
    artifacts: ['create', 'read', 'update', 'delete'],
    exhibitions: ['create', 'read', 'update', 'delete'],
    categories: ['create', 'read', 'update', 'delete'],
    game: {
      levels: ['create', 'read', 'update', 'delete'],
      chapters: ['create', 'read', 'update', 'delete'],
      characters: ['create', 'read', 'update', 'delete']
    },
    upload: ['create', 'delete'],
    importExport: ['export', 'import']
  },
  
  customer: {
    // Limited access
    heritage_sites: ['read'],
    artifacts: ['read'],
    exhibitions: ['read'],
    categories: ['read'],
    collections: ['create', 'read', 'update', 'delete'], // Own only
    reviews: ['create', 'read', 'update', 'delete'], // Own only
    favorites: ['create', 'read', 'delete'], // Own only
    game: ['play'], // Game access
    upload: ['avatar'] // Avatar upload only
  }
};

// Authorization Middleware Usage
router.get('/api/admin/levels', 
  protect,                    // Must be authenticated
  authorize('admin'),         // Must have admin role
  levelController.getAll
);

router.post('/api/collections', 
  protect,                    // Must be authenticated
  collectionController.create // Any authenticated user
);
```

---

## 🎮 Game System Architecture

### Game Flow

```
┌───────────────────────────────────────────────────┐
│            GAME SYSTEM ARCHITECTURE               │
└───────────────────────────────────────────────────┘

CHAPTERS (Sen Flowers)
├─ Chapter 1: Sen Hồng - Ký Ức Đầu Tiên
│  ├─ Level 1
│  ├─ Level 2
│  ├─ Level 3
│  ├─ Level 4
│  └─ Level 5
│
├─ Chapter 2: Sen Vàng - Thời Hoàng Kim
│  ├─ Level 6
│  ├─ Level 7
│  └─ ...
│
└─ Chapter 3: Sen Trắng - Di Sản Bất Tử
   └─ ...

LEVEL STRUCTURE
│
├─ Level Metadata
│  ├─ name
│  ├─ description
│  ├─ difficulty
│  ├─ rewards
│  └─ unlock_requirements
│
└─ Screens (Sequential)
   ├─ Screen 1: STORY
   │  └─ Narrative content
   │
   ├─ Screen 2: DIALOGUE
   │  └─ Character conversation
   │
   ├─ Screen 3: HIDDEN_OBJECT
   │  └─ Find items mini-game
   │
   ├─ Screen 4: QUIZ
   │  └─ Multiple choice questions
   │
   └─ Screen 5: COMPLETION
      └─ Rewards & summary

GAME SESSION
│
├─ Session created when level starts
├─ Track current screen
├─ Store collected items/clues
├─ Calculate score
├─ Time tracking
└─ Complete on final screen

PROGRESSION
│
├─ Earn Sen Petals (Stars)
├─ Earn Sen Coins (Currency)
├─ Gain Experience Points
├─ Unlock Characters
├─ Earn Badges
├─ Complete Achievements
└─ Climb Leaderboard
```

### Screen Types

```javascript
const SCREEN_TYPES = {
  STORY: {
    description: 'Narrative story-telling',
    interaction: 'Read and continue',
    autoProgress: false
  },
  
  DIALOGUE: {
    description: 'Character conversation',
    interaction: 'Read dialogue with character',
    autoProgress: false
  },
  
  HIDDEN_OBJECT: {
    description: 'Find hidden items',
    interaction: 'Tap/click to find items',
    autoProgress: false,
    requiresCompletion: true
  },
  
  QUIZ: {
    description: 'Answer questions',
    interaction: 'Select answer',
    autoProgress: false,
    requiresCorrectAnswer: true
  },
  
  MINI_GAME: {
    description: 'Interactive mini-game',
    interaction: 'Play mini-game',
    autoProgress: false,
    requiresCompletion: true
  },
  
  COMPLETION: {
    description: 'Level summary & rewards',
    interaction: 'View rewards',
    autoProgress: true
  }
};
```

---

## ⚠️ Error Handling

### Error Hierarchy

```
ApplicationError (Base)
│
├─ ValidationError (400)
│  ├─ Field validation failed
│  ├─ Type mismatch
│  ├─ Required field missing
│  └─ Format error
│
├─ AuthenticationError (401)
│  ├─ Invalid token
│  ├─ Expired token
│  ├─ Missing credentials
│  └─ Invalid credentials
│
├─ AuthorizationError (403)
│  ├─ Insufficient permissions
│  ├─ Role mismatch
│  ├─ Ownership violation
│  └─ Account inactive
│
├─ NotFoundError (404)
│  ├─ Resource not found
│  └─ Route not found
│
├─ ConflictError (409)
│  ├─ Duplicate entry
│  └─ State conflict
│
└─ ServerError (500)
   ├─ Database error
   ├─ File system error
   ├─ External API error
   └─ Unexpected error
```

### Error Handling Pattern

```javascript
// Global Error Handler (server.js)
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  const statusCode = err.statusCode || err.status || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? {
      type: err.name,
      stack: err.stack
    } : undefined
  };

  res.status(statusCode).json(response);
});

// Controller Error Handling
async controllerMethod(req, res, next) {
  try {
    // Business logic
    const result = await service.method();
    res.json(result);
  } catch (error) {
    next(error); // Pass to error handler
  }
}

// Service Layer Errors
class ServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ServiceError';
  }
}

// Usage
if (!item) {
  throw new ServiceError('Item not found', 404);
}
```

---

## 🔒 Security

### Security Measures

```javascript
// 1. JWT Secret Protection
process.env.JWT_SECRET // Strong random string

// 2. Password Hashing
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// 3. CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// 4. Input Validation
const { body, validationResult } = require('express-validator');

router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);

// 5. SQL Injection Prevention
// Using JSON file storage - not applicable
// For MongoDB: Use parameterized queries

// 6. XSS Protection
// Sanitize user input
const sanitize = (input) => {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// 7. Rate Limiting (Future)
// const rateLimit = require('express-rate-limit');
// app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }));

// 8. File Upload Security
const multer = require('multer');
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});
```

---

## ⚡ Performance & Optimization

### Optimization Strategies

```javascript
// 1. Query Optimization
// Use indexed queries
db.findOne('users', { email }) // Fast lookup

// Avoid full scans when possible
db.findAllAdvanced('artifacts', {
  filter: { category: 'pottery' }, // Filter first
  limit: 20 // Limit results
});

// 2. Pagination
// Always use pagination for large datasets
const { page = 1, limit = 20 } = req.parsedQuery;
const results = db.findAllAdvanced('artifacts', { page, limit });

// 3. Caching (Future)
// Implement Redis for frequently accessed data
// Cache user sessions
// Cache static content (categories, etc.)

// 4. Lazy Loading
// Load relations only when needed
if (req.query._embed === 'artifacts') {
  site.artifacts = db.findMany('artifacts', { heritage_site_id: site.id });
}

// 5. Database Optimization
// Keep JSON file size reasonable
// Periodic cleanup of old data
// Database indexing (MongoDB migration)

// 6. Response Compression (Future)
// const compression = require('compression');
// app.use(compression());

// 7. Static File Caching
app.use('/uploads', express.static('database/uploads', {
  maxAge: '7d' // Cache for 7 days
}));

// 8. Async Operations
// Use async/await throughout
// Don't block event loop
async processRequest() {
  const results = await Promise.all([
    db.findById('users', userId),
    db.findMany('orders', { userId })
  ]);
}
```

### Performance Monitoring

```javascript
// Request Duration Logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

---

## 📊 Database Query Examples

### Basic Queries

```javascript
// Find all
const users = db.findAll('users');

// Find by ID
const user = db.findById('users', 1);

// Find one matching
const user = db.findOne('users', { email: 'user@example.com' });

// Find many matching
const artifacts = db.findMany('artifacts', { category: 'pottery' });
```

### Advanced Queries

```javascript
// Pagination + Filtering + Sorting
const result = db.findAllAdvanced('artifacts', {
  filter: {
    category: 'pottery',
    condition: 'excellent',
    rating_gte: 4
  },
  q: 'ancient',           // Full-text search
  sort: 'rating',         // Sort by rating
  order: 'desc',          // Descending
  page: 1,                // Page 1
  limit: 10               // 10 items per page
});

// Response includes:
// {
//   data: [...],
//   pagination: {
//     page: 1,
//     limit: 10,
//     total: 45,
//     totalPages: 5,
//     hasNext: true,
//     hasPrev: false
//   }
// }
```

---

## 🧪 Testing Strategy

### Test Pyramid

```
           ╱╲
          ╱  ╲
         ╱ E2E ╲           ← End-to-End Tests (Few)
        ╱────────╲
       ╱          ╲
      ╱Integration ╲       ← Integration Tests (Some)
     ╱──────────────╲
    ╱                ╲
   ╱   Unit Tests     ╲    ← Unit Tests (Many)
  ╱────────────────────╲
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── game.service.test.js
│   │   ├── heritage.service.test.js
│   │   └── user.service.test.js
│   ├── utils/
│   │   ├── helpers.test.js
│   │   └── validators.test.js
│   └── middleware/
│       ├── auth.test.js
│       └── query.test.js
│
├── integration/
│   ├── api/
│   │   ├── auth.api.test.js
│   │   ├── game.api.test.js
│   │   └── heritage.api.test.js
│   └── database/
│       └── crud.test.js
│
└── e2e/
    ├── user-journey.test.js
    └── game-flow.test.js
```

---

## 📝 Development Guidelines

### Code Style

```javascript
// Use ES6+ features
const { id } = req.params;
const artifacts = [...existingArtifacts, newArtifact];
const enriched = items.map(item => ({ ...item, extraData }));

// Async/Await over Promises
async getUser(id) {
  const user = await db.findById('users', id);
  return user;
}

// Descriptive naming
const calculateAverageRating = (reviews) => { ... };
const isUserAuthenticated = () => { ... };

// Error handling
try {
  const result = await service.method();
  res.json(result);
} catch (error) {
  next(error);
}

// Comments for complex logic
// Calculate distance using Haversine formula
const distance = calculateDistance(lat1, lon1, lat2, lon2);
```

### Git Workflow

```bash
# Feature branches
git checkout -b feature/game-badges
git commit -m "feat: add badge system to game"
git push origin feature/game-badges

# Commit message format
# feat: new feature
# fix: bug fix
# docs: documentation
# refactor: code refactoring
# test: adding tests
# chore: maintenance
```

---

## 🚀 Deployment

### Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRE=30d

# Database
DATABASE_PATH=./database/db.json

# CORS
CLIENT_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=2097152
UPLOAD_PATH=./database/uploads
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure CORS for specific origins
- [ ] Enable HTTPS
- [ ] Set up rate limiting
- [ ] Enable compression
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Database backup strategy
- [ ] Error tracking (Sentry, etc.)

---

## 📚 Additional Resources

- **API Documentation:** See `API_ENDPOINTS.md`
- **Game System:** See `GAME_SYSTEM_README.md`
- **Contributing:** See `CONTRIBUTING.md`
- **Sample Data:** See `Sample Level Data (Ký Ức Chú Tễu).md`

---

**Architecture Version:** 2.0.0  
**Last Updated:** December 3, 2025  
**Pattern:** MVC + Service Layer  
**Status:** Production Ready  
**Maintained by:** Sen Development Team
