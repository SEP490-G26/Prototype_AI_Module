# Benchmark AI Cost

Repo này hiện có 2 khối được tách rõ ràng:

1. prototype `.NET` đang active
2. benchmark NodeJS legacy

## Trạng thái hiện tại

- khối `.NET` là hướng chính đang tiếp tục phát triển
- khối này dùng để benchmark, production test harness, và làm nền để ghép vào BE thật sau này
- khối NodeJS chỉ giữ lại để tham chiếu benchmark cũ, tránh nhầm với phần active

## Cấu trúc chính

- `src-dotnet/`
  - solution `.NET` hiện tại
  - chứa API, operator UI, contracts, services
- `Docs/`
  - tài liệu hướng dẫn, route, run guide, DB-ready collections
- `legacy-node-benchmark/`
  - benchmark NodeJS/React cũ
  - đã được tách riêng để tránh nhầm với khối `.NET`

## Điểm vào chính hiện tại

Nếu cần chạy module AI đang dùng hiện tại, đi theo hướng `.NET`:

- solution: `src-dotnet/Ape.AiModule.slnx`
- web app: `src-dotnet/Ape.AiModule.Api`

## Tài liệu nên đọc trước

1. [Hướng dẫn chạy module](Docs/Prototype_Document/Guides/Guide_AI_Module_Run.md)
2. [Tổng quan 6 chức năng AI](Docs/Prototype_Document/Specs/Spec_AI_Module_6_Functions_Summary.md)
3. [Bảng route API](Docs/Prototype_Document/Guides/Guide_AI_Module_API_Routes.md)
4. [Checklist chuyển từ prototype sang BE production](Docs/Prototype_Document/Guides/Guide_Prototype_To_BE_Production_Integration.md)
5. [Hướng dẫn UI operator](Docs/Prototype_Document/Guides/Guide_AI_Module_Operator_UI.md)
6. [Quy ước đóng góp](CONTRIBUTING.md)

## Chạy nhanh module `.NET`

Yêu cầu:

- `.NET SDK 10`
- file `.env` trong `src-dotnet/Ape.AiModule.Api`

Build:

```powershell
dotnet build .\src-dotnet\Ape.AiModule.slnx
```

Run:

```powershell
dotnet run --project .\src-dotnet\Ape.AiModule.Api
```

Sau khi app chạy:

- mở URL local do ASP.NET Core in ra
- UI operator sẽ được serve trực tiếp từ `wwwroot`

## Provider config `.NET`

File:

- `src-dotnet/Ape.AiModule.Api/.env`

Mẫu key:

```env
AIProviders__OpenAI__ApiKey=...
AIProviders__OpenAI__BaseUrl=...

AIProviders__Gemini__ApiKey=...
AIProviders__Gemini__BaseUrl=...

AIProviders__Cohere__ApiKey=...
AIProviders__Cohere__BaseUrl=...

AI_BENCHMARK_TESTER=member_name
```

## Lưu ý khi test report

Trước khi chạy test để sinh `run-history`, `benchmark csv`, và `AI_Benchmark_Report.xlsx`, mỗi thành viên nên set:

```env
AI_BENCHMARK_TESTER=member_name
```

Ví dụ:

- `AI_BENCHMARK_TESTER=anhtuan`
- `AI_BENCHMARK_TESTER=linhpt`
- `AI_BENCHMARK_TESTER=hungnq`

Mục đích:

- tự động điền cột `tester` trong các sheet `Benchmark`
- giảm phải sửa tay trong Excel sau khi sync report
- dễ gộp report của nhiều người mà không bị lẫn run

Có thể reload config sau khi sửa `.env` bằng route:

```http
POST /api/ai-module/providers/reload
```

## Các tính năng chính của module `.NET`

6 function AI:

1. `AI Gatekeeper`
2. `AI Extracted Content`
3. `AI Embedding + Auto Tagging`
4. `AI Question Generation`
5. `AI Review Result of AI Question Generation`
6. `AI Code Mentor`

Các flow tổng hợp:

- `Ingestion`
- `Full Pipeline`
- `Generation + Review`

## Điểm kỹ thuật hiện tại

Module `.NET` hiện tại đã có:

- provider auto load models
- prompt/policy/rubric/ground truth file-backed
- run history file-backed
- benchmark sessions
- raw usage capture nếu provider trả usage thật
- `usage_source = raw | estimated | mixed`
- normalized error catalog ở mức runtime
- parser `pdf` thật qua `PdfPig`
- parser `docx/pptx` bằng OpenXML text + media extraction ở mức prototype

## Nơi lưu dữ liệu runtime

Thư mục:

- `src-dotnet/Ape.AiModule.Api/App_Data`

Trong đó có:

- `ai-prompts.json`
- `*-policy.json`
- `ai-rubrics/*.json`
- `ai-groundtruth/*.json`
- `run-history/...`
- `uploads/...`

## API chính

Provider:

- `GET /api/ai-module/providers`
- `GET /api/ai-module/providers/{provider}/models`
- `GET /api/ai-module/providers/{provider}/ping`
- `POST /api/ai-module/providers/reload`

Main runtime:

- `POST /api/ai-module/gatekeeper`
- `POST /api/ai-module/extracted-content`
- `POST /api/ai-module/embedding-tagging`
- `POST /api/ai-module/generation-review`
- `POST /api/ai-module/code-mentor`
- `POST /api/ai-module/ingestion`
- `POST /api/ai-module/full-pipeline`

Lưu ý:

- `full-pipeline` hiện gồm `ingestion + generation/review`
- chưa bao gồm `code mentor`

Upload:

- `POST /api/ai-module/uploads/ingest`

History:

- `GET /api/ai-module/history`
- `GET /api/ai-module/history/{functionName}`
- `GET /api/ai-module/history/{functionName}/{runId}`

Sessions:

- `POST /api/ai-module/benchmark-sessions`
- `GET /api/ai-module/benchmark-sessions`
- `GET /api/ai-module/benchmark-sessions/{sessionId}`

## Khối benchmark NodeJS legacy

Phần legacy hiện nằm trong:

- `legacy-node-benchmark/`

Khối này chứa:

- `legacy-node-benchmark/backend/`
- `legacy-node-benchmark/frontend/`
- `legacy-node-benchmark/package.json`

Nếu cần chạy lại bản cũ:

```bash
cd legacy-node-benchmark
npm install
npm run dev:backend
npm run dev:frontend
```

Tuy nhiên, hướng được ưu tiên để tiếp tục phát triển là `src-dotnet/`.

## Ghi chú

- Prototype `.NET` này là nền để merge vào BE tổng sau này.
- Hiện tại nó vẫn là file-backed thay vì Mongo-backed.
- Khi chuyển vào production BE, sẽ cần nối repository thật, Judge0, và storage thật.
