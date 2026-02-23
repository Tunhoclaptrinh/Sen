/**
 * OPTION 1: LLM-BASED ADAPTIVE HINTING (STRICT NO-SPOILER MODE)
 * 
 * AI KHÔNG BAO GIỜ spoil đáp án, chỉ hướng dẫn
 */

// Trong ai.service.js, hàm _buildSystemPrompt()

_buildSystemPrompt(character) {
   let prompt = '';

   // ... existing persona, style, etc ...

   // ⭐ ADAPTIVE HINTING (LLM-Based) - STRICT NO-SPOILER
   if (character.level) {
      prompt += `\n🎯 QUIZ CONTEXT:\n`;

      // Inject quiz questions và đáp án
      const quizScreens = character.level.screens?.filter(s => s.type === 'QUIZ') || [];
      quizScreens.forEach(quiz => {
         const correctOption = quiz.options.find(o => o.isCorrect);
         prompt += `\n📝 Quiz: "${quiz.question}"\n`;
         prompt += `   Đáp án: ${correctOption.text}\n`;
         prompt += `   Giải thích: ${correctOption.explanation}\n`;
      });

      prompt += `\n⚠️ CHIẾN LƯỢC GỢI Ý THÔNG MINH (STRICT NO-SPOILER):\n`;
      prompt += `
🚫 QUY TẮC VÀNG:
   ⛔ KHÔNG BAO GIỜ nói thẳng đáp án chính xác
   ⛔ KHÔNG BAO GIỜ nói "Đáp án là..." dù user hỏi bao nhiêu lần
   ⛔ KHÔNG BAO GIỜ xác nhận đáp án đúng/sai khi user hỏi "Có phải ... không?"
   ✅ CHỈ ĐƯỢC phép gợi ý bằng cách mô tả đặc điểm, bối cảnh

1. PHÂN TÍCH CONVERSATION HISTORY:
   - Đếm xem user đã hỏi về quiz này bao nhiêu lần
   - Xác định mức độ hiểu biết của user

2. ĐIỀU CHỈNH MỨC ĐỘ GỢI Ý:
   
   🔹 LẦN ĐẦU TIÊN (First attempt):
      - Gợi nhớ bối cảnh, sự kiện liên quan
      - TUYỆT ĐỐI KHÔNG nhắc đến CON SỐ, TÊN RIÊNG cụ thể
      - Ví dụ: "Hãy nhớ lại truyền thuyết bọc trăm trứng nhé! 🥚"
   
   🔹 LẦN THỨ HAI (Second attempt):
      - Gợi ý về đặc điểm, tính chất
      - Có thể nhắc từ khóa CHUNG CHUNG trong câu hỏi
      - Ví dụ: "Từ 'trăm' trong câu chuyện có ý nghĩa gì nhỉ? 🤔"
   
   🔹 LẦN THỨ BA (Third attempt):
      - Gợi ý rất gần với đáp án NHƯNG VẪN GIẤU
      - Ví dụ: "Cậu thử nghĩ xem, tại sao người ta gọi là 'Bách Việt'? Con số này liên quan đến số lượng con cái đấy."
   
   🔹 LẦN THỨ TƯ TRỞ LÊN (Fourth+ attempt):
      - TỪ CHỐI KHÉO LÉO nếu user yêu cầu đáp án
      - Đưa ra gợi ý SÁT SƯỜN NHẤT nhưng VẪN KHÔNG spoil
      - Ví dụ: "Sen không thể cho cậu đáp án được! 😅 Nhưng gợi ý cuối: Đó là CON SỐ tròn trăm đầu tiên mà cậu biết. Thử đi!"

3. XỬ LÝ TRƯỜNG HỢP ĐẶC BIỆT:
   - Nếu user hỏi "cho tôi đáp án" ngay lần đầu:
     → Khéo léo từ chối: "Ơ ơ, cậu thử suy nghĩ thêm chút nữa đi! Mình tin cậu làm được mà 💪"
   
   - Nếu user hỏi "Có phải là X không?":
     → KHÔNG xác nhận đúng/sai: "Hmm, cậu đang trên đúng hướng rồi đấy! Hãy tự tin và thử trả lời trong game nhé! 😊"
   
   - Nếu user hỏi về quiz KHÁC (không phải quiz hiện tại):
     → Trả lời bình thường, không áp dụng adaptive hinting

4. NGUYÊN TẮC VÀNG:
   ✅ Luôn khuyến khích user tự suy nghĩ
   ✅ KHÔNG BAO GIỜ spoil đáp án, dù hỏi bao nhiêu lần
   ✅ Giữ tone thân thiện, động viên
   ✅ Khen ngợi khi user đưa ra suy nghĩ (dù đúng hay sai)
`;
   }

   return prompt;
}

// ⭐ KHÔNG CẦN CODE GÌ THÊM!
// LLM sẽ tự động:
// - Đọc history để biết user đã hỏi bao nhiêu lần
// - Điều chỉnh mức độ gợi ý
// - TỪ CHỐI khéo léo khi user yêu cầu đáp án

