module.exports = {
  name: {
    type: "string",
    required: true,
    // unique: true,
    minLength: 5,
    maxLength: 200,
    description: "Tên di sản văn hóa",
  },
  shortDescription: {
    type: "string",
    required: false,
    maxLength: 500,
    description: "Mô tả ngắn gọn về di sản",
  },
  description: {
    type: "string",
    required: true,
    minLength: 10,
    // tạm thời
    maxLength: 30000,
    description: "Mô tả chi tiết về di sản",
  },
  type: {
    type: "enum",
    enum: ["monument", "temple", "museum", "archaeological_site", "historic_building", "natural_heritage", "intangible_heritage",],
    required: false,
    default: "monument",
    description: "Loại di sản",

  },
  culturalPeriod: {
    type: "string",
    required: false,
    description: "Thời kỳ văn hóa (VD: Triều Nguyễn, Thời Lý, ...)",
  },
  region: {
    type: "string",
    required: false,
    description: "Vùng miền (Bắc, Trung, Nam)",
  },
  province: {
    type: "string",
    required: false,
    description: "Tỉnh/Thành phố",
  },
  latitude: {
    type: "number",
    required: false,
    min: -90,
    max: 90,
    description: "GPS latitude",
  },
  longitude: {
    type: "number",
    required: false,
    min: -180,
    max: 180,
    description: "GPS longitude",
  },
  address: {
    type: "string",
    required: true,
    minLength: 10,
    maxLength: 300,
    description: "Địa chỉ cụ thể",
  },
  yearEstablished: {
    type: "number",
    required: false,
    description: "Năm thành lập/xây dựng",
  },
  yearRestored: {
    type: "number",
    required: false,
    description: "Năm tu bổ gần nhất",
  },
  image: {
    type: "string",
    required: false,
    description: "URL hình ảnh chính",
  },
  gallery: {
    type: "array",
    required: false,
    description: "Bộ sưu tập hình ảnh",
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
  visitHours: {
    type: "string",
    required: false,
    description: "Giờ mở cửa (VD: 8:00 - 17:00)",
  },
  entranceFee: {
    type: "number",
    required: false,
    default: 0,
    description: "Phí vào cửa (VNĐ)",
  },
  isActive: {
    type: "boolean",
    required: false,
    default: true,
    description: "Đang hoạt động",
  },
  unescoListed: {
    type: "boolean",
    required: false,
    default: false,
    description: "Được UNESCO công nhận",
  },
  significance: {
    type: "enum",
    enum: ["local", "national", "international"],
    required: false,
    default: "local",
    description: "Tầm quan trọng",

  },
  historicalEvents: {
    type: "array",
    required: false,
    description: "Các sự kiện lịch sử liên quan",
  },
  legends: {
    type: "array",
    required: false,
    description: "Các câu chuyện dã sử, truyền thuyết",
  },
  references: {
    type: "string",
    required: false,
    maxLength: 30000,
    description: "Nguồn tham khảo",
  },
  visitCount: {
    type: "number",
    required: false,
    default: 0,
    description: "Số lượt khám phá (gamification)",
  },
  views: {
    type: "number",
    required: false,
    default: 0,
    description: "Lượt xem",
  },
  categoryId: {
    type: "number",
    required: false,
    foreignKey: "cultural_categories",
    description: "ID danh mục văn hóa",
  },
  // Related items (admin-managed)
  relatedArtifactIds: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID hiện vật liên quan",
  },
  relatedHistoryIds: {
    type: "array",
    items: { type: "number" },
    required: false,
    description: "Danh sách ID bài viết lịch sử liên quan",
  },
  timeline: {
    type: "array",
    required: false,
    description: "Dòng thời gian sự kiện",
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
