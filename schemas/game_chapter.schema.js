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
  color: {
    type: 'string',
    required: false,
    default: '#1890ff',
    description: 'Màu sắc chủ đạo'
  },

  is_active: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có active không'
  },
  created_by: {
    type: 'number',
    required: false,
    foreignKey: 'users',
    description: 'ID người đóng góp'
  },
  status: {
    type: "enum",
    enum: ["draft", "pending", "published", "rejected"],
    default: "draft",
    required: false,
    description: "Trạng thái phê duyệt nội dung"
  },
  review_comment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  }
};
