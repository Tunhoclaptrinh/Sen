module.exports = {
  type: {
    type: 'enum',
    enum: ['heritage_site', 'artifact'],
    required: true,
    description: 'Loại đánh giá'
  },
  heritageSiteId: {
    type: 'number',
    required: true,
    foreignKey: 'heritage_sites',
    description: 'Di sản'
  },
  rating: {
    type: 'number',
    required: true,
    min: 1,
    max: 5,
    description: 'Đánh giá (1-5 sao)'
  },
  comment: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 1000,
    description: 'Bình luận'
  }
};