module.exports = {
  name: {
    type: 'string',
    required: true,
    unique: true,
    minLength: 5,
    maxLength: 200,
    description: 'Tên di sản'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 20,
    maxLength: 5000,
    description: 'Mô tả chi tiết'
  },
  type: {
    type: 'enum',
    enum: ['monument', 'temple', 'museum', 'archaeological_site', 'historic_building', 'natural_heritage', 'intangible_heritage'],
    required: true,
    description: 'Loại di sản'
  },
  cultural_period: {
    type: 'string',
    required: true,
    description: 'Thời kỳ'
  },
  region: {
    type: 'string',
    required: true,
    description: 'Vùng'
  },
  latitude: {
    type: 'number',
    required: false,
    min: -90,
    max: 90,
    description: 'GPS latitude'
  },
  longitude: {
    type: 'number',
    required: false,
    min: -180,
    max: 180,
    description: 'GPS longitude'
  },
  address: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 300,
    description: 'Địa chỉ'
  },
  year_established: {
    type: 'number',
    required: false,
    description: 'Năm thành lập'
  },
  year_restored: {
    type: 'number',
    required: false,
    description: 'Năm tu bổ'
  },
  image: {
    type: 'string',
    required: false,
    description: 'Hình ảnh'
  },
  rating: {
    type: 'number',
    required: false,
    min: 0,
    max: 5,
    default: 0,
    description: 'Đánh giá'
  },
  total_reviews: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Số đánh giá'
  },
  visit_hours: {
    type: 'string',
    required: false,
    description: 'Giờ mở cửa'
  },
  entrance_fee: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Phí vào'
  },
  is_active: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Hoạt động'
  },
  unesco_listed: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'UNESCO công nhận'
  },
  significance: {
    type: 'enum',
    enum: ['local', 'national', 'international'],
    required: false,
    default: 'local',
    description: 'Tầm quan trọng'
  }
};
