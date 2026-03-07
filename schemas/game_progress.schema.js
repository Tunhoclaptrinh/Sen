module.exports = {
  userId: {
    type: 'number',
    required: true,
    unique: true,
    foreignKey: 'users',
    description: 'User ID'
  },
  currentChapter: {
    type: 'number',
    required: false,
    default: 1,
    description: 'Chapter đang chơi'
  },
  totalSenPetals: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Tổng số Sen hoa (Petals)'
  },
  totalPoints: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Tổng điểm'
  },
  level: {
    type: 'number',
    required: false,
    default: 1,
    description: 'Level của player'
  },
  coins: {
    type: 'number',
    required: false,
    default: 1000,
    description: 'Tiền game'
  },
  unlockedChapters: {
    type: 'array',
    required: false,
    description: 'Chapters đã mở'
  },
  finishedChapters: {
    type: 'array',
    required: false,
    default: [],
    description: 'Chapters đã hoàn thành (đủ điều kiện mở chương sau)'
  },
  completedLevels: {
    type: 'array',
    required: false,
    description: 'Levels đã hoàn thành (IDs)'
  },
  levelReviewHistory: {
    type: 'array',
    required: false,
    default: [],
    description: 'Lịch sử ôn tập màn chơi (ID và số lần)'
  },
  collectedCharacters: {
    type: 'array',
    required: false,
    description: 'Characters đã thu thập'
  },
  badges: {
    type: 'array',
    required: false,
    description: 'Badges'
  },
  achievements: {
    type: 'array',
    required: false,
    description: 'Achievements'
  },
  museumOpen: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Bảo tàng có mở không'
  },
  museumIncome: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Thu nhập bảo tàng'
  },
  streakDays: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Số ngày chơi liên tiếp'
  },
  completedModules: {
    type: 'array',
    required: false,
    default: [],
    description: 'Danh sách bài học đã hoàn thành'
  },
  totalLearningTime: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Tổng thời gian học tập (phút)'
  },
  lastRewardClaim: {
    type: 'string', // ISO date string
    required: false,
    description: 'Lần cuối nhận thưởng hàng ngày'
  },
  lastLogin: {
    type: 'date',
    required: false,
    description: 'Lần login cuối'
  }
};
