/**
 * INTEGRATION GUIDE: Enhanced Adaptive Hinting
 * 
 * Hướng dẫn tích hợp hệ thống gợi ý thích ứng vào ai.service.js
 */

// ============================================
// BƯỚC 1: Import hint service
// ============================================
// Thêm vào đầu file ai.service.js:

const hintService = require('./hint.service');

// ============================================
// BƯỚC 2: Modify _buildSystemPrompt function
// ============================================
// Trong hàm chat(), TRƯỚC KHI gọi _buildSystemPrompt:

async chat(userId, message, context = {}) {
    try {
        // ... existing validation code ...

        // 1. Get character with game context
        const character = await this.getCharacterWithGameContext(context, userId);

        // 2. ⭐ NEW: Detect quiz question
        let quizContext = null;
        let hintLevel = 0;

        if (character.level && character.level.screens) {
            quizContext = hintService.detectQuizQuestion(message, character.level.screens);

            if (quizContext) {
                // User đang hỏi về quiz → get hint level
                hintLevel = await hintService.getHintLevel(
                    userId,
                    character.level.id,
                    quizContext.questionId
                );

                console.log(`🎯 Quiz detected: ${quizContext.questionId}, Hint Level: ${hintLevel}`);
            }
        }

        // 3. Get history
        const history = await this._getFormattedHistory(
            userId,
            context.characterId,
            context.levelId || null
        );

        // 4. ⭐ Build ENHANCED system prompt
        const systemPrompt = quizContext
            ? hintService.buildEnhancedSystemPrompt(character, hintLevel, quizContext)
            : this._buildSystemPrompt(character); // Fallback to original

        const systemMessage = {
            role: "system",
            content: systemPrompt
        };

        const enrichedHistory = [systemMessage, ...history];

        // 5. Call Python API
        const response = await axios.post(
            PYTHON_SERVICE_URL.trim(),
            {
                user_input: message,
                history: enrichedHistory,
            },
            { timeout: 60000 }
        );

        const { answer, audioBase64, emotion } = response.data;

        // 6. ⭐ Save hint attempt (if quiz detected)
        if (quizContext) {
            await hintService.saveHintAttempt(
                userId,
                character.level.id,
                quizContext.questionId,
                hintLevel,
                message,
                answer
            );
        }

        // 7. Save to db.json
        const chatRecord = await db.create("ai_chat_history", {
            userId: userId,
            levelId: context.levelId || null,
            characterId: context.characterId !== undefined ? context.characterId : (character ? character.id : 1),
            message: message,
            response: answer,
            audioBase64: audioBase64 || null,
            context: {
                ...context,
                quizDetected: !!quizContext,
                hintLevel: hintLevel
            },
            createdAt: new Date().toISOString(),
        });

        return {
            success: true,
            data: {
                message: answer,
                character: character,
                timestamp: chatRecord.createdAt,
                audioBase64: audioBase64,
                emotion: emotion,
                // ⭐ Metadata for frontend
                hintLevel: hintLevel,
                isQuizHint: !!quizContext
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

// ============================================
// BƯỚC 3: Add reset hint endpoint (Optional)
// ============================================
// Cho phép user reset hint level nếu muốn thử lại

async resetHintLevel(userId, levelId, questionId) {
    const db = require('../database/db');

    // Xóa tất cả attempts của user cho câu hỏi này
    const attempts = await db.findMany('user_hint_attempts', {
        userId: userId,
        levelId: levelId,
        questionId: questionId
    });

    for (const attempt of attempts) {
        await db.delete('user_hint_attempts', attempt.id);
    }

    return {
        success: true,
        message: 'Đã reset hint level cho câu hỏi này'
    };
}
