# Hướng dẫn giao diện vận hành AI Module

## Mục tiêu

UI này là operator console để chạy thử, benchmark và kiểm tra pipeline của AI module.

## Các khu vực chính

### 1. Overview

- reload provider state
- ping provider
- xem model catalog
- xem prompt registry
- xem cấu hình provider sau khi reload `.env`

### 2. Gatekeeper

- nhập file hoặc nội dung thô
- chọn môn học
- chọn provider/model
- xem raw JSON và parsed result

### 3. Extracted Content

- chạy `TextOnly` hoặc `FullMultimodalPage`
- nạp file qua route ingest
- xem markdown preview, token, cost và JSON raw

### 4. Embedding + Auto Tagging

- chọn embedding provider/model
- chọn tagging provider/model
- xem chunk, tag, token, cost
- export chunk JSON để feed sang generation/review

### 5. Generation + Review

- nạp `chunks` JSON
- chọn mode `SingleAgent`, `SameModelDualRole`, `DualAgent`
- chọn loại câu hỏi `FE` hoặc `PE`
- xem output AI1, output AI2, kết quả cuối cùng
- xem raw JSON từng bước để đưa vào báo cáo

### 6. Code Mentor

- nhập nhiều file code
- chọn provider/model
- xem feedback dạng đọc được và JSON raw

### 7. Ingestion / Full Pipeline

- test luồng đầy đủ từ ingest tới generation/review
- dùng để nhìn tổng token, tổng cost, tổng latency

### 8. History + Sessions

- xem lại lịch sử test theo function
- filter theo model, status, date
- mở chi tiết từng run
- export JSON hoặc TSV
- lưu và mở benchmark session

## File UI liên quan

- `src-dotnet/Ape.AiModule.Api/wwwroot/index.html`
- `src-dotnet/Ape.AiModule.Api/wwwroot/app.js`
- `src-dotnet/Ape.AiModule.Api/wwwroot/styles.css`

## Ghi chú vận hành

- UI này là console cho prototype, không phải FE production.
- Dữ liệu hiển thị ưu tiên kiểu `JSON-first` theo DTO backend.
- Các tab đều nên được dùng kèm history để lưu bằng chứng test.
