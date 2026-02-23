module.exports = {
  title: {
    type: 'string',
    required: true,
    description: 'Tiêu đề bài viết'
  },
  shortDescription: {
    type: 'string',
    required: false,
    description: 'Mô tả ngắn'
  },
  content: {
    type: 'string',
    required: true,
    description: 'Nội dung chi tiết'
  },
  image: {
    type: 'string',
    required: false,
    description: 'Hình ảnh đại diện'
  },
  gallery: {
    type: 'array',
    required: false,
    description: 'Bộ sưu tập hình ảnh'
  },
  author: {
    type: 'string',
    required: false,
    description: 'Tác giả'
  },
  publishDate: {
    type: 'string',
    required: false,
    description: 'Ngày đăng'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Trạng thái hiển thị'
  },
  views: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Lượt xem'
  },
  categoryId: {
    type: 'number',
    required: false,
    description: 'ID danh mục'
  },
  references: {
    type: 'string',
    required: false,
    maxLength: 30000,
    description: 'Nguồn tham khảo'
  },
  // Related items
  relatedHeritageIds: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Di sản liên quan'
  },
  relatedArtifactIds: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Hiện vật liên quan'
  },
  relatedHistoryIds: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Bài viết lịch sử liên quan'
  },
  relatedLevelIds: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Màn chơi liên quan'
  },
  relatedProductIds: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Sản phẩm liên quan'
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
  review_comment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  }
};
