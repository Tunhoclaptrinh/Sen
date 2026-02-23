# 📖 **CHI TIẾT: Node.js - Lấy KB từ Database**

## **🎯 MỤC ĐÍCH**

Lấy **đầy đủ thông tin** về character, level, chapter và knowledge base từ database để inject vào system prompt.

---

## **📊 LUỒNG XỬ LÝ**

```
User Request
    ↓
chat(userId, message, context)
    ↓
getCharacterWithGameContext(context, userId)
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 1: Lấy Character Info              │
│ ─────────────────────────────────────── │
│ getCharacterContext(context, userId)    │
│                                         │
│ Input: { characterId: 1, levelId: 1 }  │
│                                         │
│ Logic:                                  │
│ 1. Tìm theo characterId                │
│ 2. Nếu không có, lấy từ level.aiCharId  │
│ 3. Nếu vẫn không, lấy default character│
│ 4. Fallback: Sen                        │
│                                         │
│ Output: {                               │
│   id: 1,                                │
│   name: "Chú Tễu",                      │
│   persona: "Bạn là Chú Tễu...",         │
│   speakingStyle: "Vui vẻ, dân dã...",   │
│   avatar: "https://..."                 │
│ }                                       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 2: Lấy Level Info + KB ⭐          │
│ ─────────────────────────────────────── │
│ if (context.levelId) {                  │
│   levelData = db.findById(              │
│     "game_levels",                      │
│     context.levelId                     │
│   )                                     │
│ }                                       │
│                                         │
│ Output: {                               │
│   id: 1,                                │
│   name: "Huyền thoại Rồng Tiên",        │
│   description: "Câu chuyện...",         │
│   knowledgeBase: "Lạc Long Quân..."  ⭐ │
│   heritageSiteId: null                  │
│ }                                       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 3: Lấy Chapter Info                │
│ ─────────────────────────────────────── │
│ if (level && level.chapterId) {         │
│   chapterData = db.findById(            │
│     "game_chapters",                    │
│     level.chapterId                     │
│   )                                     │
│ }                                       │
│                                         │
│ Output: {                               │
│   id: 1,                                │
│   name: "Hào Khí Lạc Hồng",             │
│   theme: "Văn Minh Sông Hồng",          │
│   description: "..."                    │
│ }                                       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 4: Xác định Collections            │
│ ─────────────────────────────────────── │
│ _determineCollections(chapter, level)   │
│                                         │
│ Logic:                                  │
│ 1. Luôn có "heritage_sites"             │
│ 2. Nếu theme có "văn minh/lịch sử"      │
│    → Thêm "artifacts", "timelines"      │
│ 3. Nếu theme có "văn hóa/nghệ thuật"    │
│    → Thêm "exhibitions"                 │
│ 4. Nếu có heritageSiteId                │
│    → Ưu tiên "heritage_site_{id}"       │
│                                         │
│ Output: [                               │
│   "heritage_sites",                     │
│   "artifacts",                          │
│   "timelines"                           │
│ ]                                       │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ BƯỚC 5: Merge tất cả thông tin          │
│ ─────────────────────────────────────── │
│ return {                                │
│   ...character,  // id, name, persona   │
│   level: level,  // KB ở đây ⭐         │
│   chapter: chapter,                     │
│   collections: collections              │
│ }                                       │
└─────────────────────────────────────────┘
    ↓
Final Output gửi cho _buildSystemPrompt()
```

---

## **💻 CODE CHI TIẾT**

### **1. Hàm chính: `getCharacterWithGameContext()`**

```javascript
async getCharacterWithGameContext(context, userId) {
  // BƯỚC 1: Lấy character cơ bản
  const character = await this.getCharacterContext(context, userId);

  // BƯỚC 2: ⭐ LẤY LEVEL INFO (bao gồm Knowledge Base)
  let level = null;
  if (context.levelId) {
    const levelData = await db.findById("game_levels", context.levelId);
    if (levelData) {
      level = {
        id: levelData.id,
        name: levelData.name,
        description: levelData.description,
        knowledgeBase: levelData.knowledgeBase || null,  // ⭐ KB Ở ĐÂY
        heritageSiteId: levelData.heritageSiteId || null
      };
    }
  }

  // BƯỚC 3: ⭐ LẤY CHAPTER INFO
  let chapter = null;
  if (level && level.chapterId) {
    const chapterData = await db.findById("game_chapters", level.chapterId);
    if (chapterData) {
      chapter = {
        id: chapterData.id,
        name: chapterData.name,
        theme: chapterData.theme,
        description: chapterData.description
      };
    }
  }

  // BƯỚC 4: ⭐ XÁC ĐỊNH COLLECTIONS
  const collections = this._determineCollections(chapter, level);

  // BƯỚC 5: Return đầy đủ
  return {
    ...character,
    level: level,
    chapter: chapter,
    collections: collections
  };
}
```

---

### **2. Hàm phụ: `_determineCollections()`**

```javascript
_determineCollections(chapter, level) {
  const collections = [];

  // Luôn có heritage_sites
  collections.push("heritage_sites");

  // Dựa vào chapter theme
  if (chapter) {
    const theme = chapter.theme?.toLowerCase() || "";
    
    if (theme.includes("văn minh") || theme.includes("lịch sử")) {
      collections.push("artifacts", "timelines");
    }
    
    if (theme.includes("văn hóa") || theme.includes("nghệ thuật")) {
      collections.push("exhibitions");
    }
  }

  // Nếu level có heritageSiteId cụ thể
  if (level && level.heritageSiteId) {
    collections.unshift(`heritage_site_${level.heritageSiteId}`);
  }

  // Loại bỏ trùng lặp
  return [...new Set(collections)];
}
```

---

## **📝 VÍ DỤ CỤ THỂ**

### **Input:**
```javascript
context = {
  levelId: 1,
  characterId: 1
}
```

### **Database:**

**`game_levels` (id: 1):**
```json
{
  "id": 1,
  "name": "Huyền thoại Rồng Tiên",
  "chapterId": 1,
  "description": "Câu chuyện về cội nguồn dân tộc",
  "knowledgeBase": "Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương. Ông kết duyên với Âu Cơ, con gái Đế Lai. Họ sinh ra 100 người con, sau đó chia tay: 50 người theo mẹ lên núi, 50 người theo cha xuống biển.",
  "aiCharacterId": 1,
  "heritageSiteId": null
}
```

**`game_chapters` (id: 1):**
```json
{
  "id": 1,
  "name": "Hào Khí Lạc Hồng",
  "theme": "Văn Minh Sông Hồng",
  "description": "Khám phá nền văn minh cổ đại..."
}
```

**`game_characters` (id: 1):**
```json
{
  "id": 1,
  "name": "Chú Tễu",
  "persona": "Bạn là Chú Tễu. Ở trạng thái mất trí nhớ, bạn ngơ ngác và hay hỏi lại. Khi hồi phục, bạn vui vẻ, hay cười 'hi hi' và kể chuyện tiếu lâm.",
  "speakingStyle": "Vui vẻ, dân dã, dùng từ địa phương Bắc Bộ",
  "avatar": "https://example.com/chu-teu.png"
}
```

---

### **Output:**

```javascript
{
  // Character info
  id: 1,
  name: "Chú Tễu",
  persona: "Bạn là Chú Tễu. Ở trạng thái mất trí nhớ...",
  speakingStyle: "Vui vẻ, dân dã, dùng từ địa phương Bắc Bộ",
  avatar: "https://example.com/chu-teu.png",
  
  // ⭐ Level info (có KB)
  level: {
    id: 1,
    name: "Huyền thoại Rồng Tiên",
    description: "Câu chuyện về cội nguồn dân tộc",
    knowledgeBase: "Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương...",  // ⭐ KB
    heritageSiteId: null
  },
  
  // Chapter info
  chapter: {
    id: 1,
    name: "Hào Khí Lạc Hồng",
    theme: "Văn Minh Sông Hồng",
    description: "Khám phá nền văn minh cổ đại..."
  },
  
  // Collections
  collections: [
    "heritage_sites",
    "artifacts",      // Vì theme có "Văn Minh"
    "timelines"       // Vì theme có "Văn Minh"
  ]
}
```

---

## **🔄 LUỒNG TIẾP THEO**

Output này sẽ được gửi tới `_buildSystemPrompt()`:

```javascript
const character = await this.getCharacterWithGameContext(context, userId);
// character có đầy đủ: persona, level, chapter, KB, collections

const systemPrompt = this._buildSystemPrompt(character);
// systemPrompt sẽ chứa:
// - Persona: "Bạn là Chú Tễu..."
// - Level context: "Level: Huyền thoại Rồng Tiên"
// - Chapter context: "Chapter: Hào Khí Lạc Hồng"
// - ⭐ KB: "📚 KIẾN THỨC RIÊNG: Lạc Long Quân thuộc nòi Rồng..."
// - Collections: "🔍 Nguồn: heritage_sites, artifacts, timelines"
```

---

## **✅ CHECKLIST**

- ✅ Lấy character từ DB
- ✅ Lấy level từ DB (có `knowledgeBase`)
- ✅ Lấy chapter từ DB
- ✅ Xác định collections dựa trên theme
- ✅ Merge tất cả thông tin
- ✅ Return object đầy đủ cho system prompt

---

## **🎯 KEY POINTS**

1. **KB nằm trong `game_levels.knowledgeBase`**
2. **Hàm `getCharacterWithGameContext()` lấy KB từ DB**
3. **KB được truyền qua `character.level.knowledgeBase`**
4. **`_buildSystemPrompt()` sẽ inject KB vào system message**
5. **Python AI nhận KB qua `history[0].content`**

**Perfect!** 🚀
