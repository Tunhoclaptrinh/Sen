module.exports = {
  id: { type: 'number', unique: true, index: true },
  title: { type: 'string', required: true },
  description: { type: 'string' },
  thumbnail: { type: 'string' },
  type: { type: 'string' },
  category: { type: 'string' },
  difficulty: { type: 'string' },
  isActive: { type: 'boolean', default: true },
  requirements: { type: 'array' },
  rewards: { type: 'array' }
};
