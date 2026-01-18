module.exports = {
  type: {
    type: 'enum',
    enum: ['heritage_site', 'artifact', 'exhibition', 'article'],
    required: true,
    description: 'Loại yêu thích'
  },
  reference_id: {
    type: 'number',
    required: true,
    description: 'ID tài liệu'
  }
};