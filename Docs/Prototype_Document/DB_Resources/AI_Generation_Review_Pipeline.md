# AI Generation Review Pipeline

## Mục tiêu

Luồng này dùng để tạo câu hỏi FE/PE từ `KnowledgeChunks` và kiểm soát chất lượng bằng một AI reviewer trước khi trả kết quả cho hệ thống.

Đây là luồng quan trọng nhất của đồ án vì nó quyết định:

- câu hỏi có bám sát tri thức đã embedding hay không
- chi phí AI của chức năng tạo đề
- khả năng tái sử dụng thẳng vào BE tổng

## Schema output đã được siết lại

Module hiện tại đã bắt đầu ép output generation bám sát collection thật hơn.

### FE

Mỗi câu hỏi FE cần có:

- `type`
- `topic_tags`
- `difficulty`
- `title`
- `description`
- `source_chunk_ids`
- `options`
- `correct_answer`
- `explanation`

Và các field sau phải là `null`:

- `skeleton_code`
- `solution_code`
- `test_cases`

### PE

Mỗi câu hỏi PE cần có:

- `type`
- `topic_tags`
- `difficulty`
- `title`
- `description`
- `source_chunk_ids`
- `skeleton_code`
- `solution_code`
- `test_cases`

Và các field sau phải là `null`:

- `options`
- `correct_answer`
- `explanation`

### Normalize sau generation

Sau khi AI1 trả kết quả:

1. module parse JSON array
2. cố gắng map cả `snake_case` và `camelCase`
3. loại câu hỏi sai `question_type`
4. bổ sung `source_chunk_ids` nếu model không trả về
5. FE:
   - phải có `options`
   - phải có `correct_answer`
   - nếu `correct_answer` trả về full text thì module quy đổi về label như `A`, `B`
6. PE:
   - phải có `skeleton_code`
   - phải có `solution_code`
   - phải có `test_cases`
7. nếu thiếu field bắt buộc thì câu hỏi bị loại ngay

## Hai agent

### AI1 - Generator

Vai trò:

- nhận `KnowledgeChunk` đã được trích, chunk và tag
- tạo ra câu hỏi theo đúng schema JSON của:
  - `FE_Questions`
  - `PE_Questions`

Input chính:

- `subject`
- `difficulty`
- `question_type`
- `count`
- `chunks_json`
- `revision_feedback` nếu đây là lần tạo lại
- `previous_questions_json` nếu đây là lần tạo lại

Output:

- mảng JSON của các câu hỏi

### AI2 - Reviewer

Vai trò:

- đọc kết quả của AI1
- so sánh với chunk context
- so sánh với rubric từng loại câu hỏi
- kết luận có chấp nhận hay không

Input chính:

- `subject`
- `question_type`
- `chunks_json`
- `questions_json`
- `rubric_json`

Output:

```json
{
  "reviewStatus": "accepted|needs_revision",
  "issues": ["..."],
  "suggestions": ["..."],
  "score": 0.0,
  "schemaValid": true,
  "contentGrounded": true,
  "needsRevision": false
}
```

## Rubric đánh giá

### FE

AI reviewer cần check:

- output có đúng schema `FE_Questions` không
- câu hỏi có bám sát chunk nguồn không
- `topic_tags` có hợp lý không
- `difficulty` có đúng mức yêu cầu không
- `options` có đầy đủ và không mơ hồ không
- `correct_answer` có hợp lệ không
- `explanation` có giải thích hợp lý không

### PE

AI reviewer cần check:

- output có đúng schema `PE_Questions` không
- đề bài có bám sát chunk nguồn không
- `topic_tags` có hợp lý không
- `difficulty` có đúng mức yêu cầu không
- `skeleton_code` có đúng ngôn ngữ không
- `solution_code` có giải được đề không
- `test_cases` có hợp lý không

### Rubric theo môn học

Reviewer không còn review generic theo FE/PE thuần.

Rubric hiện tại đã chia theo:

- `C + FE`
- `C + PE`
- `Java OOP + FE`
- `Java OOP + PE`
- `DSA Java + FE`
- `DSA Java + PE`

Ý nghĩa:

- C: tập trung biến, vòng lặp, mảng, con trỏ, hàm
- Java OOP: tập trung class, object, constructor, encapsulation, inheritance, polymorphism
- DSA Java: tập trung array, list, stack, queue, tree, graph, search, sort

## Vòng lặp

Để tránh tốn token, vòng lặp chỉ chạy tối đa `2` lần.

## Lớp validation và mapping nội bộ

Ngoài AI reviewer, module hiện tại đã có thêm 1 lớp `rule-based validation` trong application layer:

- `QuestionSchemaService`

Vai trò:

1. validate output của AI1 theo schema FE/PE
2. map sang object gần với collection thật:
   - `FeQuestionDocument`
   - `PeQuestionDocument`
3. trả về `QuestionSchemaMappingResult`

Nó giúp:

- không phụ thuộc hoàn toàn vào reviewer AI
- reject sớm các output sai schema
- chuẩn bị đường dẫn `validate -> map -> save`

### Tiêu chí validate FE

- đúng `type = FE`
- có `topic_tags`
- có `title`
- có `description`
- có `source_chunk_ids`
- có `options`
- có `correct_answer`
- `correct_answer` phải khớp label của option
- không được có field PE

### Tiêu chí validate PE

- đúng `type = PE`
- có `topic_tags`
- có `title`
- có `description`
- có `source_chunk_ids`
- có `skeleton_code`
- có `solution_code`
- có `test_cases`
- không được có field FE

### Tác động lên review

Nếu `QuestionSchemaService` kết luận output sai schema:

- reviewer result sẽ bị ép về `needs_revision`
- `schemaValid = false`
- score bị hạ xuống
- issue schema được gộp vào issue của AI reviewer

### Attempt 1

1. AI1 tạo câu hỏi
2. AI2 review
3. Nếu `accepted` -> dừng
4. Nếu `needs_revision` -> chuyển sang Attempt 2

### Attempt 2

1. AI1 nhận thêm:
   - `revision_feedback`
   - `previous_questions_json`
2. AI1 tạo lại câu hỏi
3. AI2 review lại
4. Dù accepted hay fail thì đều dừng tại đây

## Lý do giới hạn 2 lần

- tránh vòng lặp vô hạn
- kiểm soát chi phí benchmark
- vẫn đủ để đo khả năng self-correction của hệ thống

## API hiện tại

- `POST /api/ai-module/question-generation`
- `POST /api/ai-module/question-review`
- `POST /api/ai-module/generation-review`
- `POST /api/ai-module/generation-review/export`

## Export package JSON chuẩn hoá

Route:

- `POST /api/ai-module/generation-review/export`

Mục đích:

- trả về một gói JSON hoàn chỉnh để debug, benchmark, lưu file hoặc đưa sang BE tổng
- giữ cùng một payload chuẩn cho cả:
  - test tay
  - regression
  - so sánh model
  - lưu tạm làm bằng chứng báo cáo

Cấu trúc gói export gồm:

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

Ý nghĩa:

- `metadata`: thông tin package, model, rubric, prompt key, dataset id nếu có
- `request`: snapshot request gốc
- `rubric`: rubric runtime đang dùng cho review
- `questions`: output raw sau generation
- `schemaMapping`: kết quả validate/map nội bộ
- `mappedFeQuestions` / `mappedPeQuestions`: bản ghi save-ready gần với collection
- `review`: kết quả AI reviewer sau cùng
- `stageLogs`: log từng stage hoặc từng attempt
- `usageLogs`: log usage/cost phục vụ benchmark và audit
- `totals`: tổng token/cost/latency của cả flow

## Prompt hiện tại

Trong prompt registry tạm thời đang có:

- `question_generation`
- `question_review`

Prompt không bị hard-code cố định trong flow nghiệp vụ mà được lấy từ prompt store file-backed.

## Prompt storage tạm thời

Prompt hiện tại được lưu tại:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-prompts.json`

Tạm thời đây là bộ nhớ đệm hoặc prompt registry để BE và UI test có thể:

- xem prompt
- sửa prompt
- reload prompt

Sau này khi merge vào BE tổng, nguồn này sẽ được thay bằng prompt version trong DB.

## Trạng thái hiện tại

Luồng đã được triển khai ở mức:

- có 2 agent
- có rubric review theo FE/PE
- có loop tối đa 2 lần
- có ghi log từng attempt
- có sử dụng provider thật nếu config phù hợp

Nhưng vẫn cần siết thêm:

- thêm mapper save thẳng vào `FE_Questions` và `PE_Questions`
- thêm usage log thật nếu provider trả usage
