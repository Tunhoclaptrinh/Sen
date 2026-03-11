module.exports = {
  userId: {
    type: 'number',
    required: true,
    foreignKey: 'users',
    description: 'ID người dùng sở hữu nhân vật'
  },
  characterId: {
    type: 'number',
    required: true,
    foreignKey: 'game_characters',
    description: 'ID nhân vật đã mở khóa'
  },
  unlockedAt: {
    type: 'date',
    required: false,
    description: 'Thời điểm mở khóa'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Nhân vật đang kích hoạt'
  },
  metadata: {
    type: 'object',
    required: false,
    description: 'Dữ liệu mở rộng cho nhân vật người dùng'
  }
};
