# Bảng route API của AI Module

## Mục đích

Tài liệu này gom toàn bộ route chính để nhóm FE, QA và BE tổng tra cứu nhanh.

## Prompt management

| Method | Route | Mục đích |
|---|---|---|
| `GET` | `/api/ai-module/prompts` | Lấy danh sách prompt hiện tại |
| `GET` | `/api/ai-module/prompts/{key}` | Lấy một prompt theo key |
| `POST` | `/api/ai-module/prompts/reload` | Reload prompt từ file |
| `PUT` | `/api/ai-module/prompts/{key}` | Cập nhật prompt |
| `POST` | `/api/ai-module/prompts/render` | Render prompt với variables |

## Gatekeeper

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/gatekeeper` | Chạy gatekeeper |
| `POST` | `/api/ai-module/gatekeeper/debug` | Chạy gatekeeper kèm policy/rubric/ground truth |
| `GET` | `/api/ai-module/gatekeeper/policy` | Lấy policy gatekeeper |
| `GET` | `/api/ai-module/gatekeeper/rubric` | Lấy rubric gatekeeper |
| `GET` | `/api/ai-module/gatekeeper/ground-truth` | Lấy ground truth gatekeeper |

## Extracted Content

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/extracted-content` | Chạy extracted content |
| `POST` | `/api/ai-module/extracted-content/debug` | Chạy extracted content debug |
| `GET` | `/api/ai-module/extracted-content/policy` | Lấy policy extracted content |
| `GET` | `/api/ai-module/extracted-content/rubric` | Lấy rubric extracted content |
| `GET` | `/api/ai-module/extracted-content/ground-truth` | Lấy ground truth extracted content |

## Embedding + Auto Tagging

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/embedding-tagging` | Chạy embedding + auto tagging |
| `POST` | `/api/ai-module/embedding-tagging/debug` | Chạy embedding + auto tagging debug |
| `GET` | `/api/ai-module/embedding-tagging/policy` | Lấy policy embedding/tagging |
| `GET` | `/api/ai-module/embedding-tagging/rubric` | Lấy rubric embedding/tagging |
| `GET` | `/api/ai-module/embedding-tagging/ground-truth` | Lấy ground truth embedding/tagging |

## Ingestion / full flow

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/ingestion` | Chạy flow ingestion: gatekeeper -> extract -> embed/tag |
| `POST` | `/api/ai-module/full-pipeline` | Chạy full flow ingestion + generation/review |

## Question generation

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/question-generation` | Chạy generation |
| `POST` | `/api/ai-module/question-generation/debug` | Route debug hiện có, nhưng đang trả cùng payload runtime như generation thường |
| `GET` | `/api/ai-module/question-generation/rubric` | Lấy rubric generation/review theo subject + questionType |
| `GET` | `/api/ai-module/question-generation/ground-truth` | Lấy ground truth generation theo subject + questionType |
| `POST` | `/api/ai-module/question-generation/regression` | Chạy regression theo ground truth |

## Question review / generation review

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/question-review` | Review bộ câu hỏi có sẵn |
| `POST` | `/api/ai-module/generation-review` | Chạy generation + review |
| `POST` | `/api/ai-module/generation-review/debug` | Route debug hiện có, nhưng đang trả cùng payload runtime như generation-review thường |
| `POST` | `/api/ai-module/generation-review/export` | Export package JSON chuẩn hoá |

## Code mentor

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/code-mentor` | Chạy mentor |
| `POST` | `/api/ai-module/code-mentor/debug` | Chạy mentor và trả thêm policy/rubric/ground truth |
| `GET` | `/api/ai-module/code-mentor/policy` | Lấy policy mentor |
| `GET` | `/api/ai-module/code-mentor/rubric` | Lấy rubric mentor |
| `GET` | `/api/ai-module/code-mentor/ground-truth` | Lấy ground truth mentor |

## Provider / connection

| Method | Route | Mục đích |
|---|---|---|
| `GET` | `/api/ai-module/providers` | Lấy danh sách provider + summary |
| `GET` | `/api/ai-module/providers/{provider}/models` | Lấy catalog model của provider |
| `GET` | `/api/ai-module/providers/{provider}/ping` | Ping provider thực tế |
| `POST` | `/api/ai-module/providers/reload` | Reload provider config từ `.env` / config |

## Upload / prototype ingest

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/uploads/ingest` | Upload file thật, ingest prototype, trả `suggestedRawContent` + parser metadata |

## Run history

| Method | Route | Mục đích |
|---|---|---|
| `GET` | `/api/ai-module/history?functionName=&take=` | Lấy lịch sử tổng hoặc lọc theo function |
| `GET` | `/api/ai-module/history/{functionName}?take=` | Lấy lịch sử benchmark theo function |
| `GET` | `/api/ai-module/history/{functionName}/{runId}` | Lấy file JSON chi tiết của một run |

## Benchmark sessions

| Method | Route | Mục đích |
|---|---|---|
| `POST` | `/api/ai-module/benchmark-sessions` | Lưu một đợt benchmark/session |
| `GET` | `/api/ai-module/benchmark-sessions` | Lấy danh sách session |
| `GET` | `/api/ai-module/benchmark-sessions/{sessionId}` | Lấy chi tiết một session |

## Ghi chú

- `providers/reload` dùng khi vừa sửa `.env`.
- `prompts/reload` dùng khi vừa sửa `App_Data/ai-prompts.json`.
- `uploads/ingest` là route hữu ích nhất để đưa `docx/pptx/pdf/image` vào UI prototype mà không cần tự viết tay `rawContent`.
- `question-generation/debug` và `generation-review/debug` hiện là route debug placeholder; nếu cần payload debug riêng thì phải bổ sung thêm ở orchestrator/controller.

Tài liệu này chỉ tập trung vào route. Phần flow nghiệp vụ xem thêm trong `Specs/`.
