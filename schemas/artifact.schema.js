module.exports = {
  name: {
    type: "string",
    required: true,
    minLength: 3,
    maxLength: 150,
    description: "Tên tư liệu/cổ vật",
  },
  description: {
    type: "string",
    required: true,
    minLength: 20,
    maxLength: 15000,
    description: "Mô tả chi tiết",
  },
  shortDescription: {
    type: "string",
    required: false,
    maxLength: 500,
    description: "Mô tả ngắn gọn",
  },
  historicalContext: {
    type: "string",
    required: false,
    maxLength: 10000,
    description: "Bối cảnh lịch sử",
  },
  culturalSignificance: {
    type: "string",
    required: false,
    maxLength: 10000,
    description: "Ý nghĩa văn hóa",
  },
  references: {
    type: "string",
    required: false,
    maxLength: 30000,
    description: "Nguồn tham khảo",
  },
  heritageSiteId: {
    type: "number",
    required: false,
    foreignKey: "heritage_sites",
    description: "Thuộc di sản nào",
  },
  categoryId: {
    type: "number",
    required: true,
    foreignKey: "cultural_categories",
    description: "Phân loại",
  },
  artifactType: {
    type: "enum",
    enum: ["sculpture", "painting", "document", "pottery", "textile", "tool", "weapon", "jewelry", "manuscript", "photograph", "other",],
    required: true,
    description: "Loại cổ vật",

  },
  yearCreated: {
    type: "number",
    required: false,
    description: "Năm tạo tác",
  },
  yearDiscovered: {
    type: "number",
    required: false,
    description: "Năm phát hiện",
  },
  creator: {
    type: "string",
    required: false,
    maxLength: 200,
    description: "Tác giả",
  },
  material: {
    type: "string",
    required: false,
    maxLength: 200,
    description: "Chất liệu",
  },
  dimensions: {
    type: "string",
    required: false,
    maxLength: 100,
    description: "Kích thước",
  },
  weight: {
    type: "number",
    required: false,
    description: "Trọng lượng (kg)",
  },
  condition: {
    type: "enum",
    enum: ["excellent", "good", "fair", "poor", "GOOD", "FAIR", "POOR", "EXCELLENT",],
    required: false,
    default: "fair",
    description: "Tình trạng",

  },
  locationInSite: {
    type: "string",
    required: false,
    description: "Vị trí trưng bày",
  },
  image: {
    type: "string",
    required: false,
    description: "Hình ảnh",
  },
  isOnDisplay: {
    type: "boolean",
    required: false,
    default: true,
    description: "Đang trưng bày",
  },
  gallery: {
    type: "array",
    required: false,
    description: "Bộ sưu tập hình ảnh",
  },
  views: {
    type: "number",
    required: false,
    default: 0,
    description: "Lượt xem",
  },
  // Related items (admin-managed)
  relatedArtifactIds: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID hiện vật liên quan",
  },
  relatedHeritageIds: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID di sản liên quan",
  },
  relatedHistoryIds: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID bài viết lịch sử liên quan",
  },
  rating: {
    type: "number",
    required: false,
    min: 0,
    max: 5,
    default: 0,
    description: "Đánh giá trung bình",
  },
  totalReviews: {
    type: "number",
    required: false,
    default: 0,
    description: "Tổng số đánh giá",
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
