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
  requiredPetals: {
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

  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Có active không'
  },
  createdBy: {
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
  author: {
    type: 'string',
    required: false,
    description: 'Tác giả (người đóng góp)'
  },
  publishDate: {
    type: 'string',
    required: false,
    description: 'Ngày đăng'
  },
  review_comment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  },
  relatedHeritageIds: {
    type: 'array',
    required: false,
    description: 'Di sản liên quan'
  },
  relatedArtifactIds: {
    type: 'array',
    required: false,
    description: 'Hiện vật liên quan'
  },
  relatedHistoryIds: {
    type: 'array',
    required: false,
    description: 'Bài viết lịch sử liên quan'
  }
};
