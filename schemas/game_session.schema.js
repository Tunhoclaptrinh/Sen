module.exports = {
    userId: {
        type: 'number',
        required: true,
        foreignKey: 'users',
        description: 'User ID'
    },
    levelId: {
        type: 'number',
        required: true,
        foreignKey: 'game_levels',
        description: 'Level ID'
    },
    status: {
        type: 'string',
        required: true,
        enum: ['in_progress', 'completed', 'expired'],
        default: 'in_progress',
        description: 'Trạng thái session'
    },
    currentScreenId: {
        type: 'string', // Can be string id
        required: true,
        description: 'Screen hiện tại'
    },
    currentScreenIndex: {
        type: 'number',
        required: true,
        default: 0,
        description: 'Index screen hiện tại'
    },
    collectedItems: {
        type: 'array',
        default: [],
        description: 'Items đã thu thập trong session'
    },
    answeredQuestions: {
        type: 'array',
        default: [],
        description: 'Câu hỏi đã trả lời'
    },
    timelineOrder: {
        type: 'array',
        default: [],
        description: 'Thứ tự timeline user sắp xếp'
    },
    score: {
        type: 'number',
        default: 0,
        description: 'Điểm số hiện tại của session'
    },
    totalScreens: {
        type: 'number',
        required: true,
        description: 'Tổng số màn chơi'
    },
    completedScreens: {
        type: 'array',
        default: [],
        description: 'Danh sách screen ID đã hoàn thành'
    },
    screenStates: {
        type: 'object',
        default: {},
        description: 'Lưu trạng thái từng screen (read dialogue, etc)'
    },
    timeSpent: {
        type: 'number',
        default: 0,
        description: 'Thời gian chơi (seconds)'
    },
    hintsUsed: {
        type: 'number',
        default: 0,
        description: 'Số hint đã dùng'
    },
    startedAt: {
        type: 'date',
        required: true,
        default: Date.now,
        description: 'Thời gian bắt đầu'
    },
    lastActivity: {
        type: 'date',
        required: true,
        default: Date.now,
        description: 'Hoạt động cuối'
    },
    completedAt: {
        type: 'date',
        required: false,
        description: 'Thời gian hoàn thành'
    },
    expiredAt: {
        type: 'date',
        required: false,
        description: 'Thời gian hết hạn'
    },
    expiredReason: {
        type: 'string',
        required: false,
        description: 'Lý do hết hạn'
    }
};
