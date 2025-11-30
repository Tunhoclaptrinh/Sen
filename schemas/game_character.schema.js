module.exports = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    description: 'Tên nhân vật'
  },
  description: {
    type: 'string',
    required: false,
    maxLength: 1000,
    description: 'Mô tả nhân vật'
  },
  persona: {
    type: 'string',
    required: true,
    description: 'Tính cách, vai trò của AI'
  },
  speaking_style: {
    type: 'string',
    required: true,
    description: 'Phong cách nói chuyện'
  },
  avatar: {
    type: 'string',
    required: false,
    description: 'Avatar của character'
  },
  avatar_uncolored: {
    type: 'string',
    required: false,
    description: 'Avatar chưa tô màu'
  },
  rarity: {
    type: 'enum',
    enum: ['common', 'rare', 'epic', 'legendary'],
    required: false,
    default: 'common',
    description: 'Độ hiếm'
  },
  origin: {
    type: 'string',
    required: false,
    description: 'Nguồn gốc (VD: Múa rối nước)'
  },
  is_collectible: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có thể thu thập'
  }
};
