# AI_Context_Packs

## Mục tiêu

`AI_Context_Packs` là collection trung gian dùng để gom một tập `KnowledgeChunks` đã được chọn lọc và nén ngữ cảnh theo đúng mục đích AI downstream.

Collection này giải quyết trực tiếp bài toán production:

- không đẩy hàng chục nghìn token raw chunks vào một request tạo đề
- tái sử dụng context đã được pack tốt cho nhiều lần generate/review
- giảm chi phí khi tạo 1 câu hỏi hoặc 1 batch câu hỏi theo cùng topic

## Schema đề xuất

```javascript
{
  _id: ObjectId,                           // ID duy nhất của context pack

  course_id: ObjectId,                     // Môn học liên quan
  document_id: ObjectId,                   // Tài liệu nguồn chính; có thể null nếu pack ghép từ nhiều tài liệu
  user_id: ObjectId,                       // Chủ sở hữu pack; hỗ trợ BYOS

  pack_id: String,                         // ID logic để trace trong app/log
  pack_type: String,                       // generation_context | review_context | mentor_context | retrieval_debug
  pack_strategy: String,                   // topic_focused | chapter_focused | difficulty_balanced | summary_first | hybrid
  pack_status: String,                     // draft | active | stale | archived

  subject_code: String,                    // C_BASIC | JAVA_OOP | DSA_JAVA
  question_type: String,                   // FE | PE | null nếu dùng cho tác vụ khác
  target_difficulty: String,               // Easy | Medium | Hard | Mixed
  target_topics: [String],                 // Các topic mà pack này nhắm tới
  chapter_scope: [String],                 // Các chapter/section logic được phủ trong pack
  syllabus_scope: String,                  // SYSTEM_CORE | BYOS | HYBRID

  source_chunk_ids: [ObjectId],            // Các chunk thật được dùng để tạo pack
  source_chunk_refs: [                     // Snapshot ref gọn để UI/debug không phải query ngược toàn bộ ngay lập tức
    {
      chunk_id: ObjectId,
      chunk_index: Number,
      section_title: String,
      topic_primary: String,
      token_count: Number,
      retrieval_rank: Number
    }
  ],

  retrieval_query: String,                 // Query hoặc ý định retrieval đã dùng để tạo pack
  retrieval_filters: Object,               // Metadata filter dùng ở bước retrieval
  retrieval_scores: [                      // Điểm score của các chunk được chọn
    {
      chunk_id: ObjectId,
      vector_score: Number,
      lexical_score: Number,
      topic_score: Number,
      boost_score: Number,
      final_score: Number
    }
  ],

  packed_summary_text: String,             // Bản tóm tắt pack để dùng khi cần context ngắn
  packed_context_text: String,             // Context text cuối cùng đã được nén để đưa cho AI
  packed_markdown_text: String,            // Biến thể markdown dễ đọc/debug/export
  context_windows: [                       // Các cụm nhỏ bên trong pack để planner dùng lại
    {
      window_id: String,
      window_type: String,                 // primary | supporting | prerequisite | example | code
      source_chunk_ids: [ObjectId],
      token_count: Number,
      summary_text: String
    }
  ],

  token_count: Number,                     // Tổng token của packed_context_text
  source_token_count: Number,              // Tổng token của raw chunks trước khi pack
  compression_ratio: Number,               // token_count / source_token_count
  recommended_question_count: Number,      // Số câu hỏi nên generate trên pack này để cost tối ưu
  max_question_count: Number,              // Ngưỡng trên nên dùng với pack này

  usage_count: Number,                     // Số lần pack đã được dùng
  last_used_at: DateTime,                  // Lần gần nhất pack được dùng
  expires_at: DateTime,                    // Hạn làm stale/rebuild nếu dữ liệu nguồn đổi

  created_from_run_id: String,             // Pipeline run tạo ra pack này
  created_at: DateTime,
  updated_at: DateTime
}
```

## Khi nào cần tạo context pack

### 1. Tạo pack động theo request

Áp dụng khi:

- người dùng chọn topic cụ thể
- tài liệu BYOS mới ingest
- chưa có pack phù hợp trong cache

### 2. Tạo pack sẵn theo syllabus

Áp dụng khi:

- tài liệu core của môn ít thay đổi
- cần tối ưu cost cho production
- có các topic/chapter xuất hiện lặp lại nhiều

Ví dụ:

- `JAVA_OOP / constructor / FE / Easy`
- `C_BASIC / pointer / PE / Medium`
- `DSA_JAVA / linked-list / PE / Medium`

## Quan hệ với collection khác

- `source_chunk_ids` -> `KnowledgeChunks._id`
- `document_id` -> collection tài liệu gốc
- `course_id` -> collection course
- `user_id` -> collection user

## Vai trò trong production

`AI_Context_Packs` là lớp đệm giữa retrieval và generation/review.

Luồng đúng nên là:

`KnowledgeChunks -> Retrieval -> Re-rank -> Context Packing -> AI_Context_Packs -> Generation/Review`

Nếu bỏ qua collection này, hệ thống thường sẽ mắc các vấn đề sau:

- mỗi request phải pack lại từ đầu
- khó tối ưu input token cho trường hợp tạo 1 câu hỏi đơn
- khó benchmark cost thực theo từng topic
- khó tái sử dụng ngữ cảnh đã được xác nhận là tốt

## Gợi ý index Mongo

- `{ subject_code: 1, question_type: 1, target_difficulty: 1, pack_status: 1 }`
- `{ target_topics: 1, subject_code: 1 }`
- `{ chapter_scope: 1, subject_code: 1 }`
- `{ usage_count: -1, last_used_at: -1 }`
- `{ expires_at: 1 }`

## Ghi chú nghiệp vụ

### 1. Không thay thế KnowledgeChunks

`AI_Context_Packs` không phải nơi lưu tri thức gốc. Nó chỉ là lớp context đã tối ưu cho AI downstream.

### 2. Có thể rebuild

Khi:

- prompt retrieval thay đổi
- policy packing thay đổi
- chunk nguồn bị cập nhật
- score/rubric mới yêu cầu context khác

thì context pack có thể bị đánh `stale` và build lại.

### 3. Hỗ trợ tính credit/cost

Vì collection này lưu:

- `source_token_count`
- `token_count`
- `compression_ratio`
- `recommended_question_count`

nên hệ thống có thể dùng nó để:

- ước lượng chi phí trước khi generate
- định giá credit theo độ lớn tài liệu và độ khó pack
- giải thích vì sao tạo 1 câu đơn sẽ đắt hơn tạo theo batch
