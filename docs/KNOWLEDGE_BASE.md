# ✅ **KNOWLEDGE BASE - HOÀN CHỈNH**

## **📚 KNOWLEDGE BASE LÀ GÌ?**

Knowledge Base là **kiến thức riêng** cho từng Level, được inject vào System Prompt để AI ưu tiên sử dụng trước khi tìm trong MongoDB.

---

## **🎯 TẠI SAO CẦN KNOWLEDGE BASE?**

### **Vấn đề:**
```
User chơi Level "Huyền thoại Rồng Tiên"
User hỏi: "Kể về Lạc Long Quân"

Nếu KHÔNG có Knowledge Base:
→ AI tìm trong MongoDB
→ Có thể tìm thấy nhiều thông tin khác nhau
→ Không đảm bảo phù hợp với nội dung Level

Nếu CÓ Knowledge Base:
→ AI đọc kiến thức riêng của Level trước
→ Trả lời đúng theo storyline của Level
→ Nhất quán với game design
```

---

## **🔄 LUỒNG XỬ LÝ**

```
1. User chơi Level 1: "Huyền thoại Rồng Tiên"
   ↓
2. Node.js lấy Level từ DB:
   {
     id: 1,
     name: "Huyền thoại Rồng Tiên",
     knowledgeBase: "Lạc Long Quân thuộc nòi Rồng, kết duyên với Âu Cơ..."
   }
   ↓
3. Node.js build System Prompt:
   ```
   Bạn là Chú Tễu...
   
   📚 KIẾN THỨC RIÊNG (ƯU TIÊN CAO):
   Lạc Long Quân thuộc nòi Rồng, kết duyên với Âu Cơ...
   
   📝 HƯỚNG DẪN:
   - ⭐ ƯU TIÊN SỬ DỤNG KIẾN THỨC RIÊNG ở trên trước khi tìm trong database
   ```
   ↓
4. Gửi sang Python với System Prompt
   ↓
5. Python AI:
   - Đọc System Prompt
   - Thấy có KIẾN THỨC RIÊNG
   - Ưu tiên dùng kiến thức này
   - Nếu không đủ, mới tìm MongoDB
   ↓
6. Trả về câu trả lời đúng context Level
```

---

## **📝 CẤU TRÚC DATABASE**

### **`game_levels` collection:**
```json
{
  "id": 1,
  "name": "Huyền thoại Rồng Tiên",
  "chapterId": 1,
  "description": "Câu chuyện về cội nguồn dân tộc Việt Nam",
  "knowledgeBase": "Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương. Ông kết duyên với Âu Cơ, con gái Đế Lai. Họ sinh ra 100 người con, sau đó chia tay: 50 người theo mẹ lên núi, 50 người theo cha xuống biển. Đây là nguồn gốc của dân tộc Việt Nam.",
  "aiCharacterId": 1,
  "heritageSiteId": null,
  "screens": [...]
}
```

### **Ví dụ khác:**
```json
{
  "id": 5,
  "name": "Hoàng Thành Thăng Long",
  "chapterId": 2,
  "knowledgeBase": "Hoàng Thành Thăng Long được xây dựng năm 1010 dưới triều Lý Thái Tổ. Đây là trung tâm chính trị của Việt Nam trong hơn 1000 năm. Năm 2010, di tích được UNESCO công nhận là Di sản Văn hóa Thế giới.",
  "heritageSiteId": 2
}
```

---

## **💻 CODE IMPLEMENTATION**

### **1. `getCharacterContext()` - Lấy Knowledge Base**

```javascript
async getCharacterContext(context, userId) {
  let level = null;
  
  if (context.levelId) {
    level = await db.findById("game_levels", context.levelId);
  }
  
  return {
    // ... character info
    level: level ? {
      id: level.id,
      name: level.name,
      description: level.description,
      knowledgeBase: level.knowledgeBase || null  // ⭐ LẤY KNOWLEDGE BASE
    } : null,
    // ...
  };
}
```

### **2. `_buildSystemPrompt()` - Inject vào Prompt**

```javascript
_buildSystemPrompt(character) {
  let prompt = "";
  
  // ... persona, speaking style, context
  
  // 4. ⭐ KNOWLEDGE BASE
  if (character.level && character.level.knowledgeBase) {
    prompt += `📚 KIẾN THỨC RIÊNG (ƯU TIÊN CAO):\n${character.level.knowledgeBase}\n\n`;
  }
  
  // 6. INSTRUCTIONS
  prompt += `📝 HƯỚNG DẪN:\n`;
  
  if (character.level && character.level.knowledgeBase) {
    prompt += `- ⭐ ƯU TIÊN SỬ DỤNG KIẾN THỨC RIÊNG ở trên trước khi tìm trong database\n`;
  }
  
  return prompt;
}
```

### **3. `chat()` - Inject vào History**

```javascript
async chat(userId, message, context) {
  // 1. Lấy character (có knowledge base)
  const character = await this.getCharacterContext(context, userId);
  
  // 2. Lấy history
  const history = await this._getFormattedHistory(userId, context.characterId);
  
  // 3. ⭐ BUILD SYSTEM PROMPT
  const systemPrompt = this._buildSystemPrompt(character);
  const systemMessage = {
    role: "system",
    content: systemPrompt
  };
  
  // 4. Inject vào đầu history
  const enrichedHistory = [systemMessage, ...history];
  
  // 5. Gửi sang Python
  const response = await axios.post(PYTHON_SERVICE_URL, {
    user_input: message,
    history: enrichedHistory  // ⭐ CÓ KNOWLEDGE BASE
  });
  
  return response;
}
```

---

## **🎨 VÍ DỤ SYSTEM PROMPT HOÀN CHỈNH**

```
Bạn là Chú Tễu. Ở trạng thái mất trí nhớ, bạn ngơ ngác và hay hỏi lại. 
Khi hồi phục, bạn vui vẻ, hay cười 'hi hi' và kể chuyện tiếu lâm.

Phong cách giao tiếp: Vui vẻ, dân dã, dùng từ địa phương Bắc Bộ

📍 CONTEXT:
- Chapter: "Hào Khí Lạc Hồng" (Văn Minh Sông Hồng)
- Level: "Huyền thoại Rồng Tiên"
- Mô tả: Câu chuyện về cội nguồn dân tộc Việt Nam

📚 KIẾN THỨC RIÊNG (ƯU TIÊN CAO):
Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương. Ông kết duyên với Âu Cơ, con gái Đế Lai. Họ sinh ra 100 người con, sau đó chia tay: 50 người theo mẹ lên núi, 50 người theo cha xuống biển. Đây là nguồn gốc của dân tộc Việt Nam.

🔍 Nguồn thông tin: heritage_sites, artifacts, timelines

📝 HƯỚNG DẪN:
- Trả lời theo đúng persona và phong cách của Chú Tễu
- ⭐ ƯU TIÊN SỬ DỤNG KIẾN THỨC RIÊNG ở trên trước khi tìm trong database
- Giữ câu trả lời ngắn gọn, dễ hiểu (2-3 câu)
- Sử dụng emoji phù hợp với tính cách
- Liên hệ với nội dung level "Huyền thoại Rồng Tiên" khi có thể
```

---

## **🧪 TEST CASES**

### **Test 1: Level CÓ Knowledge Base**

```javascript
// Request
POST /api/ai/chat
{
  "message": "Kể về Lạc Long Quân",
  "context": {
    "levelId": 1  // Level "Huyền thoại Rồng Tiên"
  }
}

// Expected Response
{
  "message": "Hi hi, để chú kể cho bác nghe nhé! Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương. Ông kết duyên với Âu Cơ và sinh ra 100 người con, là tổ tiên của dân tộc Việt Nam đó bác! 😄"
}

// ✅ Trả lời đúng theo Knowledge Base của Level
```

### **Test 2: Level KHÔNG CÓ Knowledge Base**

```javascript
// Request
POST /api/ai/chat
{
  "message": "Hoàng Thành ở đâu?",
  "context": {
    "levelId": 10  // Level không có knowledgeBase
  }
}

// Expected Response
{
  "message": "Hoàng Thành Thăng Long nằm ở số 19C Hoàng Diệu, Ba Đình, Hà Nội bác nhé!"
}

// ✅ Tìm trong MongoDB vì không có Knowledge Base
```

### **Test 3: Chat tự do (không có Level)**

```javascript
// Request
POST /api/ai/chat
{
  "message": "Xin chào",
  "context": {}
}

// System Prompt:
// - KHÔNG CÓ Knowledge Base
// - KHÔNG CÓ Level context
// - Chỉ có persona của character mặc định (Sen)

// ✅ Hoạt động bình thường như chatbot thông thường
```

---

## **📊 SO SÁNH**

| Tình huống | Có Knowledge Base | Không có Knowledge Base |
|------------|-------------------|-------------------------|
| **Nguồn thông tin** | Knowledge Base → MongoDB | MongoDB only |
| **Độ chính xác** | Cao (theo game design) | Trung bình (tùy data) |
| **Nhất quán** | Cao | Thấp |
| **Use case** | Game levels có storyline | Chat tự do, Q&A chung |

---

## **✅ CHECKLIST**

- ✅ **Database**: Thêm field `knowledgeBase` vào `game_levels`
- ✅ **getCharacterContext**: Lấy `level.knowledgeBase`
- ✅ **_buildSystemPrompt**: Inject knowledge base vào prompt
- ✅ **chat**: Inject system prompt vào history
- ✅ **Python AI**: Nhận và sử dụng knowledge base

---

## **🎯 KẾT LUẬN**

**Knowledge Base đã được xử lý HOÀN CHỈNH:**

1. ✅ Lưu trong DB (`game_levels.knowledgeBase`)
2. ✅ Lấy ra khi user chơi level
3. ✅ Inject vào System Prompt
4. ✅ Gửi sang Python AI
5. ✅ AI ưu tiên sử dụng trước MongoDB

**Python AI KHÔNG CẦN thay đổi gì!**

Mọi thứ được xử lý ở Node.js layer, Python chỉ cần đọc System Prompt và làm theo instructions.

**Hoàn hảo!** 🚀
