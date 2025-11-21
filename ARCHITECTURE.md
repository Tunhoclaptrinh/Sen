# Architecture Overview

Tài liệu này mô tả kiến trúc kỹ thuật của Frontend dự án Sen Web.

## 1. Cấu trúc thư mục (`src/`)

- **`api/`**: Chứa các cấu hình Axios (`config.js`) và các hàm gọi API được phân chia theo module (auth, heritage, artifact, v.v.).
- **`store/`**: Cấu hình Redux Store và các Slices (reducers/actions).
- **`pages/`**: Các trang giao diện chính (Views).
- **`routes/`**: Cấu hình định tuyến và các Route Guard (`PrivateRoute`, `AdminRoute`).
- **`utils/`**: Các hàm tiện ích (helpers), formatters, validators và constants.
- **`components/`**: (Dự kiến) Chứa các thành phần UI tái sử dụng.

## 2. State Management (Redux Toolkit)

Dự án sử dụng Redux Toolkit để quản lý trạng thái toàn cục. Store được chia thành các slices sau:

| Slice          | Mục đích                                            | File nguồn                        |
| :------------- | :-------------------------------------------------- | :-------------------------------- |
| **auth**       | Quản lý trạng thái đăng nhập, token, thông tin user | `store/slices/authSlice.js`       |
| **heritage**   | Quản lý dữ liệu di tích, tìm kiếm, filter           | `store/slices/heritageSlice.js`   |
| **artifact**   | Quản lý dữ liệu hiện vật                            | `store/slices/artifactSlice.js`   |
| **collection** | Quản lý bộ sưu tập cá nhân của user                 | `store/slices/collectionSlice.js` |
| **ui**         | Quản lý theme, sidebar, loading global              | `store/slices/uiSlice.js`         |
| **category**   | Danh mục phân loại                                  | `store/slices/categorySlice.js`   |
| **review**     | Đánh giá và bình luận                               | `store/slices/reviewSlice.js`     |

## 3. Luồng dữ liệu (Data Flow)

Dự án tuân theo mô hình luồng dữ liệu một chiều (Unidirectional Data Flow):

1.  **User Interaction:** Người dùng tương tác với UI (Click, Submit form).
2.  **Dispatch Action:** Component gửi (dispatch) một action (thường là `createAsyncThunk` cho các tác vụ bất đồng bộ).
3.  **API Call:** Thunk gọi các hàm trong thư mục `api/` (sử dụng Axios instance từ `api/config.js`).
4.  **Reducer Update:**
    - `pending`: Cập nhật trạng thái `loading = true`.
    - `fulfilled`: Cập nhật dữ liệu vào Store, `loading = false`.
    - `rejected`: Lưu thông báo lỗi vào state, hiển thị thông báo (Antd Message).
5.  **UI Re-render:** Các components sử dụng `useSelector` sẽ tự động cập nhật khi Store thay đổi.

## 4. Authentication & Authorization

- **Cơ chế:** Sử dụng JWT (JSON Web Token).
- **Lưu trữ:** Token và User Info được lưu trong `localStorage` (Keys: `VITE_TOKEN_KEY`).
- **Axios Interceptor:** Tự động đính kèm header `Authorization: Bearer {token}` vào mọi request nếu token tồn tại. Tự động logout nếu nhận mã lỗi 401.
- **Route Protection:**
  - `PrivateRoute`: Yêu cầu đăng nhập.
  - `AdminRoute`: Yêu cầu đăng nhập và role là `admin`.

## 5. Quy ước mã nguồn (Conventions)

- **Constants:** Sử dụng `src/utils/constants.js` để định nghĩa các giá trị cố định (Roles, Types, Enums).
- **Formatters:** Sử dụng `src/utils/formatters.js` để định dạng ngày tháng (Day.js), tiền tệ, số liệu.
- **Validators:** Kiểm tra dữ liệu đầu vào (email, phone) bằng `src/utils/validators.js`.
