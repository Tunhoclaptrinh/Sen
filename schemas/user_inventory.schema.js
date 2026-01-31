module.exports = {
    userId: {
        type: 'number',
        required: true,
        unique: true,
        foreignKey: 'users',
        description: 'User ID'
    },
    items: {
        type: 'array',
        default: [],
        description: 'Danh sách items: { itemId, quantity, acquiredAt }'
    }
};
