module.exports = {
  type: {
    type: 'enum',
    enum: ['heritage_site', 'artifact', 'exhibition', 'history_article'],
    required: true,
    description: 'Loại đánh giá'
  },
  referenceId: {
    type: 'number',
    required: true,
    description: 'ID của mục được đánh giá'
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