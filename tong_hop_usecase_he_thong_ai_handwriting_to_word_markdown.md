# TÀI LIỆU PHÂN TÍCH THIẾT KẾ HỆ THỐNG
# HỆ THỐNG CHUYỂN CHỮ VIẾT TAY SANG FILE WORD BẰNG AI

---

# 1. Giới thiệu đề tài

## 1.1 Tên đề tài
Hệ thống chuyển chữ viết tay sang file Word bằng AI.

## 1.2 Mô tả đề tài
Hệ thống cho phép người dùng tải lên hình ảnh chứa chữ viết tay hoặc chữ in. AI OCR sẽ nhận diện nội dung văn bản trong ảnh và chuyển đổi thành file Word hoặc văn bản thuần.

Người dùng có thể:
- Chỉnh sửa nội dung trước khi xuất file
- Tải file Word về máy
- Xem lại lịch sử chuyển đổi nếu đã đăng nhập

Quản trị viên có thể:
- Quản lý người dùng
- Quản lý ảnh upload
- Quản lý file chuyển đổi
- Xem thống kê hệ thống

---

# 2. Phạm vi hệ thống

## 2.1 Chức năng dành cho khách

| Tên chức năng | Mô tả | Ghi chú |
|---|---|---|
| Tải ảnh lên | Upload ảnh chứa chữ viết tay | Bắt buộc |
| Nhận diện chữ viết tay | AI OCR xử lý ảnh | Bắt buộc |
| Chỉnh sửa văn bản | Sửa nội dung OCR | Bắt buộc |
| Xuất file Word | Xuất file .docx | Bắt buộc |
| Tải file xuống | Download file | Bắt buộc |

---

## 2.2 Chức năng dành cho người dùng

| Tên chức năng | Mô tả | Ghi chú |
|---|---|---|
| Đăng ký tài khoản | Tạo tài khoản mới | Bắt buộc |
| Đăng nhập | Xác thực tài khoản | Bắt buộc |
| Xem lịch sử chuyển đổi | Xem file đã xử lý | Bắt buộc |
| Tải lại file cũ | Download lại file | Bắt buộc |

---

## 2.3 Chức năng dành cho quản trị viên

| Tên chức năng | Mô tả | Ghi chú |
|---|---|---|
| Quản lý người dùng | Khóa/mở khóa tài khoản | Bắt buộc |
| Quản lý hình ảnh upload | Quản lý ảnh người dùng | Bắt buộc |
| Quản lý file chuyển đổi | Quản lý file Word | Bắt buộc |
| Xem thống kê hệ thống | Theo dõi hoạt động hệ thống | Không bắt buộc |

---

# 3. Đặc tả Use Case

---

# UC-01 — Đăng ký tài khoản

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-01 |
| Use case name | Đăng ký tài khoản |
| Description | Người dùng tạo tài khoản mới |
| Actor | Khách |
| Pre-condition(s) | Người dùng chưa đăng nhập |
| Basic flow | 1. Mở form đăng ký → 2. Nhập thông tin → 3. Nhấn đăng ký → 4. Hệ thống lưu tài khoản |
| Alternative flow | Email đã tồn tại |
| Business rules | Email phải duy nhất |
| Non-functional requirement | Phản hồi dưới 3 giây |

---

# UC-02 — Đăng nhập

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-02 |
| Use case name | Đăng nhập |
| Description | Người dùng đăng nhập hệ thống |
| Actor | Người dùng |
| Pre-condition(s) | Tài khoản tồn tại |
| Basic flow | 1. Nhập email/password → 2. Hệ thống xác thực → 3. Truy cập hệ thống |
| Alternative flow | Sai mật khẩu |
| Business rules | Mật khẩu phải mã hóa |
| Non-functional requirement | Hệ thống bảo mật JWT |

---

# UC-03 — Tải ảnh lên

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-03 |
| Use case name | Tải ảnh lên |
| Description | Người dùng upload ảnh chứa văn bản |
| Actor | Khách, Người dùng |
| Pre-condition(s) | Có file ảnh hợp lệ |
| Basic flow | 1. Chọn ảnh → 2. Upload ảnh → 3. Hệ thống lưu ảnh |
| Alternative flow | File không hợp lệ |
| Business rules | Chỉ hỗ trợ JPG, PNG |
| Non-functional requirement | Tối đa 10MB |

---

# UC-04 — Nhận diện chữ viết tay

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-04 |
| Use case name | Nhận diện chữ viết tay |
| Description | AI OCR nhận diện nội dung trong ảnh |
| Actor | Khách, Người dùng |
| Pre-condition(s) | Ảnh đã upload |
| Basic flow | 1. Gửi ảnh đến AI → 2. OCR xử lý → 3. Trả kết quả văn bản |
| Alternative flow | Ảnh quá mờ |
| Business rules | Hỗ trợ tiếng Việt |
| Non-functional requirement | Xử lý dưới 10 giây |

---

# UC-05 — Chỉnh sửa văn bản

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-05 |
| Use case name | Chỉnh sửa văn bản |
| Description | Người dùng chỉnh sửa nội dung OCR |
| Actor | Khách, Người dùng |
| Pre-condition(s) | Có dữ liệu OCR |
| Basic flow | 1. Hiển thị editor → 2. Chỉnh sửa nội dung → 3. Lưu dữ liệu |
| Alternative flow | Không có |
| Business rules | Guest không lưu tự động |
| Non-functional requirement | Editor phản hồi realtime |

---

# UC-06 — Xuất file Word

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-06 |
| Use case name | Xuất file Word |
| Description | Xuất nội dung thành file Word |
| Actor | Khách, Người dùng |
| Pre-condition(s) | Có nội dung OCR |
| Basic flow | 1. Chọn xuất file → 2. Tạo file .docx → 3. Tải file |
| Alternative flow | Lỗi tạo file |
| Business rules | File đúng định dạng |
| Non-functional requirement | Tạo file dưới 5 giây |

---

# UC-07 — Xem lịch sử chuyển đổi

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-07 |
| Use case name | Xem lịch sử chuyển đổi |
| Description | Người dùng xem danh sách file đã xử lý |
| Actor | Người dùng |
| Pre-condition(s) | Đã đăng nhập |
| Basic flow | 1. Mở lịch sử → 2. Hiển thị dữ liệu |
| Alternative flow | Chưa có dữ liệu |
| Business rules | Guest không có lịch sử |
| Non-functional requirement | Có phân trang dữ liệu |

---

# UC-08 — Quản lý người dùng

| Thuộc tính | Nội dung |
|---|---|
| Use case ID | UC-08 |
| Use case name | Quản lý người dùng |
| Description | Quản trị viên quản lý tài khoản người dùng |
| Actor | Quản trị viên |
| Pre-condition(s) | Admin đã đăng nhập |
| Basic flow | 1. Mở danh sách người dùng → 2. Chọn tài khoản → 3. Khóa/mở khóa tài khoản → 4. Hệ thống cập nhật dữ liệu |
| Alternative flow | Không tìm thấy tài khoản |
| Business rules | Chỉ admin được truy cập |
| Non-functional requirement | Có phân quyền quản trị |

---

# 4. Cơ sở dữ liệu đề xuất

## 4.1 Bảng User

| Tên trường | Kiểu dữ liệu |
|---|---|
| id | bigint |
| fullName | varchar |
| email | varchar |
| password | varchar |
| role | varchar |
| createdAt | datetime |

---

## 4.2 Bảng UploadedImage

| Tên trường | Kiểu dữ liệu |
|---|---|
| id | bigint |
| userId | bigint |
| imageUrl | text |
| status | varchar |
| createdAt | datetime |

---

## 4.3 Bảng OCRResult

| Tên trường | Kiểu dữ liệu |
|---|---|
| id | bigint |
| imageId | bigint |
| extractedText | text |
| formattedContent | longtext |
| createdAt | datetime |

---

## 4.4 Bảng ExportFile

| Tên trường | Kiểu dữ liệu |
|---|---|
| id | bigint |
| ocrResultId | bigint |
| fileUrl | text |
| fileType | varchar |

---

# 5. Công nghệ đề xuất

## Frontend
- ReactJS
- NextJS
- TailwindCSS

## Backend
- NodeJS Express
- ASP.NET Core

## Database
- PostgreSQL
- MySQL

## AI OCR
- PaddleOCR
- Tesseract OCR
- EasyOCR

---

# 6. Kết luận

Hệ thống chuyển chữ viết tay sang file Word bằng AI là một hệ thống ứng dụng AI OCR kết hợp xử lý tài liệu và quản lý người dùng.

Đề tài phù hợp cho:
- Đồ án môn học
- Đồ án tốt nghiệp
- Đề tài AI ứng dụng
- Đề tài phát triển Web Fullstack

