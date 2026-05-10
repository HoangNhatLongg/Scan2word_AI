# Scan2Word AI

Hệ thống chuyển chữ viết tay sang file Word bằng AI.

## Yêu cầu

- Node.js 18+
- npm hoặc yarn

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Tạo database và chạy migrations
npx prisma generate
npx prisma db push

# Khởi động development server
npm run dev
```

## Cách sử dụng

1. Mở trình duyệt tại `http://localhost:3000`
2. Tải ảnh chứa chữ viết tay lên
3. Nhấn "Nhận diện chữ viết" để AI xử lý
4. Chỉnh sửa nội dung nếu cần
5. Xuất file Word hoặc TXT

## Tài khoản Admin mặc định

Sau khi chạy lần đầu, tạo admin bằng cách:

1. Truy cập Prisma Studio:
```bash
npx prisma studio
```

2. Tạo user mới với:
   - role: "admin"
   - isActive: true

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user
- `DELETE /api/auth/me` - Đăng xuất

### Files
- `POST /api/upload` - Upload ảnh
- `GET /api/files/history` - Lịch sử (cần đăng nhập)
- `POST /api/files/export` - Xuất file Word

### Admin (cần quyền admin)
- `GET /api/admin/users` - Danh sách users
- `PATCH /api/admin/users/:id` - Cập nhật user
- `GET /api/admin/stats` - Thống kê
- `GET /api/files` - Danh sách files
- `DELETE /api/files/:id` - Xóa file
