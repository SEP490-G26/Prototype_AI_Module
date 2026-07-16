# AI Embedding + Auto Tagging Design

## Mục tiêu

`AI Embedding + Auto Tagging` có vai trò:

- nhận nội dung đã được parser/extract
- chia thành các chunk có cấu trúc
- tạo vector embedding cho từng chunk
- gắn topic tags cho từng chunk để phục vụ retrieval, generation và debug

## Contract chunk đã chốt

`KnowledgeChunk` trong prototype đã được đổi theo đúng schema DB-ready đã chốt trước đó:

- `id`
- `courseId`
- `documentId`
- `userId`
- `chunkIndex`
- `chunkingStrategy`
- `chunkType`
- `sectionTitle`
- `sourceType`
- `sourceName`
- `sourcePageFrom`
- `sourcePageTo`
- `language`
- `subjectCode`
- `rawText`
- `normalizedText`
- `markdownText`
- `topicTags`
- `embedding`
- `embeddingProvider`
- `embeddingModel`
- `embeddingDim`
- `taggingProvider`
- `taggingModel`
- `wordCount`
- `tokenCount`
- `charCount`
- `retrievalEnabled`
- `status`
- `createdAt`
- `updatedAt`

## Policy runtime

Policy hiện tại được lưu tại:

- `src-dotnet/Ape.AiModule.Api/App_Data/embedding-tagging-policy.json`

Policy chứa:

- chunking defaults
- retrieval/status defaults
- tagging rules
- subject taxonomy

## Rubric và ground truth

Rubric nhẹ:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-rubrics/EMBEDDING_TAGGING.json`

Ground truth core:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-groundtruth/EMBEDDING_TAGGING_CORE.json`

## Prompt

Auto tagging prompt hiện tại được lưu tại:

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-prompts.json`

Đã nâng cấp để:

- nhận taxonomy json
- chỉ được dùng allowed tags
- ưu tiên ít tag nhưng đúng
- không invent tag

## Route đã có

- `POST /api/ai-module/embedding-tagging`
- `POST /api/ai-module/embedding-tagging/debug`
- `GET /api/ai-module/embedding-tagging/policy`
- `GET /api/ai-module/embedding-tagging/rubric`
- `GET /api/ai-module/embedding-tagging/ground-truth`

## Output kết quả

Result hiện tại đã tách rõ:

- `chunks`
- `embeddingTotals`
- `taggingTotals`
- `stageLogs`
- `usageLogs`
- `totals`

Debug result bổ sung:

- `policy`
- `rubric`
- `groundTruth`

## Ghi chú nghiệp vụ

Phần embedding và tagging hiện đã hỗ trợ:

- embedding model linh hoạt
- tagging model linh hoạt

Nghĩa là pipeline có thể dùng:

- 1 model embedding
- 1 model tagging khác

để benchmark chất lượng tagging giữa nhiều model khác nhau trên cùng 1 bộ chunk.
