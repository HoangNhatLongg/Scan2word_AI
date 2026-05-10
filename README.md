# Scan2Word AI - Hệ thống chuyển chữ viết tay sang file Word bằng AI

## Giới thiệu
Hệ thống cho phép người dùng tải lên hình ảnh chứa chữ viết tay hoặc chữ in. AI OCR sẽ nhận diện nội dung văn bản trong ảnh và chuyển đổi thành file Word hoặc văn bản thuần.

## Tính năng

### Khách (Không cần đăng nhập)
- Tải ảnh lên (JPG, PNG, tối đa 10MB)
- Nhận diện chữ viết tay bằng AI OCR
- Chỉnh sửa văn bản trước khi xuất
- Xuất file Word (.docx)

### Người dùng (Cần đăng nhập)
- Đăng ký / Đăng nhập tài khoản
- Xem lịch sử chuyển đổi
- Tải lại file đã xuất

### Quản trị viên
- Quản lý người dùng (khóa/mở khóa)
- Quản lý ảnh upload
- Quản lý file chuyển đổi
- Xem thống kê hệ thống

## Công nghệ sử dụng

### Frontend
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Shadcn/UI
- Tesseract.js (OCR trên browser)

### Backend
- Node.js + Express
- SQLite (Prisma ORM)
- JWT Authentication
- Multer (upload file)

### Thư viện hỗ trợ
- `jspdf` - Xuất PDF
- `docx` - Xuất Word
- `tesseract.js` - OCR engine

## Cài đặt

```bash
# Clone repository
git clone <repo-url>
cd Scan2Word-AI

# Cài đặt dependencies
npm install

# Chạy migration database
npx prisma migrate dev

# Khởi động server
npm run dev
```

## Cấu trúc thư mục

```
Scan2Word-AI/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── admin/             # Admin pages
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   └── files/
│   │   ├── history/           # User history
│   │   ├── page.tsx           # Home page
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn components
│   │   ├── image-upload.tsx
│   │   ├── text-editor.tsx
│   │   └── ...
│   ├── lib/                   # Utilities
│   │   ├── db.ts             # Database client
│   │   ├── auth.ts           # Auth utilities
│   │   └── utils.ts
│   └── hooks/                 # Custom hooks
├── prisma/
│   └── schema.prisma         # Database schema
├── server/                    # Express backend
│   ├── routes/
│   ├── middleware/
│   └── index.ts
└── public/                   # Static files
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user

### OCR & Files
- `POST /api/ocr/process` - Xử lý OCR
- `POST /api/files/upload` - Upload ảnh
- `POST /api/files/export` - Xuất file Word
- `GET /api/files/history` - Lịch sử (user)

### Admin
- `GET /api/admin/users` - Danh sách users
- `PATCH /api/admin/users/:id` - Cập nhật user
- `GET /api/admin/files` - Danh sách files
- `DELETE /api/admin/files/:id` - Xóa file
- `GET /api/admin/stats` - Thống kê

## Môi trường (.env)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
```

## License
MIT
