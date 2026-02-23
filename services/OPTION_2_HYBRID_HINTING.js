/**
 * OPTION 2: HYBRID APPROACH (RECOMMENDED FOR PRODUCTION)
 * 
 * Kết hợp tracking đơn giản + LLM intelligence
 */

// ============================================
// STEP 1: Setup Redis for hint tracking
// ============================================
const redis = require('redis');
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// ============================================
// STEP 2: Get hint count from Redis
// ============================================
async function getHintCount(userId, levelId, questionId) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const count = await redisClient.get(key);
    return parseInt(count) || 0;
}

async function incrementHintCount(userId, levelId, questionId) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const newCount = await redisClient.incr(key);

    // Set TTL: 24 hours (auto reset sau 1 ngày)
    await redisClient.expire(key, 86400);

    return newCount;
}

// ============================================
// STEP 3: Detect quiz question (simple)
// ============================================
function detectQuizQuestion(userMessage, levelScreens) {
    if (!levelScreens) return null;

    const quizScreens = levelScreens.filter(s => s.type === 'QUIZ');
    const userMsg = userMessage.toLowerCase();

    // Simple keyword matching
    for (const quiz of quizScreens) {
        const questionWords = quiz.question.toLowerCase().split(' ');
        const matchCount = questionWords.filter(word =>
            word.length > 3 && userMsg.includes(word)
        ).length;

        // Nếu match >= 2 từ → likely asking about this quiz
        if (matchCount >= 2) {
            return {
                questionId: quiz.id,
                question: quiz.question,
                correctAnswer: quiz.options.find(o => o.isCorrect)
            };
        }
    }

    return null;
}

// ============================================
// STEP 4: Enhanced system prompt with hint count
// ============================================
function buildHybridSystemPrompt(character, hintCount, quizContext) {
    let prompt = '';

    // Base prompt (persona, style, etc.)
    // ... existing code ...

    if (quizContext) {
        prompt += `\n🎯 QUIZ CONTEXT:\n`;
        prompt += `- Câu hỏi: "${quizContext.question}"\n`;
        prompt += `- Đáp án đúng: ${quizContext.correctAnswer.text}\n`;
        prompt += `- Giải thích: ${quizContext.correctAnswer.explanation}\n`;

        prompt += `\n📊 HINT STATUS:\n`;
        prompt += `- User đã hỏi: ${hintCount} lần\n`;
        prompt += `- Mức gợi ý khuyến nghị: ${getRecommendedLevel(hintCount)}\n`;

        prompt += `\n⚠️ HƯỚNG DẪN GỢI Ý:\n`;
        prompt += `
Dựa vào số lần user đã hỏi (${hintCount}), hãy điều chỉnh mức độ gợi ý:

🔹 Lần 0-1: Gợi nhớ bối cảnh (KHÔNG nói số/tên cụ thể)
   Ví dụ: "Hãy nhớ lại truyền thuyết bọc trăm trứng nhé! 🥚"

🔹 Lần 2: Gợi đặc điểm (nhắc từ khóa)
   Ví dụ: "Từ 'trăm' trong câu chuyện có ý nghĩa gì nhỉ? 🤔"

🔹 Lần 3: Gợi gần đáp án
   Ví dụ: "Đáp án là một con số tròn trăm đấy! 😊"

🔹 Lần 4+: Đưa đáp án + giải thích
   Ví dụ: "Được rồi, đáp án là ${quizContext.correctAnswer.text}. ${quizContext.correctAnswer.explanation}"

⚠️ CHÚ Ý:
- Bạn CÓ THỂ LINH HOẠT điều chỉnh nếu user:
  + Yêu cầu đáp án trực tiếp: "cho tôi đáp án"
  + Thể hiện rõ không biết: "mình thật sự không biết"
  + Hỏi về quiz KHÁC: trả lời bình thường

- TUYỆT ĐỐI KHÔNG spoil đáp án nếu hintCount < 3 (trừ khi user yêu cầu rõ ràng)
`;
    }

    return prompt;
}

function getRecommendedLevel(hintCount) {
    if (hintCount <= 1) return 'Gợi nhớ';
    if (hintCount === 2) return 'Gợi đặc điểm';
    if (hintCount === 3) return 'Gợi gần';
    return 'Giải đáp';
}

// ============================================
// STEP 5: Integration vào chat function
// ============================================
async chat(userId, message, context = {}) {
    try {
        // 1. Get character
        const character = await this.getCharacterWithGameContext(context, userId);

        // 2. Detect quiz question
        let quizContext = null;
        let hintCount = 0;

        if (character.level && character.level.screens) {
            quizContext = detectQuizQuestion(message, character.level.screens);

            if (quizContext) {
                // Get current hint count
                hintCount = await getHintCount(userId, character.level.id, quizContext.questionId);
                console.log(`🎯 Quiz detected: ${quizContext.questionId}, Hint count: ${hintCount}`);
            }
        }

        // 3. Get history
        const history = await this._getFormattedHistory(userId, context.characterId, context.levelId);

        // 4. Build system prompt
        const systemPrompt = quizContext
            ? buildHybridSystemPrompt(character, hintCount, quizContext)
            : this._buildSystemPrompt(character);

        const enrichedHistory = [
            { role: "system", content: systemPrompt },
            ...history
        ];

        // 5. Call Python API
        const response = await axios.post(PYTHON_SERVICE_URL, {
            user_input: message,
            history: enrichedHistory
        });

        const { answer, audioBase64, emotion } = response.data;

        // 6. Increment hint count (AFTER getting response)
        if (quizContext) {
            await incrementHintCount(userId, character.level.id, quizContext.questionId);
        }

        // 7. Save to db
        await db.create("ai_chat_history", {
            userId,
            levelId: context.levelId || null,
            characterId: context.characterId,
            message,
            response: answer,
            audioBase64,
            context: {
                ...context,
                quizDetected: !!quizContext,
                hintCount: hintCount
            },
            createdAt: new Date().toISOString()
        });

        return {
            success: true,
            data: {
                message: answer,
                character,
                audioBase64,
                emotion,
                hintCount: hintCount + 1, // Next hint level
                isQuizHint: !!quizContext
            }
        };
    } catch (error) {
        console.error("AI Chat Error:", error);
        return {
            success: false,
            message: "Dịch vụ AI đang bảo trì!",
            statusCode: 500
        };
    }
}

// ============================================
// STEP 6: Reset hint (optional)
// ============================================
async resetHint(userId, levelId, questionId) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    await redisClient.del(key);
    return { success: true, message: 'Đã reset hint' };
}

module.exports = {
    getHintCount,
    incrementHintCount,
    detectQuizQuestion,
    buildHybridSystemPrompt,
    resetHint
};
