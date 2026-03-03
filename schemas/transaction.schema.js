module.exports = {
    userId: {
        type: 'number',
        required: true,
        foreignKey: 'users',
        description: 'User thực hiện giao dịch'
    },
    type: {
        type: 'string',
        required: true,
        enum: ['earn', 'spend'],
        description: 'Loại giao dịch: earn (nhận) hoặc spend (tiêu)'
    },
    source: {
        type: 'string',
        required: true,
        description: 'Nguồn giao dịch (checkin, artifact_scan, shop, badge_reward...)'
    },
    sourceId: {
        type: 'number',
        required: false,
        description: 'ID đối tượng liên quan (di tích, hiện vật, shop item...)'
    },
    amount: {
        type: 'number',
        required: true,
        min: 0,
        description: 'Số lượng nhận/tiêu'
    },
    currency: {
        type: 'string',
        required: true,
        enum: ['coins', 'petals'],
        description: 'Loại tiền tệ: coins (xu) hoặc petals (cánh sen)'
    },
    description: {
        type: 'string',
        required: false,
        description: 'Mô tả chi tiết giao dịch'
    },
    createdAt: {
        type: 'date',
        required: false,
        description: 'Thời gian giao dịch'
    }
};
