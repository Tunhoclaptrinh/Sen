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
  speakingStyle: {
    type: 'string',
    required: true,
    description: 'Phong cách nói chuyện'
  },
  avatar: {
    type: 'string',
    required: false,
    description: 'Avatar của character'
  },
  avatarUncolored: {
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
  isCollectible: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có thể thu thập'
  },
  isDefault: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Nhân vật mặc định (luôn mở khóa)'
  },
  price: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Giá mua nhân vật'
  },
  unlockLevelId: {
    type: 'number',
    required: false,
    description: 'Level cần hoàn thành để mở khóa'
  },
  // Avatar: 2 trạng thái
  avatarLocked: {
    type: 'string',
    description: 'Ảnh đen trắng/mờ khi chưa mở khóa'
  },
  avatarUnlocked: {
    type: 'string',
    description: 'Ảnh có màu khi đã hoàn thành level'
  },

  // AI Persona: 2 trạng thái tâm lý
  personaAmnesia: {
    type: 'string',
    description: 'Prompt khi nhân vật đang mất trí nhớ (Ngơ ngác, hỏi người chơi là ai)'
  },
  personaRestored: {
    type: 'string',
    description: 'Prompt khi nhân vật đã nhớ lại (Vui vẻ, kể chuyện lịch sử)'
  },

  // Cho tính năng Bảo tàng sống
  museumInteraction: {
    type: 'string',
    description: 'Hành động khi click vào trong bảo tàng (VD: "Hát một đoạn chèo")'
  }
};
