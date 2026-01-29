module.exports = {
  name: {
    type: 'string',
    required: true,
    minLength: 3,
    maxLength: 150,
    description: 'Tên chapter (lớp cánh hoa sen)'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 20,
    maxLength: 1000,
    description: 'Mô tả chapter'
  },
  theme: {
    type: 'string',
    required: true,
    description: 'Chủ đề (VD: 18xx-19xx, Văn hóa Bắc Bộ)'
  },
  order: {
    type: 'number',
    required: true,
    min: 1,
    description: 'Thứ tự chapter'
  },
  required_petals: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Số cánh hoa sen cần để mở'
  },
  image: {
    type: 'string',
    required: false,
    description: 'Hình ảnh thumbnail'
  },

  is_active: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có active không'
  },
};
