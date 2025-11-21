# API Endpoints Specification

Tài liệu liệt kê các endpoints Backend cần cung cấp để Frontend hoạt động.
**Base URL:** `/api` (được cấu hình trong `config.js`)

## 1. Authentication (`auth.api.js`)

| Method | Endpoint                | Mô tả                       | Payload/Params                   |
| :----- | :---------------------- | :-------------------------- | :------------------------------- |
| POST   | `/auth/login`           | Đăng nhập                   | `{email, password}`              |
| POST   | `/auth/register`        | Đăng ký                     | User Data                        |
| POST   | `/auth/logout`          | Đăng xuất                   | -                                |
| GET    | `/auth/me`              | Lấy thông tin user hiện tại | -                                |
| PUT    | `/auth/change-password` | Đổi mật khẩu                | `{currentPassword, newPassword}` |

## 2. User Management (`user.api.js`)

| Method | Endpoint            | Mô tả                                      |
| :----- | :------------------ | :----------------------------------------- |
| GET    | `/users`            | Lấy danh sách users (hỗ trợ filter params) |
| GET    | `/users/:id`        | Chi tiết user                              |
| PUT    | `/users/:id`        | Admin cập nhật user                        |
| PUT    | `/users/profile`    | User tự cập nhật hồ sơ                     |
| PATCH  | `/users/:id/status` | Khóa/Mở khóa tài khoản                     |
| DELETE | `/users/:id`        | Xóa user                                   |

## 3. Heritage Sites (`heritage.api.js`)

| Method | Endpoint                        | Mô tả                      | Params Quan trọng                                |
| :----- | :------------------------------ | :------------------------- | :----------------------------------------------- |
| GET    | `/heritage-sites`               | Danh sách di tích          | `type`, `region`, `is_featured`, `unesco_listed` |
| GET    | `/heritage-sites/search`        | Tìm kiếm                   | `q` (query string)                               |
| GET    | `/heritage-sites/nearby`        | Tìm quanh đây              | `latitude`, `longitude`, `radius`                |
| GET    | `/heritage-sites/:id`           | Chi tiết di tích           | -                                                |
| GET    | `/heritage-sites/:id/artifacts` | Lấy hiện vật thuộc di tích | -                                                |
| GET    | `/heritage-sites/:id/timeline`  | Lấy dòng thời gian         | -                                                |
| POST   | `/heritage-sites`               | Tạo mới (Admin)            | -                                                |
| PUT    | `/heritage-sites/:id`           | Cập nhật (Admin)           | -                                                |
| DELETE | `/heritage-sites/:id`           | Xóa (Admin)                | -                                                |

## 4. Artifacts (`artifact.api.js`)

| Method | Endpoint                 | Mô tả              | Params                       |
| :----- | :----------------------- | :----------------- | :--------------------------- |
| GET    | `/artifacts`             | Danh sách hiện vật | `artifact_type`, `condition` |
| GET    | `/artifacts/search`      | Tìm kiếm hiện vật  | `q`                          |
| GET    | `/artifacts/:id`         | Chi tiết hiện vật  | -                            |
| GET    | `/artifacts/:id/related` | Hiện vật liên quan | -                            |
| POST   | `/artifacts`             | Tạo mới            | -                            |
| PUT    | `/artifacts/:id`         | Cập nhật           | -                            |
| DELETE | `/artifacts/:id`         | Xóa                | -                            |

## 5. Collections (`collection.api.js`)

| Method | Endpoint                                 | Mô tả                     |
| :----- | :--------------------------------------- | :------------------------ |
| GET    | `/collections`                           | Lấy danh sách BST cá nhân |
| GET    | `/collections/:id`                       | Chi tiết BST              |
| POST   | `/collections`                           | Tạo BST                   |
| PUT    | `/collections/:id`                       | Cập nhật thông tin BST    |
| DELETE | `/collections/:id`                       | Xóa BST                   |
| POST   | `/collections/:id/artifacts/:artifactId` | Thêm hiện vật vào BST     |
| DELETE | `/collections/:id/artifacts/:artifactId` | Xóa hiện vật khỏi BST     |

## 6. Reviews & Favorites

**Reviews (`review.api.js`):**

- `GET /reviews`: Lấy tất cả.
- `GET /reviews/type/:type`: Lấy theo loại (heritage/artifact).
- `POST /reviews`: Tạo đánh giá.
- `GET /reviews/search`: Tìm kiếm đánh giá.

**Favorites (`favorite.api.js`):**

- `GET /favorites`: Lấy danh sách yêu thích.
- `POST /favorites/:type/:id/toggle`: Bật/Tắt yêu thích.
- `GET /favorites/:type/:id/check`: Kiểm tra trạng thái yêu thích.

## 7. Exhibitions (`exhibition.api.js`)

- `GET /exhibitions`: Tất cả triển lãm.
- `GET /exhibitions/active`: Triển lãm đang diễn ra.
- CRUD cơ bản: `GET /:id`, `POST`, `PUT`, `DELETE`.

## 8. Gamification (`quest.api.js`, `learning.api.js`)

**Quests:**

- `GET /quests/available`: Nhiệm vụ khả dụng.
- `GET /quests/leaderboard`: Bảng xếp hạng.
- `POST /quests/:id/complete`: Hoàn thành nhiệm vụ.

**Learning:**

- `GET /learning/path`: Lộ trình học tập.
- `POST /learning/:id/complete`: Hoàn thành bài học.
