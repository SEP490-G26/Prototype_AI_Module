# KnowledgeChunks

```javascript
{
  _id: ObjectId,                          // ID duy nhất của bản ghi chunk

  course_id: ObjectId,                    // ID môn học mà chunk này thuộc về; có thể null nếu là tài liệu BYOS chưa gắn môn
  document_id: ObjectId,                  // ID tài liệu gốc sinh ra chunk này
  user_id: ObjectId,                      // ID người sở hữu tài liệu/chunk; dùng để phân biệt dữ liệu hệ thống và dữ liệu BYOS
  extraction_draft_id: ObjectId,          // ID bản nháp extraction cấp tài liệu mà chunk này sinh ra từ đó
  extraction_content_id: ObjectId,        // ID segment nội dung đã approved mà chunk này được cắt ra từ đó

  chunk_index: Number,                    // Thứ tự của chunk trong cùng một document, dùng để truy vết và lấy chunk lân cận
  chunking_strategy: String,              // Chiến lược chia chunk: logical_block | page_block | semantic_section | hybrid_contextual
  chunk_type: String,                     // Loại chunk: heading | concept | paragraph | example | code | table | image_desc | mixed
  section_title: String,                  // Tên section hoặc heading chính mà chunk này thuộc về
  chapter_id: String,                     // ID logic của chương/phần để nhóm các chunk cùng chapter
  chapter_title: String,                  // Tên chương/phần lớn mà chunk này thuộc về
  chunk_path: [String],                   // Đường dẫn phân cấp heading, ví dụ ["Chapter 1", "Variables", "Naming Rules"]

  source_type: String,                    // Loại file nguồn: pdf | docx | pptx | txt | image | md
  source_name: String,                    // Tên file nguồn gốc
  source_page_from: Number,               // Số trang bắt đầu mà chunk này lấy nội dung từ đó
  source_page_to: Number,                 // Số trang kết thúc mà chunk này lấy nội dung từ đó
  source_block_refs: [String],            // Danh sách block/page/shape/image ref từ extraction layer để truy vết đúng vị trí nguồn

  language: String,                       // Ngôn ngữ chính của nội dung chunk: vi | en | mixed
  subject_code: String,                   // Mã môn học/ngữ cảnh học tập: C_BASIC | JAVA_OOP | DSA_JAVA
  syllabus_scope: String,                 // SYSTEM_CORE | BYOS | HYBRID

  raw_text: String,                       // Nội dung text gốc sau khi parser/vision extract ra
  normalized_text: String,                // Nội dung đã được làm sạch để phục vụ embedding và retrieval tốt hơn
  markdown_text: String,                  // Nội dung ở dạng markdown để giữ cấu trúc heading/list/code block nếu cần hiển thị hoặc debug
  chunk_summary: String,                  // Tóm tắt ngắn 1-3 câu của chunk để phục vụ retrieval packing và giảm token đầu vào
  concept_keywords: [String],             // Từ khoá khái niệm cốt lõi đã chuẩn hoá của chunk

  topic_tags: [String],                   // Danh sách tag chủ đề chính gắn cho chunk, ví dụ ["array", "oop"]
  topic_primary: String,                  // Tag chủ đạo nhất của chunk
  topic_secondary: [String],              // Tag phụ để hỗ trợ re-rank và group theo chủ đề
  prerequisite_tags: [String],            // Tag tiên quyết; dùng khi context packing cần lấy thêm chunk bổ trợ

  embedding: [Number],                    // Vector embedding của chunk để phục vụ semantic search / retrieval
  embedding_provider: String,             // Provider dùng để tạo embedding, ví dụ: cohere | openai
  embedding_model: String,                // Tên model embedding đã dùng
  embedding_dim: Number,                  // Số chiều của vector embedding, ví dụ 1024 hoặc 1536

  tagging_provider: String,               // Provider dùng để auto tagging
  tagging_model: String,                  // Tên model dùng để sinh topic tags

  word_count: Number,                     // Số lượng từ của chunk, phục vụ benchmark và kiểm soát kích thước chunk
  token_count: Number,                    // Số token ước lượng/thực tế của chunk, phục vụ tính cost AI
  char_count: Number,                     // Số ký tự của chunk, hỗ trợ thống kê và fallback estimate token

  estimated_difficulty: String,           // Ước lượng độ khó tri thức của chunk: Easy | Medium | Hard
  assessment_value_score: Number,         // Điểm đánh giá chunk có hữu ích để tạo câu hỏi hay không (0-1)
  content_quality_score: Number,          // Điểm chất lượng nội dung sau extraction/filtering (0-1)
  retrieval_score_boost: Number,          // Hệ số boost tĩnh để ưu tiên chunk quan trọng trong search/re-rank
  duplicate_group_id: String,             // ID nhóm chunk gần trùng nhau để retrieval tránh lấy lặp

  retrieval_enabled: Boolean,             // Chunk này có được phép tham gia vector search / retrieval hay không
  status: String,                         // Trạng thái chunk: active | pending | archived | failed | filtered

  created_at: DateTime,                   // Thời điểm tạo bản ghi chunk
  updated_at: DateTime                    // Thời điểm cập nhật gần nhất của bản ghi chunk
}
```

## Các nhóm trường quan trọng

### 1. Truy vết nguồn

- `document_id`, `extraction_draft_id`, `extraction_content_id`
- `source_page_from`, `source_page_to`, `source_block_refs`
- `chunk_index`, `chunk_path`

Nhóm này giúp truy vết chính xác chunk sinh ra từ đâu, rất quan trọng cho:

- human-in-the-loop
- debug extraction/chunking
- audit kết quả AI

### 2. Tổ chức tri thức

- `section_title`
- `chapter_id`, `chapter_title`
- `topic_primary`, `topic_secondary`, `topic_tags`
- `concept_keywords`, `prerequisite_tags`

Nhóm này giúp retrieval không phải chỉ dựa vào vector. Hệ thống có thể filter theo môn, chapter, topic rồi mới semantic search.

### 3. Tối ưu token và context packing

- `chunk_summary`
- `token_count`
- `assessment_value_score`
- `content_quality_score`
- `duplicate_group_id`

Đây là các trường mới quan trọng cho production. Nếu không có chúng, việc tạo đề từ tài liệu lớn sẽ rất dễ đưa quá nhiều chunk vào LLM và làm chi phí tăng mạnh.

## Gợi ý index Mongo

### Index bắt buộc

- `{ course_id: 1, subject_code: 1, status: 1, retrieval_enabled: 1 }`
- `{ document_id: 1, chunk_index: 1 }`
- `{ extraction_draft_id: 1, chunk_index: 1 }`
- `{ topic_primary: 1, subject_code: 1 }`
- `{ topic_tags: 1, subject_code: 1 }`
- `{ chapter_id: 1, subject_code: 1 }`

### Index khuyến nghị

- `{ estimated_difficulty: 1, subject_code: 1 }`
- `{ duplicate_group_id: 1 }`
- `{ assessment_value_score: -1 }`

### Vector index

- vector index trên `embedding`
- nên kết hợp với metadata filter theo `subject_code`, `course_id`, `retrieval_enabled`, `status`

## Ghi chú quan hệ

- `extraction_draft_id` -> `DocumentExtractionDrafts._id`
- `extraction_content_id` -> `DocumentExtractionDraftContents._id`
- `document_id` -> collection tài liệu gốc của hệ thống
- `course_id` -> collection course
- `user_id` -> collection user

## Vai trò trong pipeline production

`KnowledgeChunks` không chỉ là nơi lưu embedding. Đây là tầng tri thức trung gian để:

1. retrieval candidate search
2. topic-based filtering
3. context packing
4. question generation
5. mentor grounding / evidence trace

Nếu thiết kế collection này quá tối giản, hệ thống sẽ phải đẩy quá nhiều raw chunk vào LLM, dẫn tới:

- token input cao
- latency cao
- cost tăng mạnh
- khó kiểm soát chất lượng grounding
