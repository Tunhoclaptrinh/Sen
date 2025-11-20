module.exports = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
    description: 'Tên người dùng'
  },
  email: {
    type: 'email',
    required: true,
    unique: true,
    description: 'Email duy nhất'
  },
  password: {
    type: 'string',
    required: true,
    minLength: 6,
    description: 'Mật khẩu (sẽ được hash)'
  },
  phone: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 11,
    description: 'Số điện thoại'
  },
  role: {
    type: 'enum',
    enum: ['customer', 'researcher', 'curator', 'admin'],
    required: false,
    default: 'customer',
    description: 'Vai trò người dùng'
  },
  bio: {
    type: 'string',
    required: false,
    maxLength: 500,
    description: 'Tiểu sử'
  },
  avatar: {
    type: 'string',
    required: false,
    description: 'Avatar URL'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Trạng thái hoạt động'
  }
};