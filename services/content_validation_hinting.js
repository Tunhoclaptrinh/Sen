/**
 * ANTI-SPAM SOLUTION: Content-Based Validation
 * 
 * Chỉ tăng hint level nếu câu hỏi có nội dung thực sự
 */

/**
 * Validate xem câu hỏi có hợp lệ không
 */
function isValidQuestion(userMessage) {
    const msg = userMessage.trim().toLowerCase();

    // 1. Check độ dài tối thiểu
    if (msg.length < 3) {
        return {
            valid: false,
            reason: 'Câu hỏi quá ngắn'
        };
    }

    // 2. Check spam patterns
    const spamPatterns = [
        /^[a-z]$/i,           // Chỉ 1 ký tự: "a", "b", "c"
        /^[0-9]+$/,           // Chỉ số: "123", "456"
        /^(.)\1{2,}$/,        // Lặp ký tự: "aaa", "bbb"
        /^[!@#$%^&*()]+$/,    // Chỉ ký tự đặc biệt
        /^(test|spam|abc|xyz)$/i  // Từ spam phổ biến
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(msg)) {
            return {
                valid: false,
                reason: 'Câu hỏi không hợp lệ'
            };
        }
    }

    // 3. Check có từ có nghĩa không (ít nhất 1 từ >= 3 ký tự)
    const words = msg.split(/\s+/).filter(w => w.length >= 3);
    if (words.length === 0) {
        return {
            valid: false,
            reason: 'Câu hỏi không có nội dung'
        };
    }

    // 4. Check trùng lặp với câu hỏi trước
    // (Sẽ implement ở hàm getHintLevel)

    return {
        valid: true
    };
}

/**
 * Get hint level với content validation
 */
async function getHintLevelWithContentValidation(userId, levelId, questionId, userMessage) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const data = await redis.get(key);

    let hintData = data ? JSON.parse(data) : {
        count: 0,
        lastQuestion: null,
        attempts: []
    };

    // 1. Validate content
    const validation = isValidQuestion(userMessage);

    if (!validation.valid) {
        console.log(`⚠️ INVALID QUESTION: ${validation.reason}`);

        return {
            hintLevel: hintData.count,
            isInvalid: true,
            reason: validation.reason,
            message: "Hãy hỏi câu hỏi rõ ràng hơn nhé! 😊"
        };
    }

    // 2. Check duplicate: Nếu hỏi y hệt câu trước → KHÔNG tăng count
    if (hintData.lastQuestion) {
        const similarity = calculateSimilarity(userMessage, hintData.lastQuestion);

        if (similarity > 0.8) { // 80% giống nhau
            console.log(`⚠️ DUPLICATE QUESTION: Similarity ${similarity}`);

            return {
                hintLevel: hintData.count,
                isDuplicate: true,
                message: "Bạn vừa hỏi câu này rồi mà! Hãy thử suy nghĩ theo hướng khác nhé 🤔"
            };
        }
    }

    // 3. Valid question → Tăng count
    hintData.count += 1;
    hintData.lastQuestion = userMessage;
    hintData.attempts.push({
        timestamp: new Date().toISOString(),
        question: userMessage
    });

    // 4. Save to Redis
    await redis.set(key, JSON.stringify(hintData), 'EX', 86400);

    return {
        hintLevel: hintData.count,
        isValid: true
    };
}

/**
 * Calculate similarity giữa 2 câu (simple Levenshtein distance)
 */
function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Simple word-based similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

/**
 * Integration vào chat function
 */
async chat(userId, message, context = {}) {
    try {
        // ... existing code ...

        if (quizContext) {
            // Get hint level với content validation
            const hintResult = await getHintLevelWithContentValidation(
                userId,
                character.level.id,
                quizContext.questionId,
                message
            );

            // Nếu invalid → Cảnh báo
            if (hintResult.isInvalid) {
                return {
                    success: true,
                    data: {
                        message: hintResult.message,
                        character: character,
                        isInvalidQuestion: true
                    }
                };
            }

            // Nếu duplicate → Nhắc nhở
            if (hintResult.isDuplicate) {
                return {
                    success: true,
                    data: {
                        message: hintResult.message,
                        character: character,
                        isDuplicate: true
                    }
                };
            }

            // Valid → Continue
            hintLevel = hintResult.hintLevel;
        }

        // ... rest of code ...
    } catch (error) {
        // ...
    }
}

module.exports = {
    isValidQuestion,
    getHintLevelWithContentValidation,
    calculateSimilarity
};
