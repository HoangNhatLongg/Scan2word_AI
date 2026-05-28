# Scan2Word AI - Tài liệu Kiến trúc Hệ thống

## 1. Sơ đồ Hoạt động (Activity Diagram)

### 1.1 Quy trình OCR và Xuất File

```puml
@startuml
|User|
start
:Upload Image;
:Select OCR Engine\n(Mistral/Tesseract);

if (Engine == Mistral?) then (Yes)
  :Call /api/ocr/mistral;
  |Server|
  :Save UploadedImage to DB;
  :Call Mistral OCR API;
  :Save OCRResult to DB;
  :Return ocrResultId;
  |User|
else (No)
  :Call Tesseract.js (Client-side);
  :Call /api/ocr/save;
  |Server|
  :Save OCRResult to DB;
  :Return ocrResultId;
  |User|
endif

:Edit Extracted Text;

:Click Export (DOCX/TXT);

if (has ocrResultId?) then (Yes)
  :Call /api/files/export\nwith ocrResultId;
  |Server|
  :Save ExportFile to DB;
  |User|
endif

:Download File;
stop
@enduml
```

### 1.2 Quy trình Đăng nhập

```puml
@startuml
|#AntiqueWhite|Guest|
start
:Open Login Page;
:Enter Email/Password;
:Click Login;
|#AliceBlue|Server|
:Validate Credentials;
if (Valid?) then (Yes)
  :Verify Password\nwith bcrypt;
  :Generate JWT Token;
  :Set Cookie auth_token;
  :Return User Data;
  |#AntiqueWhite|Guest|
  :Redirect to Home;
  :Show User Info in Navbar;
else (No)
  :Return Error;
  |#AntiqueWhite|Guest|
  :Show Error Message;
  stop
endif
@enduml
```

### 1.3 Quy trình Admin Quản lý

```puml
@startuml
|#AntiqueWhite|Admin|
start
:Login as Admin;
:Access /admin/users or /admin/files;
|Server|
:Fetch Data with Stats\n(users, files, OCR results);
|Admin|
:View Dashboard;

if (Action?) then (View Users)
  :View User List;
  :Search/Filter Users;
  if (Select User?) then (Yes)
    if (Action?) then (Lock/Unlock)
      :Toggle isActive;
      |Server|
      :Update User Status;
    elseif (Change Role)
      :Set Role (admin/user);
      |Server|
      :Update User Role;
    endif
  endif
else (View Files)
  :View File List\n(Images, OCR, Exports);
  :Filter by Type;
  :Search Files;
  if (Click Detail?) then (Yes)
    :View File Details;
    :View OCR Content;
  endif
endif
stop
@enduml
```

---

## 2. Sơ đồ Class (Class Diagram)

```puml
@startuml
class User {
  +id: Int
  +fullName: String
  +email: String
  +password: String
  +role: String
  +isActive: Boolean
  +createdAt: DateTime
  +updatedAt: DateTime
  --
  +uploadedImages: UploadedImage[]
  +ocrResults: OCRResult[]
  +exportFiles: ExportFile[]
}

class UploadedImage {
  +id: Int
  +userId: Int?
  +sessionId: String?
  +fileName: String
  +filePath: String
  +fileSize: Int
  +mimeType: String
  +status: String
  +createdAt: DateTime
  --
  +user: User?
  +ocrResults: OCRResult[]
}

class OCRResult {
  +id: Int
  +imageId: Int
  +extractedText: String
  +formattedContent: String?
  +confidence: Float
  +language: String
  +status: String
  +createdAt: DateTime
  --
  +image: UploadedImage
  +user: User?
  +exportFiles: ExportFile[]
}

class ExportFile {
  +id: Int
  +ocrResultId: Int
  +userId: Int?
  +sessionId: String?
  +fileName: String
  +filePath: String
  +fileType: String
  +fileSize: Int
  +createdAt: DateTime
  --
  +ocrResult: OCRResult
  +user: User?
}

User "1" -- "0..*" UploadedImage : uploads
User "1" -- "0..*" OCRResult : creates
User "1" -- "0..*" ExportFile : exports

UploadedImage "1" -- "0..*" OCRResult : produces
OCRResult "1" -- "0..*" ExportFile : generates

class AuthController {
  +POST /api/auth/login()
  +POST /api/auth/register()
  +GET /api/auth/me()
  +DELETE /api/auth/me()
}

class OCRController {
  +POST /api/ocr/mistral()
  +POST /api/ocr/save()
}

class FilesController {
  +POST /api/files/export()
  +GET /api/files/history()
}

class AdminController {
  +GET /api/admin/users()
  +PATCH /api/admin/users()
  +GET /api/admin/files()
  +GET /api/admin/stats()
}

AuthController ..> User
OCRController ..> UploadedImage
OCRController ..> OCRResult
FilesController ..> ExportFile
AdminController ..> User
AdminController ..> UploadedImage
AdminController ..> OCRResult
AdminController ..> ExportFile
@enduml
```

---

## 3. Sơ đồ Database Schema

```puml
@startuml
entity "User" as user {
  * id: INT (PK, AUTO)
  --
  * fullName: VARCHAR(255)
  * email: VARCHAR(255) (UNIQUE)
  * password: VARCHAR(255)
  * role: VARCHAR(20) DEFAULT 'user'
  * isActive: BOOLEAN DEFAULT TRUE
  * createdAt: DATETIME
  * updatedAt: DATETIME
}

entity "UploadedImage" as uploaded_image {
  * id: INT (PK, AUTO)
  --
  * userId: INT (FK -> User)
  * sessionId: VARCHAR(255)
  * fileName: VARCHAR(255)
  * filePath: VARCHAR(500)
  * fileSize: INT
  * mimeType: VARCHAR(50)
  * status: VARCHAR(20) DEFAULT 'pending'
  * createdAt: DATETIME
}

entity "OCRResult" as ocr_result {
  * id: INT (PK, AUTO)
  --
  * imageId: INT (FK -> UploadedImage)
  * userId: INT (FK -> User)
  * extractedText: TEXT
  * formattedContent: TEXT
  * confidence: FLOAT
  * language: VARCHAR(10) DEFAULT 'vie'
  * status: VARCHAR(20) DEFAULT 'completed'
  * createdAt: DATETIME
}

entity "ExportFile" as export_file {
  * id: INT (PK, AUTO)
  --
  * ocrResultId: INT (FK -> OCRResult)
  * userId: INT (FK -> User)
  * sessionId: VARCHAR(255)
  * fileName: VARCHAR(255)
  * filePath: VARCHAR(500)
  * fileType: VARCHAR(10)
  * fileSize: INT
  * createdAt: DATETIME
}

user ||--o{ uploaded_image
user ||--o{ ocr_result
user ||--o{ export_file
uploaded_image ||--o{ ocr_result
ocr_result ||--o{ export_file
@enduml
```

---

## 4. Chi tiết các Bảng Database

### 4.1 Bảng User

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | INT (PK) | Khóa chính, tự động tăng |
| `fullName` | VARCHAR(255) | Họ tên người dùng |
| `email` | VARCHAR(255) | Email (duy nhất, đăng nhập) |
| `password` | VARCHAR(255) | Mật khẩu đã mã hóa bcrypt |
| `role` | VARCHAR(20) | `'admin'` hoặc `'user'` |
| `isActive` | BOOLEAN | Trạng thái tài khoản (kích hoạt/khóa) |
| `createdAt` | DATETIME | Thời gian tạo tài khoản |
| `updatedAt` | DATETIME | Thời gian cập nhật cuối |

### 4.2 Bảng UploadedImage

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | INT (PK) | Khóa chính, tự động tăng |
| `userId` | INT (FK) | Người dùng đã upload (nullable cho khách) |
| `sessionId` | VARCHAR(255) | Session ID cho người dùng chưa đăng nhập |
| `fileName` | VARCHAR(255) | Tên file gốc |
| `filePath` | VARCHAR(500) | Đường dẫn lưu trữ trong `/public/uploads/` |
| `fileSize` | INT | Kích thước file (bytes) |
| `mimeType` | VARCHAR(50) | Loại file: `image/jpeg`, `image/png` |
| `status` | VARCHAR(20) | `'pending'` / `'processing'` / `'processed'` / `'failed'` |
| `createdAt` | DATETIME | Thời gian upload |

### 4.3 Bảng OCRResult

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | INT (PK) | Khóa chính, tự động tăng |
| `imageId` | INT (FK) | Ảnh gốc đã xử lý |
| `userId` | INT (FK) | Người dùng thực hiện OCR |
| `extractedText` | TEXT | Văn bản đã trích xuất |
| `formattedContent` | TEXT | Nội dung đã định dạng (markdown) |
| `confidence` | FLOAT | Độ chính xác (0.0 - 1.0) |
| `language` | VARCHAR(10) | Ngôn ngữ phát hiện, mặc định `'vie'` |
| `status` | VARCHAR(20) | `'completed'` / `'failed'` |
| `createdAt` | DATETIME | Thời gian hoàn thành OCR |

### 4.4 Bảng ExportFile

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | INT (PK) | Khóa chính, tự động tăng |
| `ocrResultId` | INT (FK) | Kết quả OCR liên quan |
| `userId` | INT (FK) | Người dùng xuất file |
| `sessionId` | VARCHAR(255) | Session cho khách |
| `fileName` | VARCHAR(255) | Tên file xuất |
| `filePath` | VARCHAR(500) | Đường dẫn lưu trong `/public/exports/` |
| `fileType` | VARCHAR(10) | `'docx'` / `'txt'` / `'pdf'` |
| `fileSize` | INT | Kích thước file (bytes) |
| `createdAt` | DATETIME | Thời gian xuất file |

---

## 5. Sơ đồ API Flow

```puml
@startuml
package "Client" {
  [Web Browser] as browser
}

package "Next.js Server" {
  package "Pages" {
    [Home Page] as home
    [Login Page] as login
    [Register Page] as register
    [History Page] as history
    [Admin Users] as admin_users
    [Admin Files] as admin_files
  }
  
  package "API Routes" {
    [auth/login] as api_login
    [auth/register] as api_register
    [auth/me] as api_me
    [ocr/mistral] as api_ocr_mistral
    [ocr/save] as api_ocr_save
    [files/export] as api_export
    [files/history] as api_history
    [admin/users] as api_admin_users
    [admin/files] as api_admin_files
    [admin/stats] as api_admin_stats
  }
  
  package "Services" {
    database db as "SQLite"
    [Prisma ORM] as prisma
  }
}

package "External Services" {
  [Mistral OCR API] as mistral
  [Tesseract.js] as tesseract
}

browser --> home : /
browser --> login : /login
browser --> register : /register
browser --> history : /history
browser --> admin_users : /admin/users
browser --> admin_files : /admin/files

home --> api_ocr_mistral : POST
home --> tesseract : Client-side
api_ocr_mistral --> mistral
api_ocr_mistral --> prisma
api_ocr_save --> prisma
api_export --> prisma
api_history --> prisma
api_admin_users --> prisma
api_admin_files --> prisma
api_admin_stats --> prisma
prisma --> db

note right of mistral
  Cloud API
  Requires MISTRAL_API_KEY
end note

note right of tesseract
  Local OCR
  No API Key Required
end note
@enduml
```

---

## 6. Sơ đồ Sequence - OCR Flow

```puml
@startuml
actor User
participant "Home Page" as Home
participant "API: /ocr/mistral" as OCRAPI
participant "Database" as DB
participant "Mistral Cloud" as Mistral

User -> Home : Upload Image
Home -> User : Show Preview
User -> Home : Click "Nhận diện"
Home -> OCRAPI : POST {imageBase64, fileName}
activate OCRAPI

OCRAPI -> DB : Create UploadedImage\n(status: processing)
OCRAPI -> Mistral : POST OCR Request
activate Mistral

alt Mistral Success
  Mistral --> OCRAPI : {pages: [...], confidence}
  OCRAPI -> DB : Update UploadedImage\n(status: processed)
  OCRAPI -> DB : Create OCRResult
  OCRAPI --> Home : {success, extractedText,\nocrResultId}
else Mistral Error
  Mistral --> OCRAPI : Error Response
  OCRAPI -> DB : Update UploadedImage\n(status: failed)
  OCRAPI --> Home : {error: ...}
end

deactivate Mistral
deactivate OCRAPI

Home -> User : Show Extracted Text
User -> Home : Edit Text
User -> Home : Click Export DOCX
Home -> Home : Create DOCX Blob\n(Client-side)
Home -> User : Download File
User -> Home : Click "Xuất file"
Home -> API : POST {text, fileName,\nfileType, ocrResultId}
OCRAPI -> DB : Create ExportFile
OCRAPI --> Home : Success
@enduml
```

---

## 7. Mô tả các API Endpoints

### Authentication APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập, trả về JWT token |
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| DELETE | `/api/auth/me` | Đăng xuất (xóa token) |

### OCR APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ocr/mistral` | Xử lý OCR với Mistral AI, lưu vào DB |
| POST | `/api/ocr/save` | Lưu kết quả OCR (Tesseract) |

### File APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/files/export` | Xuất file DOCX/TXT, lưu vào DB |
| GET | `/api/files/history` | Lấy lịch sử file của user |

### Admin APIs

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/admin/users` | Danh sách users + thống kê |
| PATCH | `/api/admin/users` | Cập nhật user (role, isActive) |
| GET | `/api/admin/files` | Danh sách files (images, OCR, exports) |
| GET | `/api/admin/stats` | Thống kê hệ thống |
