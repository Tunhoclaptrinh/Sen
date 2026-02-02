module.exports = {
  code: {
    type: 'string',
    required: true,
    unique: true,
    minLength: 6,
    maxLength: 20,
    description: 'Mã QR/scan code'
  },
  name: {
    type: 'string',
    required: true,
    description: 'Tên vật thể'
  },
  type: {
    type: 'enum',
    enum: ['artifact', 'heritage_site', 'character'],
    required: true,
    description: 'Loại'
  },
  referenceId: {
    type: 'number',
    required: true,
    description: 'ID artifact/site'
  },
  latitude: {
    type: 'number',
    required: false,
    description: 'GPS latitude'
  },
  longitude: {
    type: 'number',
    required: false,
    description: 'GPS longitude'
  },
  rewardCoins: {
    type: 'number',
    required: false,
    default: 100,
    description: 'Coins thưởng'
  },
  rewardPetals: {
    type: 'number',
    required: false,
    default: 1,
    description: 'Petals thưởng'
  },
  rewardCharacter: {
    type: 'string',
    required: false,
    description: 'Character thưởng'
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Active'
  }
};