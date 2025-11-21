# Sen Web - Culture Vault (Di Sản Số)

Hệ thống quản lý và bảo tồn di sản văn hóa số, cho phép người dùng khám phá, lưu trữ và học tập về các di tích, hiện vật lịch sử.

## 📋 Giới thiệu

Dự án được xây dựng nhằm mục đích số hóa việc quản lý di sản, cung cấp nền tảng cho các nhà nghiên cứu, quản lý văn hóa và khách tham quan. Hệ thống hỗ trợ quản lý hiện vật, di tích, triển lãm trực tuyến và các tính năng gamification (nhiệm vụ, học tập).

## 🚀 Tính năng chính

- **Quản lý Di sản & Hiện vật:** Tra cứu, tìm kiếm và xem chi tiết các di tích, hiện vật lịch sử.
- **Bộ sưu tập cá nhân:** Người dùng có thể tạo và quản lý bộ sưu tập hiện vật yêu thích của riêng mình.
- **Triển lãm trực tuyến:** Tham quan các triển lãm số.
- **Học tập & Nhiệm vụ:** Hệ thống bài học và nhiệm vụ (Quests) có bảng xếp hạng.
- **Tương tác:** Đánh giá (Review), yêu thích (Favorite) và bình luận.
- **Phân quyền:** Hỗ trợ đa vai trò (Admin, Researcher, Curator, Customer).

## 🛠 Cài đặt & Chạy dự án

### Yêu cầu

- Node.js (v14 trở lên)
- npm hoặc yarn

### Các bước cài đặt

1.  **Clone dự án:**

    ```bash
    git clone <repository-url>
    cd sen-web
    ```

2.  **Cài đặt dependencies:**

    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Cấu hình môi trường:**
    Tạo file `.env` tại thư mục gốc và cấu hình các biến sau (tham khảo `src/api/config.js`):

    ```env
    VITE_API_BASE_URL=http://localhost:3000/api
    VITE_API_TIMEOUT=30000
    VITE_TOKEN_KEY=culturevault_token
    VITE_USER_KEY=culturevault_user
    ```

4.  **Chạy development server:**
    ```bash
    npm run dev
    ```

## 🏗 Công nghệ sử dụng

- **Frontend:** React.js
- **State Management:** Redux Toolkit
- **UI Framework:** Ant Design
- **HTTP Client:** Axios
- **Build Tool:** Vite

## 👥 Phân quyền người dùng

Hệ thống định nghĩa các vai trò sau (tham khảo `src/utils/constants.js`):

- `admin`: Quản trị hệ thống.
- `customer`: Người dùng phổ thông.
- `researcher`: Nhà nghiên cứu.
- `curator`: Người quản lý trưng bày.

---

© 2024 Sen Web Project
