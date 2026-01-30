module.exports = {
  title: {
    type: 'string',
    required: true,
    description: 'Tiêu đề bài viết'
  },
  short_description: {
    type: 'string',
    required: false,
    description: 'Mô tả ngắn'
  },
  shortDescription: {
    type: 'string',
    required: false,
    description: 'Mô tả ngắn (alias)'
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
  is_active: {
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
  category_id: {
    type: 'number',
    required: false,
    description: 'ID danh mục'
  },
  // Related items
  related_heritage_ids: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Di sản liên quan'
  },
  related_artifact_ids: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Hiện vật liên quan'
  },
  related_level_ids: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Màn chơi liên quan'
  },
  related_product_ids: {
    type: 'array',
    required: false,
    description: 'Danh sách ID Sản phẩm liên quan'
  },
  created_by: {
    type: 'number',
    required: false,
    foreignKey: 'users',
    description: 'ID người đóng góp'
  }
};
