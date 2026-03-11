module.exports = {
  collection: 'ai_chat_history',
  userId: {
    type: 'number',
    required: true,
    description: 'ID người dùng (foreignKey)'
  },
  levelId: {
    type: 'number',
    required: false,
    description: 'ID màn chơi (nếu chat trong màn chơi)'
  },
  characterId: {
    type: 'number',
    required: true,
    description: 'ID nhân vật AI đang chat'
  },
  message: {
    type: 'string',
    required: true,
    description: 'Nội dung tin nhắn của người dùng'
  },
  response: {
    type: 'string',
    required: true,
    description: 'Nội dung câu trả lời của AI'
  },
  audioBase64: {
    type: 'string',
    required: false,
    description: 'Chuỗi base64 của audio lời nói AI (nếu có)'
  },
  context: {
    type: 'object',
    required: false,
    description: 'Dữ liệu ngữ cảnh đi kèm (thông tin di sản, hiện vật, recommended actions)'
  }
};
