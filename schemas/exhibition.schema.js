module.exports = {
  name: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200,
    description: 'Tên triển lãm'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 20,
    maxLength: 2000,
    description: 'Mô tả triển lãm'
  },
  heritageSiteId: {
    type: 'number',
    required: true,
    foreignKey: 'heritage_sites',
    description: 'Địa điểm tổ chức'
  },
  theme: {
    type: 'string',
    required: true,
    maxLength: 200,
    description: 'Chủ đề'
  },
  startDate: {
    type: 'date',
    required: true,
    description: 'Ngày khai mạc'
  },
  endDate: {
    type: 'date',
    required: true,
    description: 'Ngày đóng'
  },
  curator: {
    type: 'string',
    required: false,
    maxLength: 200,
    description: 'Người quản lý'
  },
  reviewComment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  },
  image: {
    type: 'string',
    required: false,
    description: 'Poster'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Đang diễn ra'
  },
  createdBy: {
    type: 'number',
    required: false,
    foreignKey: 'users',
    description: 'ID người đóng góp'
  },
  status: {
    type: 'enum',
    values: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft',
    description: 'Trạng thái kiểm duyệt'
  },
  review_comment: {
    type: 'string',
    required: false,
    maxLength: 500,
    description: 'Bình luận của người kiểm duyệt'
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
