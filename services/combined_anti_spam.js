/**
 * ANTI-SPAM SOLUTION: Combined Approach (BEST)
 * 
 * Kết hợp Time-based + Content-based + Engagement tracking
 */

const ANTI_SPAM_CONFIG = {
    // Time-based
    MIN_INTERVAL: 10,              // 10 giây giữa mỗi lần hỏi
    MAX_ATTEMPTS_PER_HOUR: 20,     // Tối đa 20 lần/giờ

    // Content-based
    MIN_QUESTION_LENGTH: 3,        // Tối thiểu 3 ký tự
    MIN_WORD_COUNT: 1,             // Tối thiểu 1 từ có nghĩa
    MAX_SIMILARITY: 0.8,           // Không được giống câu trước > 80%

    // Engagement-based
    MIN_THINKING_TIME: 5,          // Phải "suy nghĩ" ít nhất 5 giây
    PROGRESSIVE_DELAY: true        // Delay tăng dần theo hint level
};

/**
 * Comprehensive anti-spam validation
 */
async function getHintLevelWithAntiSpam(userId, levelId, questionId, userMessage) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const data = await redis.get(key);

    let hintData = data ? JSON.parse(data) : {
        count: 0,
        lastAskedAt: null,
        lastQuestion: null,
        attempts: [],
        firstAskedAt: null
    };

    const now = new Date();

    // ============================================
    // 1. TIME-BASED VALIDATION
    // ============================================
    if (hintData.lastAskedAt) {
        const lastAskedAt = new Date(hintData.lastAskedAt);
        const secondsSinceLastAsk = (now - lastAskedAt) / 1000;

        // Progressive delay: Càng hỏi nhiều, delay càng lâu
        const requiredDelay = ANTI_SPAM_CONFIG.PROGRESSIVE_DELAY
            ? ANTI_SPAM_CONFIG.MIN_INTERVAL * (hintData.count + 1)
            : ANTI_SPAM_CONFIG.MIN_INTERVAL;

        if (secondsSinceLastAsk < requiredDelay) {
            const remaining = Math.ceil(requiredDelay - secondsSinceLastAsk);

            return {
                hintLevel: hintData.count,
                blocked: true,
                reason: 'time_throttle',
                message: `⏰ Hãy suy nghĩ thêm ${remaining} giây nữa nhé! Đừng vội vàng 😊`,
                cooldownRemaining: remaining
            };
        }
    }

    // ============================================
    // 2. CONTENT-BASED VALIDATION
    // ============================================

    // 2.1. Check độ dài
    const msg = userMessage.trim();
    if (msg.length < ANTI_SPAM_CONFIG.MIN_QUESTION_LENGTH) {
        return {
            hintLevel: hintData.count,
            blocked: true,
            reason: 'too_short',
            message: 'Hãy hỏi câu hỏi rõ ràng hơn nhé! 😊'
        };
    }

    // 2.2. Check spam patterns
    const spamPatterns = [
        /^[a-z]$/i,                    // 1 ký tự
        /^[0-9]+$/,                    // Chỉ số
        /^(.)\1{2,}$/,                 // Lặp ký tự
        /^[!@#$%^&*()]+$/,             // Ký tự đặc biệt
        /^(test|spam|abc|xyz|asdf)$/i  // Spam words
    ];

    for (const pattern of spamPatterns) {
        if (pattern.test(msg)) {
            return {
                hintLevel: hintData.count,
                blocked: true,
                reason: 'spam_pattern',
                message: 'Câu hỏi này không hợp lệ. Hãy hỏi thật sự nhé! 🤔'
            };
        }
    }

    // 2.3. Check có từ có nghĩa
    const words = msg.split(/\s+/).filter(w => w.length >= 3);
    if (words.length < ANTI_SPAM_CONFIG.MIN_WORD_COUNT) {
        return {
            hintLevel: hintData.count,
            blocked: true,
            reason: 'no_meaningful_words',
            message: 'Hãy hỏi câu hỏi có nội dung nhé! 😊'
        };
    }

    // 2.4. Check duplicate
    if (hintData.lastQuestion) {
        const similarity = calculateSimilarity(msg, hintData.lastQuestion);

        if (similarity > ANTI_SPAM_CONFIG.MAX_SIMILARITY) {
            return {
                hintLevel: hintData.count,
                blocked: true,
                reason: 'duplicate',
                message: 'Bạn vừa hỏi câu này rồi mà! Hãy thử suy nghĩ theo hướng khác nhé 🤔'
            };
        }
    }

    // ============================================
    // 3. ENGAGEMENT-BASED VALIDATION
    // ============================================

    // 3.1. Check "thinking time" - Thời gian từ lần đầu hỏi đến giờ
    if (hintData.firstAskedAt) {
        const firstAskedAt = new Date(hintData.firstAskedAt);
        const totalTime = (now - firstAskedAt) / 1000;
        const expectedThinkingTime = ANTI_SPAM_CONFIG.MIN_THINKING_TIME * hintData.count;

        if (totalTime < expectedThinkingTime) {
            return {
                hintLevel: hintData.count,
                blocked: true,
                reason: 'insufficient_thinking',
                message: 'Hãy dành thời gian suy nghĩ kỹ hơn nhé! Mình tin bạn làm được 💪'
            };
        }
    }

    // 3.2. Rate limit - Tối đa X lần/giờ
    const oneHourAgo = new Date(now - 3600 * 1000);
    const recentAttempts = hintData.attempts.filter(a =>
        new Date(a.timestamp) > oneHourAgo
    );

    if (recentAttempts.length >= ANTI_SPAM_CONFIG.MAX_ATTEMPTS_PER_HOUR) {
        return {
            hintLevel: hintData.count,
            blocked: true,
            reason: 'rate_limit',
            message: 'Bạn đã hỏi quá nhiều lần rồi. Hãy nghỉ ngơi và thử lại sau nhé! 😴'
        };
    }

    // ============================================
    // 4. VALID ATTEMPT - Tăng count
    // ============================================

    hintData.count += 1;
    hintData.lastAskedAt = now.toISOString();
    hintData.lastQuestion = msg;
    hintData.firstAskedAt = hintData.firstAskedAt || now.toISOString();
    hintData.attempts.push({
        timestamp: now.toISOString(),
        question: msg,
        hintLevel: hintData.count
    });

    // Save to Redis với TTL 24h
    await redis.set(key, JSON.stringify(hintData), 'EX', 86400);

    return {
        hintLevel: hintData.count,
        blocked: false,
        isValid: true,
        totalAttempts: hintData.attempts.length,
        totalTime: hintData.firstAskedAt
            ? (now - new Date(hintData.firstAskedAt)) / 1000
            : 0
    };
}

/**
 * Calculate similarity (Jaccard similarity)
 */
function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

/**
 * Reset hint level (cho admin hoặc khi user replay level)
 */
async function resetHintLevel(userId, levelId, questionId) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    await redis.del(key);
    return { success: true, message: 'Đã reset hint level' };
}

/**
 * Get hint statistics (cho analytics)
 */
async function getHintStats(userId, levelId, questionId) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const data = await redis.get(key);

    if (!data) {
        return {
            count: 0,
            attempts: [],
            totalTime: 0
        };
    }

    const hintData = JSON.parse(data);
    const now = new Date();
    const firstAskedAt = hintData.firstAskedAt ? new Date(hintData.firstAskedAt) : now;

    return {
        count: hintData.count,
        attempts: hintData.attempts,
        totalTime: (now - firstAskedAt) / 1000,
        averageInterval: hintData.attempts.length > 1
            ? ((now - firstAskedAt) / 1000) / (hintData.attempts.length - 1)
            : 0
    };
}

module.exports = {
    getHintLevelWithAntiSpam,
    resetHintLevel,
    getHintStats,
    ANTI_SPAM_CONFIG
};
