# Tổng Kết Question Generation + Review FE/PE

## Mục tiêu

Tài liệu này tổng hợp toàn bộ những gì đã làm cho chức năng:

- tạo câu hỏi `FE`
- tạo câu hỏi `PE`
- review kết quả tạo câu hỏi
- chuẩn hoá output để đưa vào BE tổng sau này

Đây là phần AI quan trọng nhất của hệ thống vì nó dùng để biến `KnowledgeChunks` thành câu hỏi học tập có thể đưa vào question bank.

## Phạm vi đã làm

Đã hoàn thành ở mức prototype DB-ready:

1. generation flow
2. review flow
3. generation + review pipeline 1-2 vòng
4. schema validation
5. persistence mapping gần với collection FE/PE
6. duplicate detection mức cơ bản
7. difficulty alignment service độc lập
8. rubric runtime theo môn + loại câu hỏi
9. ground truth dataset runtime cho regression
10. export package JSON chuẩn hoá
11. log stage + usage + token/cost tổng

## Các thành phần chính

### AI1 - Generator

Vai trò:

- nhận `KnowledgeChunks`
- tạo `FE` hoặc `PE`
- output JSON theo schema đã chốt

Input chính:

- `subject`
- `difficulty`
- `questionType`
- `count`
- `chunks`
- `revisionFeedback` nếu regenerate
- `previousQuestions` nếu regenerate

### AI2 - Reviewer

Vai trò:

- đọc output của AI1
- đối chiếu với chunk nguồn
- đối chiếu với rubric
- kết luận `accepted` hoặc `needs_revision`

### Rule-based layer

Ngoài reviewer AI, module đã có thêm lớp rule-based:

- `QuestionSchemaService`
- `DifficultyAlignmentService`

Mục đích:

- không phụ thuộc 100% vào AI reviewer
- bắt sớm schema sai
- bắt sớm sai độ khó
- trả về output map-ready cho collection thật

## Schema output đã chốt

### FE

Field bắt buộc:

- `type`
- `topic_tags`
- `difficulty`
- `title`
- `description`
- `source_chunk_ids`
- `options`
- `correct_answer`
- `explanation`

Field phải là `null`:

- `skeleton_code`
- `solution_code`
- `test_cases`

### PE

Field bắt buộc:

- `type`
- `topic_tags`
- `difficulty`
- `title`
- `description`
- `source_chunk_ids`
- `skeleton_code`
- `solution_code`
- `test_cases`

Field phải là `null`:

- `options`
- `correct_answer`
- `explanation`

## Pipeline runtime

### `question-generation`

Flow:

1. AI generator tạo danh sách câu hỏi
2. module normalize output
3. module validate schema
4. module map sang FE/PE save-ready record
5. module tính token/cost

Lưu ý runtime:

- route `POST /api/ai-module/question-generation/debug` hiện tồn tại
- nhưng hiện đang trả cùng payload runtime như route thường
- chưa có debug envelope riêng cho prompt/rubric/ground-truth

### `generation-review`

Flow:

1. chạy `question-generation`
2. chạy AI reviewer
3. nếu schema sai -> ép `needs_revision`
4. nếu difficulty lệch -> ép `needs_revision`
5. nếu reviewer reject -> tạo lại tối đa 1 lần nữa
6. sau vòng cuối -> map và save tạm

Lưu ý runtime:

- route `POST /api/ai-module/generation-review/debug` hiện tồn tại
- nhưng hiện đang trả cùng payload runtime như route thường
- route `POST /api/ai-module/generation-review/export` mới là route đầy đủ nhất để audit package

Mode đã hỗ trợ:

- `SingleAgent`
- `SameModelDualRole`
- `DualAgent`

## Duplicate detection đã có

Đã có 2 lớp:

1. duplicate trong cùng 1 batch generation
2. duplicate heuristic với repository tạm

Tác dụng:

- nếu trùng câu hỏi đã tồn tại hoặc trùng nội bộ
- schema mapping sẽ bị đánh dấu issue
- review flow có thể bị ép về `needs_revision`

## Difficulty alignment đã có

Đã thêm service độc lập:

- `DifficultyAlignmentService`

Vai trò:

- tự đánh giá `Easy/Medium/Hard`
- đối chiếu với difficulty được yêu cầu
- nếu lệch mức -> thêm issue và có thể reject output

## Rubric đã có

Đã tạo 6 rubric JSON cho generation/review:

- `C_FE`
- `C_PE`
- `JAVA_OOP_FE`
- `JAVA_OOP_PE`
- `DSA_JAVA_FE`
- `DSA_JAVA_PE`

Rubric đã nối runtime vào review flow.

## Ground truth đã có

Đã tạo bộ starter ground truth cho:

- `C_FE`
- `C_PE`
- `JAVA_OOP_FE`
- `JAVA_OOP_PE`
- `DSA_JAVA_FE`
- `DSA_JAVA_PE`

Ground truth đã nối vào:

- route regression

## API đã có

- `POST /api/ai-module/question-generation`
- `POST /api/ai-module/question-generation/debug`
- `GET /api/ai-module/question-generation/rubric`
- `GET /api/ai-module/question-generation/ground-truth`
- `POST /api/ai-module/question-generation/regression`
- `POST /api/ai-module/question-review`
- `POST /api/ai-module/generation-review`
- `POST /api/ai-module/generation-review/debug`
- `POST /api/ai-module/generation-review/export`

## Export package đã có

Route:

- `POST /api/ai-module/generation-review/export`

Payload export gồm:

- `metadata`
- `request`
- `rubric`
- `questions`
- `schemaMapping`
- `difficultyAlignment`
- `mappedFeQuestions`
- `mappedPeQuestions`
- `review`
- `attemptsUsed`
- `stageLogs`
- `usageLogs`
- `totals`

Mục đích:

- debug
- benchmark
- so sánh model
- đưa cho FE render
- chuyển tiếp vào BE tổng sau này

## Collection / config liên quan đã được định hình

Đã chốt hướng cho 3 collection cấu hình:

- `AI_Prompt_Versions`
- `AI_Rubrics`
- `AI_GroundTruth_Sets`

## Những gì chưa làm

Những phần còn lại hợp lý để làm khi merge vào BE thật:

1. Mongo repository thật
2. vector-based duplicate detection
3. compile/run verification cho `PE` bằng Judge0
4. publish workflow cho question bank
5. prompt/rubric/ground truth đọc thật từ DB
6. lưu export package vào DB nếu cần audit lâu dài

## Kết luận

Phần `Question Generation + Review FE/PE` hiện đã đủ mức để:

- test model
- benchmark cost
- regression có đối chiếu
- ép JSON gần với schema DB
- làm prototype cho core module AI của đồ án

Nghĩa là khi chuyển sang AI function tiếp theo, phần này đã có thể xem là khối core ổn định nhất của module.
