const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const db = require("../config/database");

const DB_PATH = path.join(__dirname, "../database/db.json");
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL;

// --- KNOWLEDGE BASE (STRUCTURED BY CHAPTER -> LEVEL) ---
const CHAPTER_KNOWLEDGE_BASE = {
  // CHAPTER 1: HÀO KHÍ LẠC HỒNG (Văn Minh Sông Hồng)
  1: {
    1: "Lạc Long Quân thuộc nòi Rồng, là con trai của Kinh Dương Vương và Long Nữ. Ông kết duyên với Âu Cơ, con gái của Đế Lai thuộc nòi Tiên. Họ sinh ra 100 người con, được gọi là Trăm trứng (Bách Việt). Sau đó, do khác giống loài, họ chia tay: 50 người con theo mẹ lên núi, 50 người theo cha xuống biển. Người con cả lên núi làm vua, lấy hiệu là Hùng Vương, mở đầu nước Văn Lang. Đây là nguồn gốc truyền thuyết về dân tộc Việt Nam, thể hiện sự kết hợp giữa Rồng (biển) và Tiên (núi).",
    2: "Trống đồng Đông Sơn là biểu tượng đỉnh cao của nền văn hóa Đông Sơn (thế kỷ VII TCN - thế kỷ I-II SCN), tiêu biểu cho nền văn minh sông Hồng. Mặt trống thường có hình ngôi sao nhiều cánh ở giữa (tượng trưng cho mặt trời), xung quanh là các vòng hoa văn hình học, hình chim Lạc bay ngược chiều kim đồng hồ, và cảnh sinh hoạt của con người như giã gạo, múa hát, đua thuyền. Trống đồng vừa là nhạc khí trong lễ hội, vừa là biểu tượng quyền lực của các thủ lĩnh thời Hùng Vương.",
    3: "Lịch sử dựng nước và giữ nước của Đại Việt gắn liền với các triều đại phong kiến huy hoàng. Nhà Lý (1009-1225) mở đầu với sự kiện Lý Thái Tổ dời đô về Thăng Long (1010). Nhà Trần (1225-1400) nổi tiếng với 'Hào khí Đông A' và 3 lần chiến thắng quân Nguyên Mông. Nhà Hậu Lê (1428-1789) được thành lập sau khi Lê Lợi lãnh đạo khởi nghĩa Lam Sơn thắng lợi, mở ra giai đoạn thịnh trị lâu dài nhất. Các triều đại này đã củng cố nền độc lập và xây dựng bản sắc văn hóa dân tộc rực rỡ.",
    4: "Văn hóa làng xã là nền tảng của văn hóa Việt Nam, gắn liền với hình ảnh 'Cây đa, bến nước, sân đình'. Đình làng là nơi thờ Thành Hoàng và tổ chức lễ hội chung. Văn hóa làng xã còn thể hiện qua các làn điệu dân ca như Quan họ Bắc Ninh (Kinh Bắc), hay nếp sống cộng đồng tại các làng nghề, phố cổ như Hội An (Quảng Nam). Tính cộng đồng, tự quản và trọng tình nghĩa là những đặc trưng cơ bản của văn hóa làng xã."
  },

  // CHAPTER 2: DẤU ẤN VÀNG SON (Giao Thoa Văn Hóa)
  2: {
    // Level 1: Phố Cổ Hội An (ID 7)
    5: "Phố cổ Hội An là thương cảng sầm uất, nơi giao thoa văn hóa Việt - Hoa - Nhật - Phương Tây từ thế kỷ 16-17. Nổi bật với những ngôi nhà cổ mái ngói rêu phong, hội quán người Hoa rực rỡ và biểu tượng Chùa Cầu (Lai Viễn Kiều) do thương nhân Nhật Bản xây dựng. Đây là di sản văn hóa thế giới được UNESCO công nhận, minh chứng cho sự hòa nhập văn hóa nhưng vẫn giữ gìn bản sắc.",

    // Level 2: Nhã nhạc Cung đình Huế (ID 8)
    6: "Nhã nhạc cung đình Huế là di sản văn hóa phi vật thể của nhân loại (UNESCO, 2003), là đỉnh cao âm nhạc bác học của các triều đại phong kiến Việt Nam. Nhã nhạc thường được biểu diễn trong các dịp lễ trọng đại như lễ Tế Giao, lễ đăng quang hay yến tiệc cung đình, thể hiện sự trang nghiêm, tao nhã và khát vọng thái bình thịnh trị của triều Nguyễn.",

    // Level 3: Nghệ thuật Chăm Pa (ID 9)
    7: "Thánh địa Mỹ Sơn (Quảng Nam) là quần thể di sản kiến trúc Chăm Pa độc đáo, nơi thờ thần Shiva của ấn độ giáo. Các tháp Chàm được xây bằng gạch nung với kỹ thuật điêu khắc tinh xảo trực tiếp lên gạch, thể hiện đỉnh cao nghệ thuật kiến trúc và tâm linh của vương quốc Chăm Pa cổ. Mặc dù bị chiến tranh tàn phá, vẻ đẹp huyền bí của Mỹ Sơn vẫn làm say lòng người.",

    // Level 4: Áo Dài Năm Thân (ID 10)
    8: "Áo dài ngũ thân (năm thân) ra đời dưới thời chúa Nguyễn Phúc Khoát (1744) nhằm thống nhất trang phục Đàng Trong. Áo gồm 4 thân chính tượng trưng cho tứ thân phụ mẫu (cha mẹ mình và cha mẹ người phối ngẫu), và 1 thân con nhỏ bên trong tượng trưng cho bản thân người mặc (khuyên răn đạo làm người nhỏ bé trước cha mẹ). Năm khuy áo tượng trưng cho ngũ thường: Nhân, Lễ, Nghĩa, Trí, Tín.",

    // Level 5: Kiến trúc thuộc địa (ID 11)
    9: "Kiến trúc thuộc địa Pháp tại Việt Nam (cuối thế kỷ 19 - đầu 20) để lại dấu ấn sâu sắc qua các công trình như Nhà Hát Lớn, Bưu điện, Ga Hà Nội. Các kiến trúc sư Pháp, đặc biệt là Ernest Hébrard, đã sáng tạo ra phong cách kiến trúc Đông Dương (Indochine Style) - sự kết hợp tinh tế giữa vẻ đẹp cổ điển Phương Tây với mái ngói, hoa văn trang trí Á Đông để phù hợp với khí hậu nhiệt đới gió mùa.",

    // Level 6: Sự ra đời chữ Quốc Ngữ (ID 12)
    10: "Chữ Quốc ngữ là hệ thống chữ viết dùng ký tự Latinh để ghi âm tiếng Việt, do các giáo sĩ phương Tây (tiêu biểu là Alexandre de Rhodes) và người Việt chung tay xây dựng từ thế kỷ 17. Ban đầu dùng cho mục đích truyền giáo, sau đó trở thành công cụ đắc lực để canh tân văn hóa, mở mang dân trí vào đầu thế kỷ 20. Sự ra đời của chữ Quốc ngữ là bước ngoặt lịch sử giúp tiếng Việt dễ học, dễ phổ biến và phát triển mạnh mẽ như ngày nay."
  },

  // CHAPTER 3: ĐẠI VIỆT OAI HÙNG (Lịch Sử Kháng Chiến)
  3: {
    7: "Nhà tù Hỏa Lò được thực dân Pháp xây dựng năm 1896 tại Hà Nội, ban đầu gọi là Maison Centrale. Đây là nơi giam giữ và tra tấn các chiến sĩ cách mạng Việt Nam. Tù nhân bị xiềng xích, hành hạ dã man, nhiều người hy sinh tại đây. Những người cộng sản kiên cường như Võ Thị Sáu, Nguyễn Văn Cừ đã từng bị giam tại đây. Trong kháng chiến chống Mỹ, phi công Mỹ bị bắn rơi cũng bị giam tại đây, họ gọi là 'Hanoi Hilton' một cách mỉa mai. Ngày nay, Hỏa Lò là bảo tàng, minh chứng cho tội ác thực dân và ý chí bất khuất của dân tộc Việt Nam.",
    8: "Lăng Chủ tịch Hồ Chí Minh nằm tại Quảng trường Ba Đình, Hà Nội, được khởi công xây dựng ngày 2/9/1973 và hoàn thành ngày 29/8/1975. Lăng cao 21,6m, thiết kế kết hợp kiến trúc truyền thống Việt Nam (hình hoa sen) và hiện đại. Đây là nơi an táng thi hài Chủ tịch Hồ Chí Minh - vị lãnh tụ vĩ đại của dân tộc Việt Nam. Chủ tịch Hồ Chí Minh sinh năm 1890, là người sáng lập Đảng Cộng sản Việt Nam, lãnh đạo cách mạng giải phóng dân tộc. Người đọc Tuyên ngôn độc lập ngày 2/9/1945 tại Quảng trường Ba Đình, khai sinh nước Việt Nam Dân chủ Cộng hòa. Lăng Bác là nơi thiêng liêng, biểu tượng của lòng kính yêu với Người."
  }
};

class AIService {
  constructor() {
    this.API_KEY = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    this.MODEL = process.env.AI_MODEL || "sen_gpt-4o-mini";
    this.API_URL = process.env.OPENAI_API_KEY
      ? "https://api.openai.com/v1/chat/completions"
      : "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
  }

  // async chat(userId, message, context = {}) {
  //     const cleanMessage = message.trim();
  //     try {
  //       // LOG 1: Kiểm tra xem hàm chat đã được gọi chưa
  //       console.log("\n--- [DEBUG] BẮT ĐẦU GỌI AI SERVICE ---");

  //       // Lấy nhân vật
  //       const character = await this.getCharacterContext(context, userId);

  //       // Lấy lịch sử (Chú ý tên biến ở đây)
  //       const historyData = await this._getFormattedHistory(userId, context.characterId);

  //       // LOG 2: ĐÂY LÀ ĐOẠN BẠN ĐANG CẦN KIỂM TRA
  //       console.log("👉 Input người dùng:", cleanMessage);
  //       console.log("👉 History gửi sang Python (5 câu gần nhất):", JSON.stringify(historyData, null, 2));

  //       // Gọi sang Python
  //       const response = await axios.post(PYTHON_SERVICE_URL, {
  //         user_input: cleanMessage,
  //         history: historyData // Gửi mảng đã format
  //       }, { timeout: 15000 });

  //       // LOG 3: Kiểm tra kết quả từ Python trả về
  //       console.log("✅ Python Response:", response.data.answer.substring(0, 50) + "...");

  //       const { answer, rewritten_query, route } = response.data;

  //       // Lưu vào DB
  //       const chatRecord = await db.create('ai_chat_history', {
  //         user_id: userId,
  //         level_id: context.levelId || null,
  //         character_id: context.characterId || 1,
  //         message: cleanMessage,
  //         response: answer,
  //         context: { ...context, rewritten: rewritten_query, route: route },
  //         created_at: new Date().toISOString()
  //       });

  //       return { success: true, data: { message: answer, character, timestamp: chatRecord.created_at } };

  //     } catch (error) {
  //       // LOG 4: Nếu có lỗi, nó sẽ hiện ở đây thay vì chỉ hiện tin nhắn bảo trì
  //       console.error('❌ LỖI TẠI AI SERVICE:', error.message);
  //       return {
  //         success: false,
  //         message: 'Dịch vụ AI đang bảo trì, Sen sẽ quay lại sớm!',
  //         statusCode: 500
  //       };
  //     }
  //   }

  /**
   * CHAT CHÍNH: Kết nối NodeJS - db.json - FastAPI
   */
  async chat(userId, message, context = {}) {
    // Sanitize user input - Simple validation
    const cleanMessage = message
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();

    if (!cleanMessage) return { success: false, message: "Nội dung trống" };
    if (cleanMessage.length > 500) {
      return {
        success: false,
        message: "Message quá dài (tối đa 500 ký tự)",
      };
    }

    try {
      // 1. ⭐ LẤY NHÂN VẬT + GAME CONTEXT (Level, Chapter, KB, Collections)
      const character = await this.getCharacterWithGameContext(context, userId);

      // 2. LẤY LỊCH SỬ CHO REFLECTION
      const history = await this._getFormattedHistory(
        userId,
        context.characterId,
        context.levelId || null // ⭐ QUAN TRỌNG: Lọc theo Level ID để độc lập history
      );

      // 2.5. ⭐ AUTO-DETECT: Xác định user đang hỏi về gì (QUIZ hoặc HIDDEN_OBJECT)
      const hintService = require('./hint.service');
      let detectedItem = null;
      let hintLevel = 0;

      if (character.level && character.level.screens && character.level.screens.length > 0) {
        // Auto-detect intent
        detectedItem = hintService.autoDetectUserIntent(cleanMessage, character.level.screens);

        if (detectedItem) {
          // Lấy hint level cho item này
          hintLevel = await hintService.getHintLevel(
            userId,
            context.levelId,
            detectedItem.itemId
          );

          console.log(`🎯 [AI Detection] User đang hỏi về ${detectedItem.type}: "${detectedItem.itemName || detectedItem.question}" (Hint Level: ${hintLevel})`);
        }
      }

      // 3. ⭐ INJECT PERSONA & KNOWLEDGE BASE & AUTO-DETECTED CONTEXT VÀO HISTORY
      let systemPrompt = this._buildSystemPrompt(character);

      // 3.5 ⭐ THÊM AUTO-DETECTED CONTEXT (nếu có)
      if (detectedItem) {
        const itemContextPrompt = hintService.buildItemContextPrompt(detectedItem, hintLevel);
        systemPrompt += itemContextPrompt;
      }

      const systemMessage = {
        role: "system",
        content: systemPrompt
      };

      // Thêm system message vào đầu history
      const enrichedHistory = [systemMessage, ...history];

      // 4. GỌI SANG PYTHON FASTAPI (Render có thể cold start, cần timeout 60s)
      const response = await axios.post(
        PYTHON_SERVICE_URL.trim(),
        {
          user_input: cleanMessage,
          history: enrichedHistory,  // ⭐ GỬI HISTORY ĐÃ CÓ PERSONA + AUTO-DETECTED CONTEXT
        },
        { timeout: 60000 }
      );

      const { answer, rewritten_query: rewrittenQuery, route, score, audio_base64: audioBase64, emotion } = response.data;

      // [FEATURE] Extract Link from Answer to return as Recommendation Card (Rich Response)
      let finalAnswer = answer;
      let recommendation = null;

      // Regex to find [Title](URL) and optional preceding text like "cậu vui lòng truy cập trang chủ tại đây: 👉"
      // Captures: 0: Full match including prefix, 1: Title, 2: URL
      const linkMatch = answer.match(/(?:(?:cậu|bạn|mình|anh|chị|em)\s+(?:vui\s+lòng|làm\s+ơn|hãy|có\s+thể|muốn)?\s+)?(?:xem|truy\s+cập|tham\s+khảo|nhấn|bấm|click)(?:[\s\wàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]*?)(?:vào|tại\s+)?(?:đây|link|đường\s+dẫn|website|trang\s+chủ)?\s*[:.,]?\s*(?:👉|👇|🔗)?\s*\[([^\]]+)\]\(([^)]+)\)/i);

      if (linkMatch) {
        // Note: linkMatch[1] is Title, linkMatch[2] is URL (if prefix matched, otherwise indices might shift if groups added)
        // Actually with non-capturing groups (?:), indices 1 and 2 are stable for Title and URL.
        const title = linkMatch[1];
        const url = linkMatch[2];

        // 1. Fixed Button Title as requested
        recommendation = {
          title: "👉 Thông tin chi tiết tại đây",
          url: url
        };

        // 2. Replace the ENTIRE matched phrase (including "xem tại đây: 👉") 
        // with clean phrase "cậu có thể xem ở dưới đây"
        finalAnswer = answer.replace(linkMatch[0], "cậu có thể xem ở dưới đây");
      }

      // 4. LƯU VÀO db.json QUA WRAPPER DATABASE CỦA BẠN
      const chatRecord = await db.create("ai_chat_history", {
        userId: userId,
        levelId: context.levelId || null,
        characterId: context.characterId !== undefined ? context.characterId : (character ? character.id : 1),
        message: cleanMessage,
        response: finalAnswer, // Save clean text
        audioBase64: audioBase64 || null, // Lưu audio nếu có
        context: {
          ...context,
          rewrittenQuery: rewrittenQuery,
          route: route,
          recommendation: recommendation // Save recommendation in context
        },
        createdAt: new Date().toISOString(),
      });

      // 4.5. ⭐ LƯU HINT ATTEMPT (nếu có detected item)
      if (detectedItem) {
        try {
          await hintService.saveHintAttempt(
            userId,
            context.levelId,
            detectedItem.itemId,
            hintLevel,
            cleanMessage,
            finalAnswer
          );
          console.log(`💾 [Hint Tracking] Saved attempt for ${detectedItem.type}: ${detectedItem.itemId} (Level ${hintLevel})`);
        } catch (error) {
          console.error('⚠️ [Hint Tracking] Failed to save attempt:', error.message);
          // Không fail toàn bộ request nếu lưu hint attempt lỗi
        }
      }

      return {
        success: true,
        data: {
          message: finalAnswer,
          character: character,
          timestamp: chatRecord.createdAt,
          route: route,
          recommendation: recommendation, // Trả về recommendation riêng
          audioBase64: audioBase64, // Trả về cho frontend ngay lập tức
          emotion: emotion // 🎭 Trả về emotion metadata từ Sen-AI
        },
      };
    } catch (error) {
      console.error("AI Chat Error:", error);
      return {
        success: false,
        message: "Dịch vụ AI đang bảo trì, Sen sẽ quay lại sớm!",
        statusCode: 500,
      };
    }
  }

  /**
   * CHAT AUDIO: Chuyển tiếp file audio sang Python
   */
  async chatAudio(userId, audioFile, context = {}, transcribeOnly = false) {
    try {
      const FormData = require('form-data');

      // 1. LẤY NHÂN VẬT (NPC)
      const character = await this.getCharacterContext(context, userId);

      // 2. LẤY LỊCH SỬ
      const history = await this._getFormattedHistory(
        userId,
        context.characterId
      );

      // 3. CHUẨN BỊ FORM DATA
      const form = new FormData();
      // Buffer from multer middleware
      form.append('audio_file', audioFile.buffer, {
        filename: audioFile.originalname || 'voice.webm',
        contentType: audioFile.mimetype || 'audio/webm'
      });
      form.append('history', JSON.stringify(history));
      form.append('transcribe_only', transcribeOnly.toString());

      // 4. GỌI SANG PYTHON FASTAPI (/chat-audio)
      // Note: Python endpoint is /chat-audio
      const pythonUrl = PYTHON_SERVICE_URL.replace('/chat', '').replace(/\/+$/, '') + '/chat-audio';

      // console.log(`🎙️ Forwarding audio to: ${pythonUrl}`);

      const response = await axios.post(
        pythonUrl,
        form,
        {
          headers: {
            ...form.getHeaders()
          },
          timeout: 60000
        }
      );

      // 5. XỬ LÝ KẾT QUẢ
      const {
        intent,
        answer,
        transcribed_text: transcribedText,
        audio, /* base64 TTS response */
        rewritten_query: rewrittenQuery,
        route
      } = response.data;

      // [FEATURE] Transcribe Only Mode (Voice Dictation)
      if (transcribeOnly) {
        return {
          success: true,
          data: {
            transcribedText: transcribedText || ""
          }
        };
      }

      // 6. LƯU VÀO DB
      const chatRecord = await db.create("ai_chat_history", {
        userId: userId,
        levelId: context.levelId || null,
        characterId: context.characterId !== undefined ? context.characterId : (character ? character.id : 1),
        message: transcribedText || "(Voice)",
        response: answer,
        audioBase64: audio || null,
        context: {
          ...context,
          rewrittenQuery: rewrittenQuery,
          route: route,
          intent: intent
        },
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        data: {
          message: answer, // Text response
          transcribedText: transcribedText,
          character: character,
          timestamp: chatRecord.createdAt,
          audioBase64: audio, // TTS response
          intent: intent
        },
      };

    } catch (error) {
      console.error("AI Voice Chat Error:", error.message);
      if (error.response) {
        console.error("Python Service Error:", error.response.data);
      }
      return {
        success: false,
        message: "Sen đang bị nghẹt mũi, không nghe rõ lắm...",
        statusCode: 500,
      };
    }
  }

  /**
   * Lấy thông tin nhân vật (Hàm này vừa bị thiếu dẫn đến lỗi của bạn)
   */
  async getCharacterContext(context, userId) {
    let characterId = context.characterId;
    let character = null;

    // 1. Nếu có characterId, tìm theo ID (check strict undefined/null)
    if (characterId !== undefined && characterId !== null) {
      character = await db.findById("game_characters", characterId);
    }

    // 2. Nếu không có (hoặc tìm không thấy), thử lấy từ Level settings
    if (!character && context.levelId) {
      const level = await db.findById("game_levels", context.levelId);
      if (level && level.aiCharacterId) {
        character = await db.findById("game_characters", level.aiCharacterId);
      }
    }

    // 3. Nếu vẫn chưa có, lấy nhân vật mặc định (isDefault = true)
    if (!character) {
      const allCharacters = await db.findMany("game_characters", {});
      character = allCharacters.find(c => c.isDefault === true || c.is_default === true);
    }

    // 4. Fallback cuối cùng nếu DB hỏng (Sen ID 0)
    if (!character) {
      return {
        id: 0,
        name: "Sen",
        speakingStyle: "Thân thiện",
        persona: "Trợ lý ảo",
        avatar: "/images/characters/sen_avatar.png"
      };
    }

    return {
      id: character.id,
      name: character.name,
      persona: character.persona,
      speakingStyle: character.speakingStyle || character.speaking_style,
      avatar: character.avatar,
    };
  }

  /**
   * ⭐ Lấy thông tin đầy đủ về character, level, chapter và knowledge base
   * Đây là hàm mở rộng của getCharacterContext để lấy game context
   */
  async getCharacterWithGameContext(context, userId) {
    // 1. Lấy character cơ bản
    const character = await this.getCharacterContext(context, userId);

    // [FIX] Parse levelId to int explicitly to assure DB lookup works
    const levelId = context.levelId ? parseInt(context.levelId, 10) : null;

    // 2. ⭐ LẤY LEVEL INFO (bao gồm Knowledge Base từ biến tĩnh)
    let level = null;
    if (levelId) {
      const levelData = await db.findById("game_levels", levelId);

      if (levelData) {
        // Tra cứu KB theo cấu trúc Chapter -> Level
        let hardcodedKB = null;
        if (CHAPTER_KNOWLEDGE_BASE[levelData.chapterId]) {
          hardcodedKB = CHAPTER_KNOWLEDGE_BASE[levelData.chapterId][levelData.id];
        }

        level = {
          id: levelData.id,
          name: levelData.name,
          description: levelData.description,
          // ƯU TIÊN: Lấy KB từ biến tĩnh CHAPTER_KNOWLEDGE_BASE, rồi đến DB
          knowledgeBase: hardcodedKB || levelData.knowledgeBase || null,
          heritageSiteId: levelData.heritageSiteId || null,
          chapterId: levelData.chapterId, // Lưu lại chapterId để dùng ở bước sau
          // ⭐ THÊM: Type và Screens để AI biết loại màn chơi và nhiệm vụ cụ thể
          type: levelData.type || 'UNKNOWN', // HIDDEN_OBJECT, QUIZ, DIALOGUE, etc.
          screens: levelData.screens || [] // Danh sách các màn con (items, questions, etc.)
        };
      } else {
        console.warn(`[AI Service] Level context requested but not found for ID: ${levelId}`);
      }
    }

    // 3. ⭐ LẤY CHAPTER INFO
    let chapter = null;
    if (level && level.chapterId) {
      const chapterData = await db.findById("game_chapters", level.chapterId);
      if (chapterData) {
        chapter = {
          id: chapterData.id,
          name: chapterData.name,
          theme: chapterData.theme, // [FIX] Added theme to chapter context if available
          description: chapterData.description
        };
      }
    }

    // 4. ⭐ XÁC ĐỊNH COLLECTIONS (nguồn dữ liệu cho RAG)
    const collections = this._determineCollections(chapter, level);

    // 5. Return đầy đủ thông tin
    return {
      ...character,
      level: level,
      chapter: chapter,
      collections: collections
    };
  }

  /**
   * Xác định collections cần tìm kiếm dựa trên chapter theme và level
   */
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
      // Ưu tiên tìm trong heritage site đó
      collections.unshift(`heritage_site_${level.heritageSiteId}`);
    }

    // Loại bỏ trùng lặp
    return [...new Set(collections)];
  }

  /**
   * Lấy lịch sử hội thoại và format chuẩn cho Reflection
   */
  /**
   * Lấy lịch sử hội thoại và format chuẩn cho Reflection
   * ⭐ Đảm bảo độc lập history giữa các Level và AI Tổng
   */
  async _getFormattedHistory(userId, characterId, levelId, limit = 5) {
    try {
      // 1. Lấy toàn bộ history của User
      const query = { userId: userId };
      const rawHistory = await db.findMany("ai_chat_history", query);

      // 2. Perform Strict Filtering (in-memory)
      const filtered = rawHistory.filter(h => {
        // A. Filter theo Character (nếu có yêu cầu)
        if (characterId !== undefined && characterId !== null) {
          const hCharId = h.characterId !== undefined ? h.characterId : h.character_id;
          // So sánh lỏng (String comparison) để tránh lỗi type number/string
          if (String(hCharId) !== String(characterId)) return false;
        }

        // B. ⭐ FILTER THEO LEVEL ID (QUAN TRỌNG NHẤT)
        // Chuẩn hóa levelId từ DB (có thể là levelId hoặc level_id)
        const hLevelId = h.levelId !== undefined ? h.levelId : h.level_id;

        if (levelId) {
          // CASE 1: Đang ở trong Game Level (ví dụ Level 1)
          // -> Chỉ lấy history CỦA ĐÚNG Level đó.
          return String(hLevelId) === String(levelId);
        } else {
          // CASE 2: Đang chat với AI Tổng (levelId là null/undefined)
          // -> Chỉ lấy history CỦA AI Tổng (không thuộc level nào)
          return !hLevelId;
        }
      });

      // 3. Sort và Format cho OpenAI
      const formatted = filtered
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .reverse()
        .map((h) => [
          { role: "user", content: h.message },
          { role: "assistant", content: h.response },
        ])
        .flat();

      return formatted;
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
    }
  }

  /**
   * Xây dựng system prompt với persona, knowledge base và game context
   */
  _buildSystemPrompt(character) {
    let prompt = "";

    // 1. PERSONA - Vai trò và tính cách
    if (character.persona) {
      prompt += `${character.persona}\n\n`;
    } else {
      prompt += `Bạn là ${character.name || "Sen"}, một trợ lý AI thông minh và thân thiện.\n\n`;
    }

    // 2. SPEAKING STYLE - Phong cách giao tiếp
    if (character.speakingStyle) {
      prompt += `Phong cách giao tiếp: ${character.speakingStyle}\n\n`;
    }

    // 3. GAME CONTEXT & SCOPE CONTROL (QUAN TRỌNG: PHÂN BIỆT AI LEVEL VS AI TỔNG)
    if (character.level) {
      prompt += `📍 BỐI CẢNH MÀN CHƠI (LEVEL MODE - RESTRICTED SCOPE):\n`;

      if (character.chapter) {
        prompt += `- Chapter: "${character.chapter.name}" (${character.chapter.theme})\n`;
      }
      prompt += `- Level: "${character.level.name}"\n`;
      if (character.level.description) {
        prompt += `- Mô tả: ${character.level.description}\n`;
      }

      prompt += `\n⚠️ CHỈ THỊ QUAN TRỌNG (SCOPE CONTROL):\n`;
      prompt += `- Bạn đang đóng vai trò là HƯỚNG DẪN VIÊN riêng cho màn chơi này.\n`;
      prompt += `- Nhiệm vụ chính: Giúp người chơi vượt qua thử thách và hiểu sâu về kiến thức CỦA RIÊNG màn chơi "${character.level.name}".\n`;
      prompt += `- Nếu người chơi hỏi về các vấn đề KHÔNG LIÊN QUAN đến màn chơi này (ví dụ: hỏi về bóng đá, lập trình, hoặc kiến thức lịch sử không thuộc triều đại/thời kỳ này), bạn hãy KHÉO LÉO TỪ CHỐI hoặc LÁI VỀ chủ đề chính. (Ví dụ: "Chuyện đó để sau nhé, giờ mình tập trung vào [chủ đề level] đã nào!")\n`;
      prompt += `- TUYỆT ĐỐI KHÔNG trả lời như một AI tổng quát (ChatGPT/Gemini) biết tuốt. Hãy giới hạn kiến thức trong bối cảnh lịch sử của level.\n`;

      // 4. ⭐ GAMEPLAY MECHANICS
      if (character.level.screens) {
        prompt += `\n🎮 GAMEPLAY MECHANICS (NHIỆM VỤ NGƯỜI CHƠI):\n`;
        prompt += `- LOẠI MÀN CHƠI: ${character.level.type ? character.level.type.toUpperCase() : 'UNKNOWN'}\n`;

        // Giải thích chi tiết từng loại màn chơi
        if (character.level.type === 'HIDDEN_OBJECT') {
          prompt += `  📍 ĐÂY LÀ MÀN CHƠI "TÌM ĐỒ VẬT ẨN" (HIDDEN OBJECT):\n`;
          prompt += `     • Người chơi cần TÌM CÁC VẬT PHẨM bị giấu trong bức tranh/hình ảnh\n`;
          prompt += `     • Mục tiêu: Click vào đúng vị trí của vật phẩm trong hình\n`;
          prompt += `     • Khi người chơi hỏi "Tìm cái X ở đâu?", bạn PHẢI:\n`;
          prompt += `       - MÔ TẢ đặc điểm hình dáng, màu sắc của vật phẩm\n`;
          prompt += `       - GỢI Ý về vị trí tương đối (góc nào, gần vật gì)\n`;
          prompt += `       - GIẢI THÍCH ý nghĩa văn hóa/lịch sử của vật phẩm đó\n`;
          prompt += `       - TUYỆT ĐỐI KHÔNG chỉ nói tên vật, phải mô tả để giúp tìm\n`;
        } else if (character.level.type === 'QUIZ') {
          prompt += `  📍 ĐÂY LÀ MÀN CHƠI "TRẢ LỜI CÂU HỎI" (QUIZ):\n`;
          prompt += `     • Người chơi cần TRẢ LỜI CÂU HỎI lịch sử/văn hóa\n`;
          prompt += `     • Mục tiêu: Chọn đáp án đúng trong danh sách lựa chọn\n`;
          prompt += `     • Áp dụng CHIẾN LƯỢC GỢI Ý (xem phần dưới)\n`;
        } else if (character.level.type === 'DIALOGUE') {
          prompt += `  📍 ĐÂY LÀ MÀN CHƠI "ĐỐI THOẠI" (DIALOGUE):\n`;
          prompt += `     • Người chơi đang TRÒ CHUYỆN với nhân vật trong game\n`;
          prompt += `     • Mục tiêu: Tìm hiểu câu chuyện và khám phá kiến thức\n`;
          prompt += `     • Bạn có thể trả lời tự nhiên hơn, nhưng vẫn giữ đúng bối cảnh lịch sử\n`;
        }

        prompt += `\n- Nhiệm vụ cụ thể:\n`;
        character.level.screens.forEach((screen, index) => {
          if (screen.type === 'QUIZ') {
            prompt += `  + [QUIZ ${index + 1}] Câu hỏi: "${screen.question}"\n`;
            prompt += `    -> Đáp án đúng: ${screen.options.find(o => o.isCorrect).text}\n`;
            prompt += `    -> Giải thích: ${screen.options.find(o => o.isCorrect).explanation || "Không có"}\n`;
          } else if (screen.type === 'HIDDEN_OBJECT') {
            prompt += `  + [HIDDEN OBJECT] Màn chơi tìm đồ vật.\n`;
            prompt += `    -> Gợi ý chung: "${screen.guide_text || 'Hãy quan sát kỹ bức tranh'}"\n`;
            prompt += `    -> CÁC VẬT PHẨM CẦN TÌM (Kèm thông tin để gợi ý):\n`;
            if (screen.items) {
              screen.items.forEach(item => {
                const description = item.fact_popup || item.description || "Không có mô tả thêm.";
                prompt += `       * "${item.name}": ${description}\n`;
              });
            }
            prompt += `    -> ⚠️ LƯU Ý QUAN TRỌNG KHI GỢI Ý TÌM VẬT PHẨM:\n`;
            prompt += `       • Hãy mô tả HÌNH DÁNG, MÀU SẮC, ĐẶC ĐIỂM của vật phẩm\n`;
            prompt += `       • Gợi ý về VỊ TRÍ TƯƠNG ĐỐI trong bức tranh (nếu biết)\n`;
            prompt += `       • Giải thích Ý NGHĨA VĂN HÓA/LỊCH SỬ của vật phẩm\n`;
            prompt += `       • ĐỪNG CHỈ NÓI TÊN ("Hãy tìm cái trống" → SAI)\n`;
            prompt += `       • NÊN NÓI ("Hãy tìm chiếc trống đồng có hình mặt trời ở giữa, thường nằm ở vị trí trung tâm bức tranh" → ĐÚNG)\n`;
          } else if (screen.type === 'DIALOGUE') {
            prompt += `  + [ĐỐI THOẠI] Người chơi đang trò chuyện với nhân vật.\n`;
          }
        });
      } else {
        // Nếu không có screens data, vẫn cố gắng giải thích
        prompt += `\n🎮 GAMEPLAY MECHANICS:\n`;
        prompt += `- Màn chơi "${character.level.name}"\n`;
        prompt += `- Bạn hãy hướng dẫn người chơi dựa trên kiến thức nền tảng và mô tả level.\n`;
      }

      // 5. ⭐ KNOWLEDGE BASE - Kiến thức riêng cho level (QUAN TRỌNG!)
      if (character.level.knowledgeBase) {
        prompt += `\n📚 KIẾN THỨC NỀN TẢNG (SỰ THẬT DUY NHẤT CHO LEVEL NÀY):\n${character.level.knowledgeBase}\n`;
        prompt += `(Hãy dùng thông tin trên để trả lời. Nếu thông tin không có trong đây, hãy hạn chế bịa đặt, trừ khi là kiến thức phổ thông phù hợp với bối cảnh lịch sử đó.)\n`;
      }

    } else {
      // CHẾ ĐỘ AI TỔNG (GENERAL MODE) - STRICTER PERSONA
      prompt += `📍 CHẾ ĐỘ AI TỔNG (GENERAL MODE - CULTURAL GUIDE + FRIENDLY ASSISTANT):\n`;
      prompt += `- Bạn là "Sen" - Hướng dẫn viên ảo chuyên về DI SẢN VĂN HÓA & LỊCH SỬ VIỆT NAM của ứng dụng "Hào Khí Lạc Hồng".\n`;
      prompt += `- NHIỆM VỤ CHÍNH: Giải đáp thắc mắc về lịch sử, văn hóa, các triều đại, di tích, danh nhân Việt Nam.\n`;
      prompt += `\n- GIỚI HẠN CHỦ ĐỀ (SCOPE): \n`;
      prompt += `  ✅ BẠN NÊN TRẢ LỜI:\n`;
      prompt += `     • Câu hỏi về văn hóa, lịch sử, di sản Việt Nam (chủ đề chính)\n`;
      prompt += `     • Câu hỏi tiện ích cơ bản: thời gian ("mấy giờ rồi"), chào hỏi ("xin chào"), cảm ơn, v.v.\n`;
      prompt += `     • Chitchat nhẹ nhàng liên quan đến trải nghiệm app\n`;
      prompt += `  ⛔ BẠN KHÔNG NÊN TRẢ LỜI (từ chối khéo léo):\n`;
      prompt += `     • Câu hỏi chuyên môn sâu ngoài phạm vi: code, toán học, khoa học, y tế, pháp luật\n`;
      prompt += `     • Tư vấn cá nhân: tình cảm, tài chính, career\n`;
      prompt += `     • Hướng dẫn kỹ thuật: nấu ăn, sửa chữa, DIY (trừ khi liên quan văn hóa VN)\n`;
      prompt += `\n  💡 CÁCH XỬ LÝ:\n`;
      prompt += `     • Câu hỏi cơ bản (giờ, chào): Trả lời NGẮN GỌN rồi gợi ý về văn hóa\n`;
      prompt += `       VD: "Bây giờ là [thời gian] rồi đấy! 😊 Cậu muốn tìm hiểu về di sản nào không?"\n`;
      prompt += `     • Câu hỏi không liên quan: Từ chối khéo + lái về văn hóa\n`;
      prompt += `       VD: "Sen chỉ sành về sử sách 📖 thôi ạ. Hay mình nói về ẩm thực cung đình Huế đi?"\n`;
    }

    // 6. COLLECTIONS - Nơi tìm kiếm thông tin thêm (RAG)
    if (character.collections && character.collections.length > 0) {
      prompt += `\n🔍 Nguồn thông tin tham khảo thêm (RAG): ${character.collections.join(", ")}\n`;
    }

    // 🛑 ADAPTIVE HINTING STRATEGY (Chỉ áp dụng cho Level Mode)
    if (character.level) {
      prompt += `\n💡 CHIẾN LƯỢC GỢI Ý (STRICT NO-SPOILER MODE - TUYỆT ĐỐI KHÔNG SPOIL):\n`;
      prompt += `\n🚫 QUY TẮC VÀNG (NGHIÊM NGẶT):\n`;
      prompt += `  ⛔ KHÔNG BAO GIỜ nói thẳng đáp án chính xác (số, tên riêng, địa danh, năm tháng cụ thể)\n`;
      prompt += `  ⛔ KHÔNG BAO GIỜ nói "Đáp án là..." dù user hỏi bao nhiêu lần\n`;
      prompt += `  ⛔ KHÔNG BAO GIỜ liệt kê đáp án dạng "A là X, B là Y, C là Z"\n`;
      prompt += `  ⛔ KHÔNG BAO GIỜ xác nhận đáp án đúng/sai khi user hỏi "Có phải ... không?"\n`;
      prompt += `  ✅ CHỈ ĐƯỢC phép gợi ý bằng cách mô tả đặc điểm, bối cảnh, ý nghĩa\n`;
      prompt += `  ✅ CHỈ ĐƯỢC phép động viên, khuyến khích người chơi tự suy nghĩ\n`;
      prompt += `\n📊 THANG ĐO GỢI Ý (3 MỨC - KHÔNG CÓ MỨC "CHO ĐÁP ÁN"):\n`;
      prompt += `\n  📍 MỨC 1 - GỢI NHỚ BỐI CẢNH (Lần hỏi đầu tiên):\n`;
      prompt += `     • Nhắc về sự kiện, truyền thuyết, bối cảnh lịch sử liên quan\n`;
      prompt += `     • TUYỆT ĐỐI KHÔNG nhắc đến con số, tên riêng, địa danh cụ thể\n`;
      prompt += `     • VÍ DỤ:\n`;
      prompt += `       ❌ SAI: "Đáp án là 100 người con"\n`;
      prompt += `       ❌ SAI: "Lạc Long Quân và Âu Cơ sinh ra 100 người con"\n`;
      prompt += `       ✅ ĐÚNG: "Hãy nhớ lại truyền thuyết về bọc trăm trứng nhé! 🥚 Câu chuyện nói về việc sinh con của Lạc Long Quân và Âu Cơ đấy."\n`;
      prompt += `\n  📍 MỨC 2 - GỢI Ý ĐẶC ĐIỂM (Lần hỏi thứ 2-3):\n`;
      prompt += `     • Mô tả tính chất, đặc điểm, ý nghĩa của đáp án\n`;
      prompt += `     • Có thể nhắc từ khóa CHUNG CHUNG (không cụ thể)\n`;
      prompt += `     • VẪN GIẤU đáp án chính xác\n`;
      prompt += `     • VÍ DỤ:\n`;
      prompt += `       ❌ SAI: "Đáp án là số 100"\n`;
      prompt += `       ❌ SAI: "Đáp án là một con số tròn trăm: 100"\n`;
      prompt += `       ✅ ĐÚNG: "Từ 'trăm' trong câu chuyện có ý nghĩa gì nhỉ? 🤔 Hãy nghĩ về số lượng người con mà họ sinh ra."\n`;
      prompt += `       ✅ ĐÚNG: "Cậu thử nghĩ xem, tại sao người ta gọi là 'Bách Việt' (Trăm Việt)? Con số này liên quan đến số lượng con cái đấy."\n`;
      prompt += `\n  📍 MỨC 3 - GỢI Ý SÁT SƯỜN NHẤT (Lần hỏi 4+, hoặc khi user yêu cầu đáp án):\n`;
      prompt += `     • Đưa ra gợi ý GẦN NHẤT có thể NHƯNG VẪN GIẤU đáp án\n`;
      prompt += `     • Có thể nói về phạm vi, loại đáp án (nhưng KHÔNG nói kết quả)\n`;
      prompt += `     • Động viên, khuyến khích user tự tìm ra\n`;
      prompt += `     • VÍ DỤ:\n`;
      prompt += `       ❌ SAI: "Thôi được rồi, đáp án là 100 người con"\n`;
      prompt += `       ❌ SAI: "Đáp án là một con số tròn trăm, đó là 100"\n`;
      prompt += `       ✅ ĐÚNG: "Mình biết câu này hơi khó! 😊 Nhưng hãy nghĩ về từ 'Bách' trong 'Bách Việt' - đó là một con số tròn trăm. Cậu thử đoán xem số nào?"\n`;
      prompt += `       ✅ ĐÚNG: "Sen không thể cho cậu đáp án được, vì mình muốn cậu tự khám phá ra! 💪 Nhưng gợi ý cuối: đó là CON SỐ đầu tiên mà cậu nghĩ đến khi nghe từ 'Bách' (trăm). Thử đi!"\n`;
      prompt += `\n  ⚠️ XỬ LÝ KHI USER YÊU CẦU ĐÁP ÁN:\n`;
      prompt += `     • Nếu user hỏi: "Đáp án là gì?", "Cho tôi đáp án", "Nói luôn đi":\n`;
      prompt += `       → TỪ CHỐI KHÉO LÉO + ĐƯA RA GỢI Ý MỨC 3\n`;
      prompt += `       → VÍ DỤ: "Ơ ơ, Sen không thể spoil được! 😅 Nhưng mình tin cậu suy nghĩ thêm chút là ra liền. Gợi ý: Đó là con số tròn trăm đầu tiên mà cậu biết. Thử đi nào!"\n`;
      prompt += `     • Nếu user hỏi: "Có phải là 100 không?":\n`;
      prompt += `       → KHÔNG XÁC NHẬN ĐÚNG/SAI\n`;
      prompt += `       → VÍ DỤ: "Hmm, cậu đang trên đúng hướng rồi đấy! 😊 Hãy tự tin với suy nghĩ của mình và thử trả lời trong game nhé!"\n`;
      prompt += `\n  🎯 NGUYÊN TẮC CUỐI CÙNG:\n`;
      prompt += `     • Nhiệm vụ của bạn là HƯỚNG DẪN, KHÔNG PHẢI GIẢI THÍCH ĐÁP ÁN\n`;
      prompt += `     • Luôn khuyến khích user TỰ TÌM RA, kể cả khi họ hỏi nhiều lần\n`;
      prompt += `     • Giữ tone vui vẻ, động viên, không làm user nản lòng\n`;
      prompt += `     • Khen ngợi khi user đưa ra suy nghĩ (dù đúng hay sai)\n`;
    }

    // 7. INSTRUCTIONS - Hướng dẫn chung
    prompt += `\n📝 HƯỚNG DẪN TRẢ LỜI:\n`;
    prompt += `- Trả lời theo đúng persona và phong cách của ${character.name || "bạn"}\n`;
    if (character.level) {
      prompt += `- Luôn liên hệ câu trả lời với bối cảnh level "${character.level.name}"\n`;
    }
    prompt += `- Giữ câu trả lời ngắn gọn, dễ hiểu (2-3 câu)\n`;
    prompt += `- Sử dụng emoji phù hợp với tính cách\n`;

    return prompt;
  }

  /**
   * Lấy lịch sử chat đơn thuần cho UI
   */
  async getHistory(userId, levelId, characterId, limit = 20) {
    const query = { userId: userId };
    // [FIX] Strict filtering: If levelId exists -> filter by it. If null -> filter by null (Global).
    // This prevents Level chats from appearing in Global, and vice versa.
    query.levelId = levelId || null;

    if (characterId) query.characterId = characterId;

    const rawHistory = await db.findMany("ai_chat_history", query);

    // Convert to chat message format: [user, assistant, user, assistant, ...]
    // Convert to chat message format: [user, assistant, user, assistant, ...]
    const history = [];
    rawHistory
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-limit) // Take last N
      .forEach((record) => {
        // User message
        history.push({
          id: `${record.id}-user`,
          characterId: record.characterId,
          userId: record.userId,
          role: "user",
          content: record.message,
          timestamp: record.createdAt,
          context: record.context,
        });
        // Assistant response
        history.push({
          id: `${record.id}-assistant`,
          characterId: record.characterId,
          userId: record.userId,
          role: "assistant",
          content: record.response,
          timestamp: record.createdAt,
          context: record.context,
          audioBase64: record.audioBase64 || null,
        });
      });

    return { success: true, data: history };
  }

  /**
   * Xóa lịch sử
   */
  async clearHistory(userId, characterId) {
    const query = { userId: userId };
    if (characterId) query.characterId = characterId;

    const history = await db.findMany("ai_chat_history", query);
    for (const h of history) {
      await db.delete("ai_chat_history", h.id);
    }
    return { success: true, message: "Lịch sử đã được dọn dẹp." };
  }

  /**
   * Lấy tất cả AI characters (có filter theo ownership)
   * 
   * LOGIC CHARACTERS:
   * - Sen (is_default=true) là nhân vật mặc định, luôn hiển thị
   * - Các nhân vật khác chỉ hiển thị nếu user đã sở hữu (owned)
   * - Ownership được track trong bảng user_characters
   */
  async getCharacters(userId = null) {
    try {
      const allCharacters = await db.findMany("game_characters", {});

      // Lấy danh sách nhân vật user đã sở hữu
      let ownedIds = [];
      if (userId) {
        const ownedCharacters = await db.findMany("user_characters", { userId: userId });
        ownedIds = ownedCharacters.map(uc => uc.characterId);
      }

      // Lấy tiến độ game của user (để check unlock requirement)
      let completedLevelIds = [];
      if (userId) {
        const progress = await db.findOne("game_progress", { userId: userId });
        completedLevelIds = progress?.completedLevels || [];
      }

      // Map to frontend format với ownership info
      const mappedCharacters = allCharacters
        .filter(char => {
          // Nhân vật mặc định (Sen) luôn hiển thị
          const isDefault = char.isDefault === true || char.is_default === true;
          if (isDefault) return true;
          // Các nhân vật khác chỉ hiển thị nếu user sở hữu
          return ownedIds.includes(char.id);
        })
        .map(char => {
          // Check xem có thể unlock (đã hoàn thành level yêu cầu)
          const unlockLevelId = char.unlockLevelId || char.unlock_level_id;
          const canUnlock = !unlockLevelId || completedLevelIds.includes(unlockLevelId);
          const isDefault = char.isDefault === true || char.is_default === true;

          return {
            id: char.id,
            name: char.name,
            avatar: char.avatar || char.avatarLocked || '/images/characters/default.png',
            personality: char.persona || char.speakingStyle || char.speaking_style || 'Thân thiện',
            state: 'restored',
            description: char.description || `Nhân vật ${char.name}`,
            isDefault: isDefault,
            isOwned: isDefault || ownedIds.includes(char.id),
            rarity: char.rarity || 'common',
            price: char.price || 0,
            unlockLevelId: unlockLevelId || null,
            canUnlock: canUnlock,
            // Các trường bổ sung theo yêu cầu chuẩn hóa
            origin: char.origin || 'Văn hóa Việt Nam', // Mặc định là Văn hóa VN nếu thiếu
            isCollectible: typeof char.isCollectible === 'boolean' ? char.isCollectible : true, // Mặc định là có thể sưu tầm
          };
        });

      return { success: true, data: mappedCharacters };
    } catch (error) {
      console.error("Get Characters Error:", error);
      return { success: false, data: [], message: error.message };
    }
  }

  /**
   * Mua nhân vật (sau khi đã unlock)
   */
  async purchaseCharacter(userId, characterId) {
    try {
      // 1. Check nhân vật tồn tại
      const character = await db.findById("game_characters", characterId);
      if (!character) {
        return { success: false, message: "Nhân vật không tồn tại", statusCode: 404 };
      }

      // 2. Check không phải nhân vật mặc định
      if (character.isDefault) {
        return { success: false, message: "Không thể mua nhân vật mặc định", statusCode: 400 };
      }

      // 3. Check đã sở hữu chưa
      const existingOwnership = await db.findOne("user_characters", {
        userId: userId,
        characterId: characterId
      });
      if (existingOwnership) {
        return { success: false, message: "Bạn đã sở hữu nhân vật này rồi", statusCode: 400 };
      }

      // 4. Check đã unlock chưa (hoàn thành level yêu cầu)
      const unlockLevelId = character.unlockLevelId || character.unlock_level_id;
      if (unlockLevelId) {
        const progress = await db.findOne("game_progress", { userId: userId });
        const completedLevels = progress?.completedLevels || [];
        if (!completedLevels.includes(unlockLevelId)) {
          return {
            success: false,
            message: `Bạn cần hoàn thành level ${unlockLevelId} trước`,
            statusCode: 400
          };
        }
      }

      // 5. Check đủ tiền (Coins)
      const progress = await db.findOne("game_progress", { userId: userId });
      if (!progress) {
        return { success: false, message: "Không tìm thấy tiến độ game", statusCode: 404 };
      }

      // Use COINS instead of SEN PETALS
      const currentCoins = progress.coins || 0;
      const price = character.price || 0;

      if (currentCoins < price) {
        return {
          success: false,
          message: `Không đủ Coins. Cần ${price}, hiện có ${currentCoins}`,
          statusCode: 400
        };
      }

      // 6. Trừ Coins và thêm ownership
      const updateData = {
        coins: currentCoins - price
      };

      await db.update("game_progress", progress.id, updateData);

      const ownership = await db.create("user_characters", {
        userId: userId,
        characterId: characterId,
        unlockedAt: new Date().toISOString(),
        unlockType: "purchase"
      });

      return {
        success: true,
        message: `Đã mua nhân vật ${character.name}!`,
        data: {
          character: character,
          newBalance: currentCoins - price,
          ownership: ownership
        }
      };
    } catch (error) {
      console.error("Purchase Character Error:", error);
      return { success: false, message: error.message, statusCode: 500 };
    }
  }

  /**
   * Lấy danh sách nhân vật có thể mua (đã unlock nhưng chưa sở hữu)
   */
  async getAvailableCharacters(userId) {
    try {
      const allCharacters = await db.findMany("game_characters", {});

      // Lấy danh sách đã sở hữu
      const ownedCharacters = await db.findMany("user_characters", { userId: userId });
      const ownedIds = ownedCharacters.map(uc => uc.characterId);

      // Lấy tiến độ để check unlock
      const progress = await db.findOne("game_progress", { userId: userId });
      const completedLevels = progress?.completedLevels || [];

      // Filter: chưa sở hữu, không phải mặc định, và đã unlock
      const availableCharacters = allCharacters
        .filter(char => {
          const isDefault = char.isDefault === true || char.is_default === true;
          if (isDefault) return false; // Mặc định đã có (handled elsewhere or implied)
          // if (ownedIds.includes(char.id)) return false; // REMOVED: Keep owned characters

          // Check unlock condition
          const unlockLevelId = char.unlockLevelId || char.unlock_level_id;
          if (unlockLevelId && !completedLevels.includes(unlockLevelId)) {
            return false; // Chưa unlock
          }

          return true; // Có thể mua hoặc đã sở hữu
        }).map(char => ({
          id: char.id,
          name: char.name,
          avatar: char.avatar,
          description: char.description,
          rarity: char.rarity,
          price: char.price,
          unlockLevelId: char.unlockLevelId,
          isOwned: ownedIds.includes(char.id) // Correctly mark ownership
        }))
        .sort((a, b) => (a.isOwned === b.isOwned ? 0 : a.isOwned ? 1 : -1));

      return { success: true, data: availableCharacters };
    } catch (error) {
      console.error("Get Available Characters Error:", error);
      return { success: false, data: [], message: error.message };
    }
  }
}

module.exports = new AIService();

// /**
//  * AI Service - Tích hợp AI chatbot
//  * Sử dụng OpenAI hoặc Gemini API
//  */

// const db = require('../config/database');

// class AIService {
//   constructor() {
//     this.API_KEY = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
//     this.MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';
//     this.API_URL = process.env.OPENAI_API_KEY
//       ? 'https://api.openai.com/v1/chat/completions'
//       : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
//   }

//   /**
//    * Chat với AI
//    */
//   async chat(userId, message, context = {}) {

//     // Sanitize user input - Simple validation
//     const cleanMessage = message
//       .replace(/</g, '&lt;')
//       .replace(/>/g, '&gt;')
//       .replace(/"/g, '&quot;')
//       .replace(/'/g, '&#x27;')
//       .trim();

//     // Length limit
//     if (cleanMessage.length > 500) {
//       return {
//         success: false,
//         message: 'Message too long (max 500 characters)'
//       };
//     }

//     try {
//       // Lấy character context từ level hiện tại
//       const character = await this.getCharacterContext(context, userId);

//       // Lấy knowledge base
//       const knowledge = await this.getKnowledgeBase(context);

//       // Build system prompt
//       const systemPrompt = this.buildSystemPrompt(character, knowledge);

//       // Lấy conversation history
//       const history = await this.getConversationHistory(userId, context.levelId, 5);

//       // Call AI API
//       const aiResponse = await this.callAI(systemPrompt, history, message);

//       // Lưu vào database
//       const chatRecord = await db.create('ai_chat_history', {
//         user_id: userId,
//         level_id: context.levelId || null,
//         character_id: context.characterId || null,
//         message: message,
//         response: aiResponse,
//         context: context,
//         created_at: new Date().toISOString()
//       });

//       return {
//         success: true,
//         data: {
//           message: aiResponse,
//           character: character,
//           timestamp: chatRecord.created_at
//         }
//       };
//     } catch (error) {
//       console.error('AI Chat Error:', error);
//       return {
//         success: false,
//         message: 'AI service temporarily unavailable',
//         statusCode: 500
//       };
//     }
//   }

//   /**
//    * Lấy context của character
//    */
//   async getCharacterContext(context, userId) {
//     // Lấy thông tin nhân vật gốc
//     let characterId = context.characterId;

//     // Nếu đang trong game session, lấy character của level đó
//     if (!characterId && context.levelId) {
//       const level = await db.findById('game_levels', context.levelId);
//       if (level) characterId = level.ai_character_id;
//     }

//     if (!characterId) return null; // Fallback default character

//     const character = await db.findById('game_characters', characterId);

//     // KIỂM TRA TRẠNG THÁI TIẾN ĐỘ CỦA USER VỚI LEVEL NÀY
//     // Để quyết định dùng persona nào (Mất trí nhớ hay Đã hồi phục)
//     const progress = await db.findOne('game_progress', { user_id: userId });
//     const isLevelCompleted = progress?.completed_levels?.includes(context.levelId);

//     // Logic chọn Persona
//     let activePersona = character.persona_amnesia; // Mặc định là mất trí nhớ
//     let activeAvatar = character.avatar_locked;

//     // Nếu đã hoàn thành level HOẶC đang ở màn hình kết thúc (completion screen)
//     if (isLevelCompleted || context.screenType === 'COMPLETION') {
//       activePersona = character.persona_restored;
//       activeAvatar = character.avatar_unlocked;
//     }

//     return {
//       name: character.name,
//       persona: activePersona, // Dùng persona động
//       speaking_style: character.speaking_style,
//       avatar: activeAvatar,
//     };
//   }

//   /**
//    * Lấy knowledge base
//    */
//   async getKnowledgeBase(context) {
//     let knowledge = "";

//     // Lấy kiến thức từ level
//     if (context.levelId) {
//       const level = await db.findById('game_levels', context.levelId);
//       if (level && level.knowledge_base) {
//         knowledge += level.knowledge_base + "\n\n";
//       }

//       // Lấy thông tin artifacts trong level
//       if (level.artifact_ids && level.artifact_ids.length > 0) {
//         const artifacts = (await Promise.all(level.artifact_ids.map(id =>
//           db.findById('artifacts', id)
//         ))).filter(Boolean);

//         artifacts.forEach(artifact => {
//           knowledge += `Artifact: ${artifact.name}\n`;
//           knowledge += `Description: ${artifact.description}\n`;
//           knowledge += `Year: ${artifact.year_created}\n\n`;
//         });
//       }
//     }

//     // Lấy kiến thức từ heritage site
//     if (context.heritageSiteId) {
//       const site = await db.findById('heritage_sites', context.heritageSiteId);
//       if (site) {
//         knowledge += `Heritage Site: ${site.name}\n`;
//         knowledge += `Description: ${site.description}\n`;
//         knowledge += `History: ${site.historical_significance || ''}\n\n`;
//       }
//     }

//     return knowledge || "Kiến thức về lịch sử và văn hóa Việt Nam.";
//   }

//   /**
//    * Build system prompt
//    */
//   buildSystemPrompt(character, knowledge) {
//     // Default character if null
//     if (!character) {
//       character = {
//         persona: 'Bạn là trợ lý AI thông minh về văn hóa Việt Nam.',
//         speaking_style: 'Thân thiện, dễ hiểu, hài hước'
//       };
//     }

//     return `${character.persona}

// Phong cách nói chuyện: ${character.speaking_style}

// KIẾN THỨC CỦA BẠN (CHỈ TRẢ LỜI TRONG PHẠM VI NÀY):
// ${knowledge}

// QUY TẮC:
// 1. Chỉ trả lời dựa trên kiến thức được cung cấp ở trên
// 2. Nếu câu hỏi nằm ngoài phạm vi kiến thức, hãy lịch sự từ chối và hướng người chơi về chủ đề liên quan
// 3. Trả lời ngắn gọn, dễ hiểu (2-3 câu)
// 4. Sử dụng emoji phù hợp để tạo không khí vui vẻ
// 5. Khuyến khích người chơi khám phá thêm`;
//   }

//   /**
//    * Lấy conversation history
//    */
//   async getConversationHistory(userId, levelId, limit = 5) {
//     const query = { user_id: userId };
//     if (levelId) query.level_id = levelId;

//     const history = (await db.findMany('ai_chat_history', query))
//       .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//       .slice(0, limit)
//       .reverse();

//     return history.map(h => [
//       { role: 'user', content: h.message },
//       { role: 'assistant', content: h.response }
//     ]).flat();
//   }

//   /**
//    * Call AI API (OpenAI hoặc Gemini)
//    */
//   async callAI(systemPrompt, history, userMessage) {
//     if (!this.API_KEY) {
//       // Fallback response nếu không có API key
//       return this.getFallbackResponse(userMessage);
//     }

//     try {
//       const messages = [
//         { role: 'system', content: systemPrompt },
//         ...history,
//         { role: 'user', content: userMessage }
//       ];

//       const response = await fetch(this.API_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${this.API_KEY}`
//         },
//         body: JSON.stringify({
//           model: this.MODEL,
//           messages: messages,
//           max_tokens: 150,
//           temperature: 0.7
//         })
//       });

//       const data = await response.json();

//       if (process.env.OPENAI_API_KEY) {
//         return data.choices[0].message.content;
//       } else {
//         // Gemini response format
//         return data.candidates[0].content.parts[0].text;
//       }
//     } catch (error) {
//       console.error('AI API Error:', error);
//       return this.getFallbackResponse(userMessage);
//     }
//   }

//   /**
//    * Fallback response nếu AI không khả dụng
//    */
//   getFallbackResponse(message) {
//     const responses = [
//       "Hm, câu hỏi hay đấy! Hãy quan sát xung quanh và tìm thêm manh mối nhé! 🔍",
//       "Ta nghĩ bạn đang trên đường đúng rồi đấy! Hãy tiếp tục khám phá! ✨",
//       "Thật tuyệt vời! Bạn đang học hỏi rất nhiều về lịch sử Việt Nam! 🏛️",
//       "Câu hỏi thú vị! Hãy tìm kiếm các vật phẩm xung quanh để tìm câu trả lời nhé! 🎯"
//     ];

//     return responses[Math.floor(Math.random() * responses.length)];
//   }

//   /**
//    * Cung cấp gợi ý
//    */
//   async provideHint(userId, levelId, clueId) {
//     const level = await db.findById('game_levels', levelId);
//     if (!level) {
//       return {
//         success: false,
//         message: 'Level not found',
//         statusCode: 404
//       };
//     }

//     // Kiểm tra coins
//     const progress = await db.findOne('game_progress', { user_id: userId });
//     const hintCost = 10;

//     if (progress.coins < hintCost) {
//       return {
//         success: false,
//         message: 'Not enough coins for hint',
//         statusCode: 400
//       };
//     }

//     // Trừ coins
//     await db.update('game_progress', progress.id, {
//       coins: progress.coins - hintCost
//     });

//     // Lấy hint
//     let hint = "Hãy quan sát kỹ xung quanh! 👀";

//     if (clueId && level.clues) {
//       const clue = level.clues.find(c => c.id === clueId);
//       if (clue && clue.hint) {
//         hint = clue.hint;
//       }
//     }

//     return {
//       success: true,
//       data: {
//         hint: hint,
//         cost: hintCost,
//         remaining_coins: progress.coins - hintCost
//       }
//     };
//   }

//   /**
//    * Giải thích về artifact
//    */
//   async explainArtifact(userId, type, id) {
//     let item;

//     if (type === 'artifact') {
//       item = await db.findById('artifacts', id);
//     } else if (type === 'heritage_site') {
//       item = await db.findById('heritage_sites', id);
//     }

//     if (!item) {
//       return {
//         success: false,
//         message: `${type} not found`,
//         statusCode: 404
//       };
//     }

//     // Build context
//     const context = {
//       name: item.name,
//       description: item.description,
//       history: item.historical_context || item.historical_significance || '',
//       significance: item.cultural_significance || ''
//     };

//     // Generate explanation using AI
//     const character = await this.getCharacterContext({});
//     const prompt = `Hãy giải thích về ${context.name} một cách ngắn gọn, dễ hiểu cho trẻ em:

// ${context.description}

// Lịch sử: ${context.history}
// Ý nghĩa: ${context.significance}

// Trả lời bằng giọng điệu ${character.speaking_style}.`;

//     const explanation = await this.callAI(
//       character.persona,
//       [],
//       prompt
//     );

//     return {
//       success: true,
//       data: {
//         item: item,
//         explanation: explanation,
//         character: character
//       }
//     };
//   }

//   /**
//    * Tạo quiz từ AI
//    */
//   async generateQuiz(topicId, difficulty) {
//     // Implementation for generating quiz questions
//     const topic = await db.findById('game_levels', topicId);

//     if (!topic) {
//       return {
//         success: false,
//         message: 'Topic not found',
//         statusCode: 404
//       };
//     }

//     // Generate quiz using AI (mock implementation)
//     const quiz = {
//       questions: [
//         {
//           id: 1,
//           question: `Câu hỏi về ${topic.name}?`,
//           options: ['A', 'B', 'C', 'D'],
//           correct_answer: 'A',
//           explanation: 'Giải thích...'
//         }
//       ]
//     };

//     return {
//       success: true,
//       data: quiz
//     };
//   }

//   /**
//    * Lấy lịch sử chat
//    */
//   async getHistory(userId, levelId, limit) {
//     const query = { user_id: userId };
//     if (levelId) query.level_id = levelId;

//     const history = (await db.findMany('ai_chat_history', query))
//       .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
//       .slice(0, limit);

//     return {
//       success: true,
//       data: history
//     };
//   }

//   /**
//    * Xóa lịch sử
//    */
//   async clearHistory(userId) {
//     const history = await db.findMany('ai_chat_history', { user_id: userId });

//     for (const h of history) {
//       await db.delete('ai_chat_history', h.id);
//     }

//     return {
//       success: true,
//       message: 'Chat history cleared'
//     };
//   }
// }

// module.exports = new AIService();
