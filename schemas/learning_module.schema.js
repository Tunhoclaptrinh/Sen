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
  content_type: {
    type: 'enum',
    enum: ['video', 'article', 'quiz'],
    required: false,
    default: 'article',
    description: 'Loại nội dung'
  },
  video_url: {
    type: 'string',
    required: false,
    description: 'URL video (nếu có)'
  },
  content: {
    type: 'string',
    required: false,
    description: 'Nội dung chi tiết (HTML/Markdown)'
  },
  difficulty: {
    type: 'enum',
    enum: ['easy', 'medium', 'hard'],
    required: false,
    default: 'easy',
    description: 'Độ khó'
  },
  estimated_duration: {
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
      passing_score: 70,
      questions: [
        {
          id: 1,
          question: "Câu hỏi 1?",
          options: ["A", "B", "C", "D"],
          correct_answer: 0,
          point: 10
        }
      ]
    }
  },
  is_active: {
    type: 'boolean',
    required: false,
    default: true,
    description: 'Kích hoạt'
  },
  created_by: {
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
  review_comment: {
    type: "string",
    required: false,
    description: "Phản hồi từ người duyệt"
  }
};
