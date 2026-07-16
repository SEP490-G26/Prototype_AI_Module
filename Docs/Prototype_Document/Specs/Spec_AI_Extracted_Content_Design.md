# AI Extracted Content Design

## Mục tiêu

`AI Extracted Content` có vai trò:

- nhận nội dung tài liệu đã được đưa vào module
- chuyển nội dung thành markdown sạch để dùng cho chunking và embedding
- nếu có image marker và có vision model, mở rộng nội dung ảnh thành markdown

## Scope hiện tại

Prototype hiện tại xử lý 2 mode:

- `TextOnly`
- `FullMultimodalPage`

Scope runtime hiện tại:

- có route upload ingest: `POST /api/ai-module/uploads/ingest`
- `docx`: đọc text từ `word/document.xml`, bóc media từ `word/media`
- `pptx`: đọc text từ `ppt/slides/*.xml`, bóc media từ `ppt/media`
- `pdf`: đọc text bằng parser thật `PdfPig`
- `image`: lưu file và trả marker để vision flow xử lý

Nó vẫn chưa là OCR/parser production-final, nhưng đã được nâng cấp thành parser prototype thực dụng cho production test harness.

## Policy runtime

Policy hiện tại được lưu tại:

- `src-dotnet/Ape.AiModule.Api/App_Data/extracted-content-policy.json`

Policy chứa:

- supported modes
- image markers
- normalization rules
- warning rules

## Rubric và ground truth

Rubric nhẹ:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-rubrics/EXTRACTED_CONTENT.json`

Ground truth core:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-groundtruth/EXTRACTED_CONTENT_CORE.json`

## Route đã có

- `POST /api/ai-module/extracted-content`
- `POST /api/ai-module/extracted-content/debug`
- `GET /api/ai-module/extracted-content/policy`
- `GET /api/ai-module/extracted-content/rubric`
- `GET /api/ai-module/extracted-content/ground-truth`

## Output chuẩn hoá

Output extraction hiện tại gồm:

- `rawText`
- `normalizedMarkdown`
- `wordCount`
- `embeddedImageCount`
- `parserName`
- `visionModelName`
- `extractionMode`
- `detectedImageReferences`
- `warnings`

`uploads/ingest` còn trả thêm:

- `savedPath`
- `suggestedMode`
- `suggestedRawContent`
- `parserVersion`
- `extractedImagePaths`
- `canUseAsText`
- `canUseAsVisionInput`

## Warning logic

Hệ thống có thể cảnh báo:

- input rỗng
- có image marker nhưng không có vision model
- sau normalize không còn đủ text hữu ích

## Ghi chú nghiệp vụ

Chức năng này chỉ nên làm:

- chuyển nội dung về dạng markdown sử dụng được
- báo rõ warning nếu chất lượng input kém

Nó không nên kiêm nhiệm:

- whitelist classification
- embedding
- tagging
- question generation
