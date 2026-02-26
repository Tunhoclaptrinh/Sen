const voucherSchema = {
  title: { type: 'string', required: true },
  description: { type: 'string', required: true },
  type: { type: 'enum', enum: ['travel', 'food', 'shop', 'discount', 'other'], required: true },
  provider: { type: 'string', required: true },
  price: { type: 'number', required: true },
  currencyType: { type: 'enum', enum: ['coins', 'petals', 'pcoin'], required: true },
  image: { type: 'string', required: false },
  expiryDate: { type: 'date', required: true },
  isActive: { type: 'boolean', default: true },
  totalQuantity: { type: 'number', required: true },
  remainingQuantity: { type: 'number', required: true },
  createdAt: { type: 'date' },
  updatedAt: { type: 'date' }
};

module.exports = voucherSchema;
