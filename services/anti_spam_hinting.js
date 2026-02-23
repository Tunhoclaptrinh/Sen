/**
 * ANTI-SPAM SOLUTION: Time-Based Throttling
 * 
 * Chỉ tăng hint level nếu user hỏi cách nhau >= MIN_INTERVAL giây
 */

const HINT_CONFIG = {
    MIN_INTERVAL: 10, // 10 giây giữa mỗi lần hỏi
    MAX_ATTEMPTS_PER_HOUR: 20, // Tối đa 20 lần hỏi/giờ
    COOLDOWN_AFTER_ANSWER: 60 // 60 giây cooldown sau khi nhận đáp án
};

/**
 * Get hint level với anti-spam
 */
async function getHintLevelWithAntiSpam(userId, levelId, questionId, userMessage) {
    const key = `hint:${userId}:${levelId}:${questionId}`;
    const data = await redis.get(key);

    let hintData = data ? JSON.parse(data) : {
        count: 0,
        lastAskedAt: null,
        attempts: []
    };

    const now = new Date();
    const lastAskedAt = hintData.lastAskedAt ? new Date(hintData.lastAskedAt) : null;

    // 1. Check spam: Nếu hỏi quá nhanh → KHÔNG tăng count
    if (lastAskedAt) {
        const secondsSinceLastAsk = (now - lastAskedAt) / 1000;

        if (secondsSinceLastAsk < HINT_CONFIG.MIN_INTERVAL) {
            console.log(`⚠️ SPAM DETECTED: User hỏi sau ${secondsSinceLastAsk}s (< ${HINT_CONFIG.MIN_INTERVAL}s)`);

            // Trả về count hiện tại, KHÔNG tăng
            return {
                hintLevel: hintData.count,
                isSpam: true,
                cooldownRemaining: Math.ceil(HINT_CONFIG.MIN_INTERVAL - secondsSinceLastAsk)
            };
        }
    }

    // 2. Check rate limit: Tối đa X lần/giờ
    const oneHourAgo = new Date(now - 3600 * 1000);
    const recentAttempts = hintData.attempts.filter(a =>
        new Date(a.timestamp) > oneHourAgo
    );

    if (recentAttempts.length >= HINT_CONFIG.MAX_ATTEMPTS_PER_HOUR) {
        console.log(`⚠️ RATE LIMIT: User đã hỏi ${recentAttempts.length} lần trong 1 giờ`);

        return {
            hintLevel: hintData.count,
            isRateLimited: true,
            message: "Bạn đã hỏi quá nhiều lần. Hãy thử suy nghĩ thêm nhé! 💭"
        };
    }

    // 3. Valid attempt → Tăng count
    hintData.count += 1;
    hintData.lastAskedAt = now.toISOString();
    hintData.attempts.push({
        timestamp: now.toISOString(),
        question: userMessage
    });

    // 4. Save to Redis
    await redis.set(key, JSON.stringify(hintData), 'EX', 86400); // TTL 24h

    return {
        hintLevel: hintData.count,
        isSpam: false,
        isRateLimited: false
    };
}

/**
 * Integration vào chat function
 */
async chat(userId, message, context = {}) {
    try {
        // ... existing code ...

        if (quizContext) {
            // Get hint level với anti-spam
            const hintResult = await getHintLevelWithAntiSpam(
                userId,
                character.level.id,
                quizContext.questionId,
                message
            );

            // Nếu spam → Cảnh báo user
            if (hintResult.isSpam) {
                return {
                    success: true,
                    data: {
                        message: `⏰ Hãy suy nghĩ thêm ${hintResult.cooldownRemaining} giây nữa nhé! Đừng vội vàng 😊`,
                        character: character,
                        isSpamWarning: true
                    }
                };
            }

            // Nếu rate limited → Từ chối
            if (hintResult.isRateLimited) {
                return {
                    success: true,
                    data: {
                        message: hintResult.message,
                        character: character,
                        isRateLimited: true
                    }
                };
            }

            // Valid attempt → Continue với hint level
            hintLevel = hintResult.hintLevel;
        }

        // ... rest of code ...
    } catch (error) {
        // ...
    }
}

module.exports = {
    getHintLevelWithAntiSpam,
    HINT_CONFIG
};
