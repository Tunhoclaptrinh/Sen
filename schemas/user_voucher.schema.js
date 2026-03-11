module.exports = {
  userId: {
    type: 'number',
    required: true,
    foreignKey: 'users',
    description: 'ID người dùng sở hữu voucher'
  },
  voucherId: {
    type: 'number',
    required: true,
    foreignKey: 'vouchers',
    description: 'ID voucher đã đổi'
  },
  code: {
    type: 'string',
    required: true,
    description: 'Mã voucher đã phát cho người dùng'
  },
  redeemedAt: {
    type: 'date',
    required: false,
    description: 'Thời điểm đổi voucher'
  },
  isUsed: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Trạng thái sử dụng voucher'
  },
  usedAt: {
    type: 'date',
    required: false,
    description: 'Thời điểm dùng voucher'
  },
  createdAt: {
    type: 'date',
    required: false,
    description: 'Thời điểm tạo bản ghi'
  }
};
