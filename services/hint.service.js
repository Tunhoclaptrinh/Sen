/**
 * ENHANCED ADAPTIVE HINTING SYSTEM v2.0
 * - Auto-detect câu hỏi/vật phẩm user đang hỏi
 * - STRICT NO-SPOILER MODE
 * - Support cả QUIZ và HIDDEN_OBJECT
 */

const db = require('../config/database');

/**
 * Lấy hint level hiện tại của user cho một item cụ thể (quiz hoặc object)
 */
async function getHintLevel(userId, levelId, itemId) {
    // Lấy tất cả attempts của user cho item này
    const attempts = await db.findMany('user_hint_attempts', {
        userId: userId,
        levelId: levelId,
        itemId: itemId // có thể là questionId hoặc objectName
    });

    // Hint level = số lần đã hỏi
    return attempts.length;
}

/**
 * AUTO-DETECT: Xác định user đang hỏi về quiz nào
 */
function detectQuizQuestion(userMessage, levelScreens) {
    if (!levelScreens || !Array.isArray(levelScreens)) return null;

    // Tìm tất cả quiz screens
    const quizScreens = levelScreens.filter(s => s.type === 'QUIZ');
    if (quizScreens.length === 0) return null;

    const userMsg = userMessage.toLowerCase();

    for (const screen of quizScreens) {
        const question = screen.question?.toLowerCase() || '';

        // Extract keywords từ câu hỏi
        const keywords = extractKeywords(question);

        // Đếm số từ khóa match
        const matchCount = keywords.filter(kw => userMsg.includes(kw)).length;

        // Nếu match >= 2 từ khóa → highly likely đang hỏi về quiz này
        if (matchCount >= 2) {
            const correctOption = screen.options?.find(o => o.isCorrect);
            return {
                type: 'QUIZ',
                itemId: screen.id || `quiz_${quizScreens.indexOf(screen)}`,
                question: screen.question,
                correctAnswer: correctOption?.text || 'N/A',
                explanation: correctOption?.explanation || ''
            };
        }
    }

    return null;
}

/**
 * AUTO-DETECT: Xác định user đang hỏi về vật phẩm nào trong HIDDEN_OBJECT
 */
function detectHiddenObject(userMessage, levelScreens) {
    if (!levelScreens || !Array.isArray(levelScreens)) return null;

    // Tìm tất cả HIDDEN_OBJECT screens
    const hiddenObjectScreens = levelScreens.filter(s => s.type === 'HIDDEN_OBJECT');
    if (hiddenObjectScreens.length === 0) return null;

    const userMsg = userMessage.toLowerCase();

    for (const screen of hiddenObjectScreens) {
        if (!screen.items || !Array.isArray(screen.items)) continue;

        for (const item of screen.items) {
            const itemName = item.name?.toLowerCase() || '';

            // Check nếu user hỏi về vật phẩm này
            // Ví dụ: "tìm trống đồng", "trống ở đâu", "cái trống"
            const keywords = [itemName, ...extractKeywords(itemName)];
            const matchCount = keywords.filter(kw => userMsg.includes(kw)).length;

            if (matchCount >= 1) {
                return {
                    type: 'HIDDEN_OBJECT',
                    itemId: item.id || item.name,
                    itemName: item.name,
                    description: item.fact_popup || item.description || '',
                    guideText: screen.guide_text || ''
                };
            }
        }
    }

    return null;
}

/**
 * AUTO-DETECT: Tự động xác định user đang hỏi về gì
 */
function autoDetectUserIntent(userMessage, levelScreens) {
    if (!userMessage || !levelScreens) return null;

    // Thử detect quiz trước
    const quizContext = detectQuizQuestion(userMessage, levelScreens);
    if (quizContext) return quizContext;

    // Nếu không phải quiz, thử detect hidden object
    const objectContext = detectHiddenObject(userMessage, levelScreens);
    if (objectContext) return objectContext;

    return null;
}

/**
 * Extract keywords từ text (loại bỏ stop words)
 */
function extractKeywords(text) {
    const stopWords = [
        'là', 'của', 'và', 'có', 'được', 'trong', 'ở', 'về',
        'cho', 'từ', 'với', 'để', 'khi', 'theo', 'bởi', 'vì',
        'bao', 'nhiêu', 'gì', 'nào', 'đâu', 'sao', 'thế'
    ];

    const words = text
        .toLowerCase()
        .replace(/[?.,!]/g, '')
        .split(' ')
        .filter(w => w.length > 2 && !stopWords.includes(w));

    return words;
}

/**
 * Build system prompt injection cho detected item (STRICT NO-SPOILER)
 */
function buildItemContextPrompt(detectedItem, hintLevel) {
    if (!detectedItem) return '';

    let prompt = '';

    if (detectedItem.type === 'QUIZ') {
        prompt += `\n🎯 NGƯỜI CHƠI ĐANG HỎI VỀ QUIZ (AUTO-DETECTED):\n`;
        prompt += `- Câu hỏi: "${detectedItem.question}"\n`;
        prompt += `- Đáp án đúng: ${detectedItem.correctAnswer}\n`;
        prompt += `- Giải thích: ${detectedItem.explanation}\n`;
        prompt += `- Hint Level hiện tại: ${hintLevel}\n`;
        prompt += `\n⚠️ QUAN TRỌNG: ÁP DỤNG STRICT NO-SPOILER MODE!\n`;
        prompt += `- KHÔNG BAO GIỜ nói "Đáp án là..."\n`;
        prompt += `- Hãy gợi ý theo đúng Hint Level ${hintLevel}:\n`;
        if (hintLevel === 0) {
            prompt += `  → Mức 0: Gợi nhớ bối cảnh, KHÔNG nhắc đáp án cụ thể\n`;
        } else if (hintLevel === 1) {
            prompt += `  → Mức 1: Gợi ý đặc điểm, VẪN GIẤU đáp án\n`;
        } else if (hintLevel === 2) {
            prompt += `  → Mức 2: Gợi ý sát sườn, NHƯNG KHÔNG nói kết quả\n`;
        } else {
            prompt += `  → Mức 3+: TỪ CHỐI KHÉO LÉO + gợi ý sát sườn nhất\n`;
        }
    } else if (detectedItem.type === 'HIDDEN_OBJECT') {
        prompt += `\n🔍 NGƯỜI CHƠI ĐANG TÌM VẬT PHẨM (AUTO-DETECTED):\n`;
        prompt += `- Vật phẩm: "${detectedItem.itemName}"\n`;
        prompt += `- Thông tin: ${detectedItem.description}\n`;
        prompt += `\n⚠️ HƯỚNG DẪN TÌM VẬT PHẨM:\n`;
        prompt += `- MÔ TẢ hình dáng, màu sắc, đặc điểm của "${detectedItem.itemName}"\n`;
        prompt += `- GỢI Ý về vị trí tương đối trong bức tranh\n`;
        prompt += `- GIẢI THÍCH ý nghĩa văn hóa/lịch sử\n`;
        prompt += `- ĐỪNG CHỈ NÓI: "Hãy tìm ${detectedItem.itemName}"\n`;
        prompt += `- NÊN NÓI: "[Mô tả hình dáng] + [vị trí] + [ý nghĩa]"\n`;
    }

    return prompt;
}

/**
 * Save hint attempt
 */
async function saveHintAttempt(userId, levelId, itemId, hintLevel, userQuestion, aiResponse) {
    await db.create('user_hint_attempts', {
        userId: userId,
        levelId: levelId,
        itemId: itemId, // questionId hoặc objectName
        hintLevel: hintLevel,
        userQuestion: userQuestion,
        aiResponse: aiResponse,
        createdAt: new Date().toISOString()
    });
}

module.exports = {
    getHintLevel,
    detectQuizQuestion,
    detectHiddenObject,
    autoDetectUserIntent,
    buildItemContextPrompt,
    saveHintAttempt,
    extractKeywords
};
