# PlantUML Diagrams

Thư mục chứa các file PlantUML để generate sơ đồ.

## Các file

| File | Mô tả |
|------|-------|
| `architecture.puml` | Sơ đồ kiến trúc hệ thống |
| `activity-ocr.puml` | Sơ đồ hoạt động quy trình OCR |
| `activity-admin.puml` | Sơ đồ hoạt động quy trình Admin |
| `class-diagram.puml` | Class Diagram |
| `database-schema.puml` | Sơ đồ Database Schema |
| `sequence-ocr.puml` | Sequence Diagram - OCR Process |

## Cách generate hình ảnh

### 1. Sử dụng VS Code (Khuyến nghị)

1. Cài extension **PlantUML** (tanabatahen.vscode-plantuml)
2. Cài **Graphviz** (để render)
3. Mở file `.puml` trong VS Code
4. Nhấn `Alt + D` để preview
5. Nhấn `Ctrl + Shift + P` → **PlantUML: Export Current Diagram**

### 2. Sử dụng Docker

```bash
# Build image
docker pull plantuml/plantuml

# Convert to PNG
docker run -v $(pwd):/data plantuml/plantuml -o /data/images /data/*.puml
```

### 3. Online PlantUML Editor

https://www.plantuml.com/plantuml/uml/

### 4. Sử dụng PlantText

https://www.planttext.com/

## Cài đặt Graphviz (Windows)

```powershell
# Sử dụng Chocolatey
choco install graphviz

# Hoặc sử dụng Scoop
scoop install graphviz
```

## Xuất ra các định dạng khác

```bash
# PNG
plantuml -o ./images -tpng diagram.puml

# SVG
plantuml -o ./images -tsvg diagram.puml

# PDF
plantuml -o ./images -tpdf diagram.puml

# All formats
plantuml -o ./images diagram.puml
```
