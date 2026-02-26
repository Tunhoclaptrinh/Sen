module.exports = {
  name: {
    type: 'string',
    required: true,
    description: 'Tên item'
  },
  description: {
    type: 'string',
    required: false,
    description: 'Mô tả'
  },
  type: {
    type: 'enum',
    enum: ['powerup', 'character', 'theme', 'premium_ai', 'decoration', 'consumable_hint', 'consumable_shield', 'permanent_theme', 'permanent_avatar'],
    required: true,
    description: 'Loại item'
  },
  price: {
    type: 'number',
    required: true,
    min: 0,
    description: 'Giá'
  },
  currency: {
    type: 'enum',
    enum: ['coins', 'petals'],
    required: true,
    default: 'coins',
    description: 'Loại tiền tệ'
  },
  icon: {
    type: 'string',
    required: false,
    description: 'Icon item'
  },
  image: {
    type: 'string',
    required: false,
    description: 'Ảnh minh họa'
  },
  effect: {
    type: 'string',
    required: false,
    description: 'Hiệu ứng khi dùng (JSON/Key)'
  },
  isConsumable: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có tiêu hao không'
  },
  maxStack: {
    type: 'number',
    required: false,
    default: 99,
    description: 'Số lượng tối đa trong inventory'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Đang mở bán'
  }
};