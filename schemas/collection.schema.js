
// ===== schemas/collection.schema.js =====
module.exports = {
  name: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 150,
    description: 'Tên bộ sưu tập'
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 1000,
    description: 'Mô tả bộ sưu tập'
  },
  userId: {
    type: 'number',
    required: true,
    foreignKey: 'users',
    description: 'Người tạo bộ sưu tập'
  },
  items: {
    type: 'array',
    required: false,
    default: [],
    description: 'Danh sách mục trong bộ sưu tập (Di sản/Cổ vật)',
    // Structure of each item: { id, type, note, addedAt }
  },
  isPublic: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Công khai bộ sưu tập'
  }
};