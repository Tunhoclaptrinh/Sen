module.exports = {
  chapter_id: {
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
  type: {
    type: 'enum',
    enum: ['hidden_object', 'timeline', 'quiz', 'memory', 'puzzle'],
    required: true,
    description: 'Loại gameplay'
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
  required_level: {
    type: 'number',
    required: false,
    foreignKey: 'game_levels',
    description: 'Level trước cần hoàn thành'
  },
  background_image: {
    type: 'string',
    required: false,
    description: 'Ảnh nền màn chơi'
  },
  background_music: {
    type: 'string',
    required: false,
    description: 'Nhạc nền'
  },
  ai_character_id: {
    type: 'number',
    required: false,
    foreignKey: 'game_characters',
    description: 'AI character hướng dẫn'
  },
  knowledge_base: {
    type: 'string',
    required: false,
    description: 'Kiến thức cho AI'
  },
  clues: {
    type: 'array',
    required: false,
    description: 'Danh sách manh mối (JSON)'
  },
  artifact_ids: {
    type: 'array',
    required: false,
    description: 'Artifacts liên quan'
  },
  heritage_site_id: {
    type: 'number',
    required: false,
    foreignKey: 'heritage_sites',
    description: 'Di sản liên quan'
  },
  rewards: {
    type: 'object',
    required: false,
    description: 'Phần thưởng (JSON: {petals, coins, character})'
  },
  time_limit: {
    type: 'number',
    required: false,
    description: 'Giới hạn thời gian (giây)'
  },
  passing_score: {
    type: 'number',
    required: false,
    default: 70,
    description: 'Điểm tối thiểu để pass'
  },
  thumbnail: {
    type: 'string',
    required: false,
    description: 'Thumbnail'
  },
  is_active: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Active'
  }
};
