// HƯỚNG DẪN CÀI ĐẶT TỰ ĐỘNG TẠO TÀI KHOẢN, GỬI EMAIL & BÔI ĐỎ TỪ GOOGLE SHEET

function onSubmit(e) {
  var sheet = e.range.getSheet();
  var rowIdx = e.range.getRow();
  
  // Tự động tìm kiếm tên cột dựa trên từ khóa (để tránh lỗi do tên cột quá dài)
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var values = e.range.getValues()[0];
  
  var email = "", name = "", phone = "";
  var statusColIdx = -1; // Cột lưu trạng thái văn bản
  
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().toLowerCase();
    if (header.indexOf("email") !== -1) email = values[i];
    else if (header.indexOf("họ tên") !== -1 || header.indexOf("name") !== -1) name = values[i];
    else if (header.indexOf("số điện thoại") !== -1 || header.indexOf("sđt") !== -1 || header.indexOf("phone") !== -1) phone = values[i];
    else if (header.indexOf("trạng thái hệ thống") !== -1) statusColIdx = i + 1; // Google Sheet dùng index 1-based
  }
  
  // NẾU CHƯA CÓ CỘT "Trạng thái hệ thống" THÌ TỰ ĐỘNG KHỞI TẠO Ở CỘT CUỐI
  if (statusColIdx === -1) {
    statusColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusColIdx).setValue("Trạng thái hệ thống").setFontWeight("bold").setBackground("#d9ead3");
  }
  
  if (!email) {
    Logger.log("Không tìm thấy trường email trong form submission");
    return;
  }
  
  // KIỂM TRA MỘT CỜ DUY NHẤT LÀ TRUE ĐỂ BÁO ĐÂY LÀ KHÁCH VỪA BẤM SUBMIT FORM
  processAccount(sheet, rowIdx, email, name, phone, statusColIdx, null, true);
}

function processAccount(sheet, rowIdx, email, name, phone, statusColIdx, overrideColor, isInstantSubmit, isRetryFromError = false) {
  var WEBHOOK_URL = "https://brachial-elliot-poisedly.ngrok-free.dev/api/auth/google-form-register";
  var range = sheet.getRange(rowIdx, 1, 1, sheet.getLastColumn());
  
  // Dùng màu ưu tiên nếu được truyền vào, hoặc đọc trực tiếp từ sheet để đảm bảo độ tươi mới của dữ liệu
  var currentColor = overrideColor || range.getFontColors()[0][0]; 
  var statusRange = sheet.getRange(rowIdx, statusColIdx); // Ô Trạng Thái
  
  // Nếu màu chữ đã là Xanh Lá (#00b050 - Thành công) hoặc Đỏ (#ff0000 - Tạch/Trùng) -> BỎ QUA KHÔNG XỬ LÝ
  if (currentColor === "#00b050" || currentColor === "#ff0000") {
    return;
  }
  
  // KIỂM TRA EMAIL ĐÚNG ĐỊNH DẠNG (Có @ và dấu chấm) NGAY GIAI ĐOẠN ĐẦU
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  if (!emailRegex.test(email.toString().trim())) {
    range.setFontColor("#ff0000"); // Màu Đỏ
    range.setFontLine("line-through"); // Gạch ngang
    range.setBackground("#f3f3f3"); // Màu xám nhạt
    statusRange.setValue("Email sai format"); // Ghi trạng thái TEXT
    return; // Dừng luôn, khỏi gọi Backend hay gửi Mail gì cho tốn công
  }

  // NẾU XUẤT HIỆN LẦN 2 TRỞ LÊN TRONG SHEET MỚI LÀ TRÙNG -> ĐÁNH DẤU VÀ BỎ QUA GỌI API
  var isDuplicateInSheet = false;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var colEmailIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().toLowerCase().indexOf("email") !== -1) {
      colEmailIdx = i + 1;
      break;
    }
  }
  
  // Chỉ check trùng với các dòng PHÍA TRÊN dòng hiện tại
  if (colEmailIdx !== -1 && rowIdx > 2) {
    // Vị trí dòng hiện tại là rowIdx. Ta chỉ lấy từ dòng 2 đến trước dòng rowIdx, tức là số hàng bằng rowIdx - 2 
    var previousEmails = sheet.getRange(2, colEmailIdx, rowIdx - 2, 1).getValues();
    for (var k = 0; k < previousEmails.length; k++) {
      if (previousEmails[k][0].toString().trim().toLowerCase() === email.toString().trim().toLowerCase()) {
        isDuplicateInSheet = true;
        break;
      }
    }
  }

  if (isDuplicateInSheet) {
    range.setFontColor("#ff0000"); // Màu Đỏ
    range.setFontLine("line-through"); // Gạch ngang
    range.setBackground("#f3f3f3"); // Màu xám nhạt
    statusRange.setValue("Trùng Email"); // Ghi trạng thái TEXT
    
    // GỬI MAIL KIỂU MẮNG NHẸ NẾU HỌ VỪA MỚI SUBMIT (Không gửi nếu Auto Scan quét lại)
    if (isInstantSubmit) {
      sendDuplicateEmailAlert(email, name);
    }
    return; // Đã xử lý là trùng lặp thì dừng tại đây, không cần gọi Backend
  }

  var payload = {
    "email": email,
    "name": name,
    "phone": phone,
    "secret_token": "sen_webhook_secret_2026",
    "isRetry": isRetryFromError
  };
  
  var options = {
    "method" : "post",
    "contentType": "application/json",
    "payload" : JSON.stringify(payload),
    "muteHttpExceptions": true // Để script không bị crash nếu server lỗi 500
  };

  try {
    var response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    var statusCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    // Nếu tạo thành công (200 OK hoặc 201 Created)
    if (statusCode === 200 || statusCode === 201) {
      var responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error("Phản hồi không phải JSON hợp lệ: " + responseText);
      }
      
      // VÌ FORM GHI NHẬN ĐÂY LÀ LẦN ĐẦU TIÊN (isDuplicateInSheet = false)
      // NÊN DÙ LÀ TÀI KHOẢN MỚI HAY CŨ THÌ TRÊN SHEET VẪN RA XANH LÁ (OK)
      range.setFontColor("#00b050");
      range.setFontLine("none");
      range.setBackground(null);
      statusRange.setValue("OK"); // Ghi trạng thái TEXT
      
      // Tuy nhiên, CHỈ GỬI MAIL NẾU THỰC SỰ LÀ TÀI KHOẢN MỚI TINH TRONG DB
      // HOẶC NẾU BACKEND CỐ TÌNH TRẢ VỀ MẬT KHẨU RESET CHO KHÁCH LỖI MẠNG (randomPassword có độ dài > 0)
      if (responseData.isNew === true || responseData.randomPassword) {
        var newSubject = "Thư cảm ơn và thông tin đăng nhập Dự án SEN";
        var newBody = "Hệ thống yêu cầu bật HTML để xem nội dung email này.";
        var htmlBody = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: 'Playfair Display', serif; background-color: #8b1d1d; height: 100vh;">
          <tr>
            <td align="center" valign="middle" background="https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png" style="background-color: #8b1d1d; background-image: url('https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
              <div style="background-color: rgba(244, 239, 228, 0.15); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); padding: 50px 20px; width: 100%; box-sizing: border-box; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="max-width: 600px; width: 100%; margin: 80px auto; background-color: #fffcf5; border: 2px solid #c5a065; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(93, 64, 55, 0.25); text-align: left;">
                    <div style="background-color: #8b1d1d; border-bottom: 2px solid #5a1212; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #fff9e6; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">Chào mừng đến với SEN</h1>
                    </div>
                  <div style="padding: 40px 30px; color: #5d4037; line-height: 1.7; text-align: left;">
                      <p style="font-size: 17px; margin-top: 0;">Thân chào <strong>${name}</strong>,</p>
                      <p>Lời đầu tiên, đội ngũ phát triển <strong>Dự án SEN</strong> xin gửi lời cảm ơn chân thành nhất vì sự kiên nhẫn và đồng hành của bạn trong suốt thời gian qua. Chúng mình biết bạn đã chờ đợi khá lâu kể từ ngày đăng ký, và hôm nay, <strong>Dự án SEN đã sẵn sàng để đón những vị khách đầu tiên đến trải nghiệm.</strong></p>
                    
                    <h2 style="color: #8b1d1d; font-size: 19px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-top: 35px;">1. Thông tin đăng nhập</h2>
                    <p>Để bắt đầu hành trình của mình, bạn vui lòng sử dụng thông tin tài khoản dưới đây:</p>
                    <div style="background-color: #f9f9f9; padding: 18px 25px; border-radius: 8px; border-left: 4px solid #8b1d1d; margin: 20px 0;">
                        <p style="margin: 5px 0; font-family: Arial, sans-serif; font-size: 15px;"><strong>Tài khoản:</strong> ${email}</p>
                        <p style="margin: 5px 0; font-family: Arial, sans-serif; font-size: 15px;"><strong>Mật khẩu mặc định:</strong> ${responseData.randomPassword}</p>
                    </div>
                    <p style="font-size: 14px; color: #555555; font-style: italic;">Để bảo mật thông tin, sau khi đăng nhập thành công, bạn hãy truy cập vào mục <strong>Cài đặt tài khoản &rarr; Bảo mật &rarr; Đổi mật khẩu</strong> để thiết lập mật khẩu cá nhân mới.</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="https://sen-web-seven.vercel.app/" style="background-color: #8b1d1d; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; box-shadow: 0 4px 6px rgba(139, 29, 29, 0.2);">Truy cập nền tảng ngay</a>
                    </div>

                    <h2 style="color: #8b1d1d; font-size: 19px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-top: 35px;">2. Một vài lưu ý nhỏ</h2>
                    <p>Vì đây là phiên bản trải nghiệm đầu tiên, hệ thống không tránh khỏi một vài thiếu sót. Hiện tại dữ liệu thực tế vẫn đang trong quá trình đồng bộ, do đó một số nội dung có thể mang tính chất minh họa. Rất mong bạn thông cảm.</p>

                    <h2 style="color: #8b1d1d; font-size: 19px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-top: 35px;">3. Chúng mình rất cần Feedback của bạn</h2>
                    <p>Trải nghiệm của bạn chính là kim chỉ nam để Dự án SEN hoàn thiện hơn mỗi ngày. Bạn có thể gửi đánh giá, ý kiến đóng góp thông qua <strong>Phiếu Khảo Sát</strong> dưới đây:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://docs.google.com/forms/d/e/1FAIpQLSeHItAx3ejyzb9Tw5PU_RcVFs-SR4wX5QDGmO555FKhoCxI1g/viewform" style="background-color: #f4efe4; color: #8b1d1d; padding: 12px 35px; text-decoration: none; border-radius: 4px; font-weight: bold; border: 1px solid #c5a065; display: inline-block; font-family: Arial, sans-serif; font-size: 14px; letter-spacing: 0.5px;">Tham gia khảo sát</a>
                    </div>
                    
                    <p>Trong quá trình sử dụng, nếu bạn thấy bất kỳ lỗi hiển thị hay tính năng nào cần cài thiện khẩn cấp, hãy liên hệ qua <strong>Fanpage: SEN</strong> để nhận được sự hỗ trợ nhanh nhất.</p>
                    
                    <p style="margin-top: 35px; border-top: 1px dashed #dcdcdc; padding-top: 25px; font-style: italic; color: #666666; font-size: 15px;">Một lần nữa, cảm ơn bạn rất nhiều vì đã chờ đợi và trở thành một phần của hệ sinh thái di sản. Chúc bạn có những giây phút trải nghiệm tuyệt vời, đầy ý nghĩa.</p>
                </div>
                <div style="background-color: #fdfdfd; padding: 25px; text-align: center; font-size: 14px; color: #666666; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; font-family: Arial, sans-serif;">Trân trọng,</p>
                    <p style="margin: 8px 0 0 0; font-weight: bold; color: #8b1d1d; font-size: 18px;">Đội ngũ Dự án SEN</p>
                </div>
              </div>
            </div>
            </td>
          </tr>
        </table>
        `;
        GmailApp.sendEmail(email, newSubject, newBody, { htmlBody: htmlBody });
        
      } else {
        // NGƯỜI DÙNG CŨ GHI DANH LẠI HOẶC NGƯỜI LẠI TRÙNG LẶP SPAM
        Logger.log("Email lần đầu trong sheet nhưng đã tồn tại trên DB: " + email);
        
        // VÌ KHÁCH LẠI NGHỊCH FORM NỘP SPAM NHẦM LẦN NỮA -> THÔNG BÁO CHO HỌ BIẾT TÀI KHOẢN ĐÃ TỒN TẠI TỪ TRƯỚC RỒI ĐỪNG NỘP NỮA (Chỉ gửi lúc vừa Submit Form)
        // Lưu ý: Nếu là khách Rớt Mạng Hôm Qua (isRetryFromError), họ đã được lọt vào khối { isNew || randomPassword } ở trên để nhận Mail Chào Mừng Kèm Password rồi, nên không đi rớt xuống khối else này nữa!
        if (isInstantSubmit && !isRetryFromError) {
          sendDuplicateEmailAlert(email, name);
        }
      }
      
      
    } else if (statusCode === 400) {
      // TRƯỜNG HỢP 3: Lỗi 400 từ Backend Validation
      range.setFontColor("#ff0000"); // Đỏ
      range.setFontLine("line-through"); // Gạch ngang
      range.setBackground("#f3f3f3"); // Nền xám nhạt
      
      // Phân tích kỹ xem là sai Format hay sao để ghi Status Text chuẩn
      if (responseText.indexOf("Validation failed") !== -1 || responseText.indexOf("must be a valid email") !== -1) {
        statusRange.setValue("Email sai format");
      } else {
        statusRange.setValue("Lỗi 400");
      }
      
      Logger.log("Lỗi 400: " + responseText);
      
    } else {
      // Backend quang lỗi Server (ví dụ: 500, 404, 403)
      throw new Error("Backend lỗi - HTTP " + statusCode + ": " + responseText);
    }
    
  } catch (error) {
    Logger.log("Lỗi gửi webhook: " + error.toString());
    
    // CHỈ GỬI MAIL "ĐANG XỬ LÝ" LẦN ĐẦU TIÊN LÚC KHÁCH BẤM NÚT SUBMIT TRÊN FORM
    // KHÔNG GỬI LẠI TRONG CÁC LẦN QUÉT TỰ ĐỘNG HÀNG GIỜ NẾU SERVER TIẾP TỤC CHẾT
    if (isInstantSubmit) {
      var errSubject = "Thông báo: Đang xử lý tài khoản SEN";
      var errBody = "Hệ thống yêu cầu bật HTML để xem nội dung email này.";
      var errHtmlBody = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: 'Playfair Display', serif; background-color: #8b1d1d; height: 100vh;">
          <tr>
            <td align="center" valign="middle" background="https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png" style="background-color: #8b1d1d; background-image: url('https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
              <div style="background-color: rgba(244, 239, 228, 0.15); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); padding: 50px 20px; width: 100%; box-sizing: border-box; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="max-width: 600px; width: 100%; margin: 80px auto; background-color: #fffcf5; border: 2px solid #c5a065; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(93, 64, 55, 0.25); text-align: left;">
                    <div style="background-color: #8b1d1d; border-bottom: 2px solid #5a1212; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #fff9e6; margin: 0; font-size: 24px; letter-spacing: 1px;">Hệ thống đang xử lý</h1>
                    </div>
                  <div style="padding: 40px 30px; color: #5d4037; line-height: 1.7; text-align: left;">
                      <p style="font-size: 17px; margin-top: 0;">Thân chào <strong>${name}</strong>,</p>
                      <p>Hệ thống ghi nhận bạn đã gửi biểu mẫu đăng ký thành công. Tuy nhiên, <strong>máy chủ của chúng tôi hiện đang bảo trì hoặc quá tải</strong> nên tài khoản của bạn chưa thể khởi tạo ngay lúc này.</p>
                      <p>Xin bạn đừng quá lo lắng. Hệ thống thông minh của chúng tôi sẽ tạm lưu hồ sơ của bạn và tự động khởi tạo lại sau mỗi giờ. Bạn sẽ <strong>nhận được Email chứa thông tin tài khoản ngay khi máy chủ khôi phục</strong>.</p>
                      <p>Chúng tôi thành thật cáo lỗi về sự gián đoạn không mong muốn này.</p>
                      
                      <p style="margin-top: 35px; border-top: 1px dashed #dcdcdc; padding-top: 25px; font-style: italic; color: #886a64; font-size: 15px;">Mong bạn kiên nhẫn chờ đợi thêm một chút thời gian cùng chúng tôi.</p>
                  </div>
                  <div style="background-color: #f4efe4; padding: 25px; text-align: center; font-size: 14px; color: #886a64; border-top: 1px solid #c5a065;">
                      <p style="margin: 0; font-family: Arial, sans-serif;">Trân trọng,</p>
                      <p style="margin: 8px 0 0 0; font-weight: bold; color: #8b1d1d; font-size: 17px;">Đội ngũ Dự án SEN</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      `;
      try { GmailApp.sendEmail(email, errSubject, errBody, { htmlBody: errHtmlBody }); } catch(e) {}
    }
    
    // Đổi màu CHỮ thành Vàng để biết là đang Lỗi/Treo (Chuẩn mực Google Apps Script)
    range.setFontColor("#ff9900");
    range.setBackground(null); // Đảm bảo nền sạch sẽ
    range.setFontLine("none");
    statusRange.setValue("Lỗi tạo tài khoản"); 
  }
}

// HÀM KIỂM TRA SỨC KHỎE SERVER TRƯỚC KHI QUÉT
function pingBackend() {
  var WEBHOOK_URL = "https://brachial-elliot-poisedly.ngrok-free.dev/api/auth/google-form-register";
  var healthUrl = WEBHOOK_URL.replace("/auth/google-form-register", "/health");
  var options = {
    method: "get",
    muteHttpExceptions: true
  };
  try {
    var response = UrlFetchApp.fetch(healthUrl, options);
    if (response.getResponseCode() === 200) {
      return true; // Sống
    }
  } catch (e) {
    Logger.log("Ping failed: " + e.toString());
  }
  return false; // Chết
}

// HÀM QUÉT LẠI CÁC TÀI KHOẢN CHƯA THÀNH CÔNG (CHẠY MỖI 1 TIẾNG)
function retryFailedAccounts() {
  // BƯỚC 1: HEALTH CHECK - NẾU SERVER SẬP THÌ NGỪNG NGAY LẬP TỨC ĐỂ TRÁNH LỖI KÉO DÀI
  if (!pingBackend()) {
    Logger.log("Backend đang sập. Dừng lệnh quét lại để bảo vệ hệ thống.");
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var startRow = 2; // Bỏ qua dòng 1 vì là tiêu đề
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow < startRow) return;
  
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var dataRange = sheet.getRange(startRow, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  var fontColors = dataRange.getFontColors();
  
  // Tìm cột chứa data
  var colEmail = -1, colName = -1, colPhone = -1, statusColIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().toLowerCase();
    if (header.indexOf("email") !== -1) colEmail = i;
    else if (header.indexOf("họ tên") !== -1 || header.indexOf("name") !== -1) colName = i;
    else if (header.indexOf("số điện thoại") !== -1 || header.indexOf("sđt") !== -1 || header.indexOf("phone") !== -1) colPhone = i;
    else if (header.indexOf("trạng thái hệ thống") !== -1) statusColIdx = i + 1; // Google Sheet 1-based index
  }
  
  if (colEmail === -1) return; // Không có cột email thì bó tay
  
  // Tự sinh cột trạng thái nếu chưa có cho chắc
  if (statusColIdx === -1) {
    statusColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusColIdx).setValue("Trạng thái hệ thống").setFontWeight("bold").setBackground("#d9ead3");
  }

  // --- AUTOMATION: DỌN DẸP GIAO DIỆN (THEO CHUẨN AN TOÀN) ---
  // Lấy màu hiện tại để không "tẩy trắng" nhầm các màu Đỏ (Lỗi Cứng) hay Xanh (Thành Công)
  var currentFontColors = dataRange.getFontColors();
  
  // 3. Lấy ra Mảng Giá Trị của toàn bộ cột "Trạng thái hệ thống" TRƯỚC KHI TẨY nó để làm bằng chứng (thay cho màu sắc)
  var statusValues = [];
  if (statusColIdx !== -1) {
    statusValues = sheet.getRange(startRow, statusColIdx, lastRow - 1, 1).getValues();
    sheet.getRange(startRow, statusColIdx, lastRow - 1, 1).clearContent();
  }

  for (var r = 0; r < values.length; r++) {
    var rowFontColor = currentFontColors[r][0]; // Truy xuất màu hiện có 
    
    // NẾU LÀ THÀNH CÔNG (#00b050) HOẶC LỖI VALIDATE CỨNG (#ff0000) -> DỮ TRUYỀN KIẾP, BỎ QUA LUÔN CẢ DÒNG
    if (rowFontColor === "#00b050" || rowFontColor === "#ff0000") {
      continue; 
    }
    
    // NẾU KHÔNG PHẢI CÁC MÀU TRÊN (bao gồm tất cả mọi khách lỗi Server, form treo...) -> TẨY TRẮNG BACKGROUND, CHỮ ĐEN NHƯ SẾP MUỐN
    sheet.getRange(r + startRow, 1, 1, lastCol).setFontColor("#000000").setBackground(null).setFontLine("none");
    
    var email = values[r][colEmail];
    var name = colName !== -1 ? values[r][colName] : "";
    var phone = colPhone !== -1 ? values[r][colPhone] : "";
    var currentStatusText = statusValues.length > 0 ? statusValues[r][0] : "";
    
    if (email) {
      // Dựa vào việc trước khi tẩy, ô trạng thái từng in chữ "Lỗi tạo tài khoản" để kết luận thằng này là Lỗi Server Rớt Mạng thay vì dựa vào màu như cũ
      var isRetryFromError = (currentStatusText.toString().indexOf("Lỗi tạo tài khoản") !== -1);
      
      // Truyền trạng thái, kèm theo cờ "Gửi bù mail hay không" vô hàm xử lý
      processAccount(sheet, r + startRow, email, name, phone, statusColIdx, "#000000", false, isRetryFromError);
      
      // Tạm dừng 1.5 giây giữa các lần quét để Backend xử lý kịp
      Utilities.sleep(1500);
    }
  }
}

// ==== HÀM GỬI EMAIL CHUYÊN DỤNG CHO DÂN GÕ TRÙNG LOGIC KHÔNG LÀM DÀI CODE CHÍNH ====
function sendDuplicateEmailAlert(receiverEmail, receiverName) {
  var subject = "Thông báo: Email đã được khai báo trên hệ thống SEN";
  var body = "Hệ thống yêu cầu bật HTML để xem nội dung email này.";
  var htmlBody = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-family: 'Playfair Display', serif; background-color: #8b1d1d; height: 100vh;">
          <tr>
            <td align="center" valign="middle" background="https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png" style="background-color: #8b1d1d; background-image: url('https://sen-web-seven.vercel.app/assets/background-full-Dx76C5xY.png'); background-size: cover; background-position: center center; background-repeat: no-repeat;">
              <div style="background-color: rgba(244, 239, 228, 0.15); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); padding: 50px 20px; width: 100%; box-sizing: border-box; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
                <div style="max-width: 600px; width: 100%; margin: 80px auto; background-color: #fffcf5; border: 2px solid #c5a065; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 40px rgba(93, 64, 55, 0.25); text-align: left;">
                    <div style="background-color: #8b1d1d; border-bottom: 2px solid #5a1212; padding: 30px 20px; text-align: center;">
                        <h1 style="color: #fff9e6; margin: 0; font-size: 26px; font-weight: bold; letter-spacing: 1px;">Tài khoản đã tồn tại</h1>
                    </div>
                  <div style="padding: 40px 30px; color: #333333; line-height: 1.7; text-align: left;">
                      <p style="font-size: 17px; margin-top: 0;">Thân chào <strong>${receiverName}</strong>,</p>
                      <p>Hệ thống ghi nhận bạn vừa thực hiện điền Form đăng ký với địa chỉ Email: <strong><span style="font-family: Arial, sans-serif; color: #8b1d1d;">${receiverEmail}</span></strong>.</p>
                      <p>Tuy nhiên, Email này <strong>ĐÃ CÓ TRONG HỆ THỐNG</strong> do bạn đã tạo tài khoản trước đây, hoặc do có sự trùng lặp thao tác gửi Form. Lượt đăng ký mới này đã được hệ thống tự động hủy bỏ để bảo lưu dữ liệu gốc của bạn.</p>
                      <p>Bạn không cần phải điền lại biểu mẫu thêm bất kỳ lần nào nữa. Vui lòng sử dụng thông tin cũ để đăng nhập vào trải nghiệm.</p>
                      
                      <div style="text-align: center; margin: 35px 0;">
                          <a href="https://sen-web-seven.vercel.app/" style="background-color: #8b1d1d; color: #fff9e6; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif; font-size: 15px; border: 2px solid #5a1212; box-shadow: 0 4px 0 #5a1212;">Đăng nhập nền tảng</a>
                      </div>
                  </div>
                  <div style="background-color: #f4efe4; padding: 25px; text-align: center; font-size: 14px; color: #886a64; border-top: 1px solid #c5a065;">
                      <p style="margin: 0; font-family: Arial, sans-serif;">Trân trọng,</p>
                      <p style="margin: 8px 0 0 0; font-weight: bold; color: #8b1d1d; font-size: 18px;">Đội ngũ Dự án SEN</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </table>
  `;
  try { GmailApp.sendEmail(receiverEmail, subject, body, { htmlBody: htmlBody }); } catch(err) { Logger.log("Gửi mail nhắc trùng lỗi: " + err.toString()); }
}
