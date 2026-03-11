module.exports = {
  userId: {
    type: 'number',
    required: true,
    foreignKey: 'users',
    description: 'ID người dùng thực hiện giao dịch phuc loi'
  },
  type: {
    type: 'string',
    required: true,
    description: 'Loai lich su phuc loi (exchange, redeem, ... )'
  },
  details: {
    type: 'object',
    required: false,
    description: 'Thong tin chi tiet giao dich'
  },
  createdAt: {
    type: 'date',
    required: false,
    description: 'Thoi diem tao ban ghi'
  }
};
