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
    maxLength: 3000,
    description: "Mô tả chi tiết",
  },
  short_description: {
    type: "string",
    required: false,
    maxLength: 500,
    description: "Mô tả ngắn gọn",
  },
  shortDescription: {
    type: "string",
    required: false,
    maxLength: 500,
    description: "Bí danh cho short_description",
  },
  historical_context: {
    type: "string",
    required: false,
    maxLength: 2000,
    description: "Bối cảnh lịch sử",
  },
  cultural_significance: {
    type: "string",
    required: false,
    maxLength: 2000,
    description: "Ý nghĩa văn hóa",
  },
  heritage_site_id: {
    type: "number",
    required: true,
    foreignKey: "heritage_sites",
    description: "Thuộc di sản nào",
  },
  category_id: {
    type: "number",
    required: true,
    foreignKey: "cultural_categories",
    description: "Phân loại",
  },
  artifact_type: {
    type: "enum",
    enum: ["sculpture", "painting", "document", "pottery", "textile", "tool", "weapon", "jewelry", "manuscript", "photograph", "other",],
    required: true,
    description: "Loại cổ vật",

  },
  year_created: {
    type: "number",
    required: false,
    description: "Năm tạo tác",
  },
  year_discovered: {
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
  location_in_site: {
    type: "string",
    required: false,
    description: "Vị trí trưng bày",
  },
  image: {
    type: "string",
    required: false,
    description: "Hình ảnh",
  },
  is_on_display: {
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
  related_heritage_ids: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID di sản liên quan",
  },
  related_history_ids: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID bài viết lịch sử liên quan",
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
