module.exports = {
  title: {
    type: 'string',
    required: true,
    minLength: 5,
    maxLength: 200,
    description: 'Tiêu đề bài học'
  },
  description: {
    type: 'string',
    required: true,
    minLength: 10,
    maxLength: 2000,
    description: 'Mô tả bài học'
  },
  contentType: {
    type: 'enum',
    enum: ['video', 'article', 'interactive', 'quiz'],
    required: false,
    default: 'article',
    description: 'Loại nội dung'
  },
  videoUrl: {
    type: 'string',
    required: false,
    description: 'URL video (nếu có)'
  },
  contentUrl: {
    type: 'string',
    required: false,
    description: 'Nội dung chi tiết (HTML/Markdown) hoặc URL bên ngoài'
  },
  difficulty: {
    type: 'enum',
    enum: ['easy', 'medium', 'hard'],
    required: false,
    default: 'easy',
    description: 'Độ khó'
  },
  estimatedDuration: {
    type: 'number',
    required: false,
    default: 10,
    description: 'Thời gian ước tính (phút)'
  },
  thumbnail: {
    type: 'string',
    required: false,
    description: 'Thumbnail'
  },
  order: {
    type: 'number',
    required: false,
    default: 0,
    description: 'Thứ tự sắp xếp'
  },
  quiz: {
    type: 'object',
    required: false,
    description: 'Cấu trúc bài kiểm tra (JSON)',
    example: {
      passingScore: 70,
      questions: [
        {
          id: 1,
          question: "Câu hỏi 1?",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          point: 10
        }
      ]
    }
  },
  isActive: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Kích hoạt'
  },
  createdBy: {
    type: 'number',
    required: false,
    foreignKey: 'users',
    description: 'Người tạo'
  },
  status: {
    type: "enum",
    enum: ["draft", "pending", "published", "rejected"],
    default: "draft",
    required: false,
    description: "Trạng thái phê duyệt"
  },
  reviewComment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  }
};
