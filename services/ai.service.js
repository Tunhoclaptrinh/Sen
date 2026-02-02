const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const db = require("../config/database");

const DB_PATH = path.join(__dirname, "../database/db.json");
const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL;

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
      // 1. LẤY NHÂN VẬT (NPC) - Sửa lỗi "getCharacterContext is not a function"
      const character = await this.getCharacterContext(context, userId);

      // 2. LẤY LỊCH SỬ CHO REFLECTION
      const history = await this._getFormattedHistory(
        userId,
        context.characterId
      );

      // 3. GỌI SANG PYTHON FASTAPI (Render có thể cold start, cần timeout 60s)
      const response = await axios.post(
        PYTHON_SERVICE_URL.trim(),
        {
          user_input: cleanMessage,
          history: history,
        },
        { timeout: 60000 }
      );

      const { answer, rewritten_query: rewrittenQuery, route, score, audio_base64: audioBase64 } = response.data;

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

      return {
        success: true,
        data: {
          message: finalAnswer,
          character: character,
          timestamp: chatRecord.createdAt,
          route: route,
          recommendation: recommendation, // Trả về recommendation riêng
          audioBase64: audioBase64 // Trả về cho frontend ngay lập tức
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
  async chatAudio(userId, audioFile, context = {}) {
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

      // 4. GỌI SANG PYTHON FASTAPI (/chat-audio)
      // Note: Python endpoint is /chat-audio
      const pythonUrl = PYTHON_SERVICE_URL.replace('/chat', '').replace(/\/+$/, '') + '/chat-audio';

      console.log(`🎙️ Forwarding audio to: ${pythonUrl}`);

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
   * Lấy lịch sử hội thoại và format chuẩn cho Reflection
   */
  async _getFormattedHistory(userId, characterId, limit = 5) {
    try {
      const query = { userId: userId };
      if (characterId !== undefined && characterId !== null) {
        query.characterId = characterId;
      }

      const rawHistory = await db.findMany("ai_chat_history", query);

      const formatted = rawHistory
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
      return [];
    }
  }

  /**
   * Lấy lịch sử chat đơn thuần cho UI
   */
  async getHistory(userId, levelId, limit = 20) {
    const query = { userId: userId };
    if (levelId) query.levelId = levelId;
    
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
  async clearHistory(userId) {
    const history = await db.findMany("ai_chat_history", { userId: userId });
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
