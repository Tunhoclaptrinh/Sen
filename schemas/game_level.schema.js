// schemas/game_level.schema.js
module.exports = {
  chapterId: {
    type: 'number',
    required: true,
    foreignKey: 'game_chapters',
    description: 'Thuộc chapter nào'
  },
  name: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 150,
    description: 'Tên màn chơi'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 20,
    maxLength: 2000,
    description: 'Mô tả màn chơi'
  },

  difficulty: {
    type: 'enum',
    enum: ['easy', 'medium', 'hard'],
    required: false,
    default: 'medium',
    description: 'Độ khó'
  },
  order: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Thứ tự trong chapter'
  },
  requiredLevel: {
    type: 'number',
    required: false,
    foreignKey: 'game_levels',
    description: 'Level trước cần hoàn thành'
  },

  // === AI CHARACTER CONFIG ===
  aiCharacterId: {
    type: 'number',
    required: false,
    foreignKey: 'game_characters',
    description: 'AI character hướng dẫn'
  },
  knowledgeBase: {
    type: 'string',
    required: false,
    description: 'Kiến thức cho AI (plain text hoặc markdown)'
  },

  // === SCREENS CONFIGURATION (CORE FEATURE) ===
  screens: {
    type: 'array',
    required: true,
    description: 'Danh sách các màn hình trong level (JSON Array)',
    example: [
      {
        id: 'screen_01',
        type: 'DIALOGUE',
        backgroundImage: 'url',
        backgroundMusic: 'url',
        content: [
          { speaker: 'AI', text: 'Chào bạn!', avatar: 'url', audio: 'base64_string' }
        ],
        nextScreenId: 'screen_02',
        skipAllowed: true
      },
      {
        id: 'screen_02',
        type: 'HIDDEN_OBJECT',
        backgroundImage: 'url',
        guideText: 'Tìm 3 vật phẩm...',
        items: [
          {
            id: 'item1',
            name: 'Cái quạt',
            coordinates: { x: 15, y: 45, width: 10, height: 10 },
            factPopup: 'Đây là cái quạt mo',
            onCollectEffect: 'play_sound_fan',
            points: 10
          }
        ],
        requiredItems: 3,
        nextScreenId: 'screen_03',
        aiHintsEnabled: true
      },
      {
        id: 'screen_03',
        type: 'QUIZ',
        question: 'Câu hỏi về vật phẩm vừa tìm?',
        options: [
          { text: 'Đáp án A', isCorrect: false },
          { text: 'Đáp án B', isCorrect: true }
        ],
        timeLimit: 60,
        nextScreenId: 'screen_04',
        reward: {
          points: 50,
          coins: 20
        }
      }
    ],
    custom: (value) => {
      if (!Array.isArray(value)) return 'screens must be an array';

      const errors = [];
      const screenIds = new Set();

      value.forEach((screen, idx) => {
        // Check required fields
        if (!screen.id) errors.push(`Screen ${idx}: Missing id`);
        if (!screen.type) errors.push(`Screen ${idx}: Missing type`);

        // Check duplicate IDs
        if (screen.id && screenIds.has(screen.id)) {
          errors.push(`Screen ${idx}: Duplicate id '${screen.id}'`);
        }
        screenIds.add(screen.id);

        // Type-specific validation
        if (screen.type === 'QUIZ' && !screen.options) {
          errors.push(`Screen ${idx}: QUIZ requires options`);
        }
        if (screen.type === 'HIDDEN_OBJECT' && !screen.items) {
          errors.push(`Screen ${idx}: HIDDEN_OBJECT requires items`);
        }
        if (screen.type === 'TIMELINE' && !screen.events) {
          errors.push(`Screen ${idx}: TIMELINE requires events`);
        }
      });

      return errors.length > 0 ? errors.join('; ') : null;
    }
  },

  // === COMPLETION & REWARDS ===
  rewards: {
    type: 'object',
    required: false,
    description: 'Phần thưởng khi hoàn thành (JSON)',
    example: {
      petals: 2,
      coins: 100,
      character: 'teu_full_color',
      badges: ['badge_01']
    }
  },
  timeLimit: {
    type: 'number',
    required: false,
    description: 'Giới hạn thời gian toàn bộ level (giây)'
  },
  passingScore: {
    type: 'number',
    required: false,
    default: 70,
    description: 'Điểm tối thiểu để pass'
  },

  // === METADATA ===
  thumbnail: {
    type: 'string',
    required: false,
    description: 'Thumbnail cho level'
  },

  backgroundMusic: {
    type: 'string',
    required: false,
    description: 'Nhạc nền mặc định'
  },

  artifactIds: {
    type: 'array',
    required: false,
    description: 'Artifacts liên quan'
  },
  heritageSiteId: {
    type: 'number',
    required: false,
    foreignKey: 'heritage_sites',
    description: 'Di sản liên quan'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Active'
  },
  createdBy: {
    type: 'number',
    required: false,
    foreignKey: 'users',
    description: 'Admin/Creator ID'
  }
};
