module.exports = {
  title: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 100,
    description: 'Tiêu đề thông báo'
  },
  message: {
    type: 'string',
    required: true,
    minLength: 1,
    maxLength: 500,
    description: 'Nội dung thông báo'
  },
  userId: {
    type: 'number',
    required: true,
    foreignKey: 'users',
    description: 'ID người nhận thông báo'
  },
  type: {
    type: 'enum',
    enum: ['heritage', 'artifact', 'exhibition', 'review', 'system', 'learning', 'history', 'quest', 'achievement', 'social', 'reward'],
    required: true,
    description: 'Loại thông báo'
  },
  refId: {
    type: 'number',
    required: false,
    description: 'ID của di sản/cổ vật liên quan'
  },
  isRead: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Đã đọc'
  }
};