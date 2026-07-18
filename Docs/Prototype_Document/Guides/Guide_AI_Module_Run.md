# Hướng dẫn chạy AI Module

## Mục tiêu

Tài liệu này hướng dẫn cách build, cấu hình và chạy prototype `.NET` của AI module.

## Thư mục chính

- solution: `src-dotnet/Ape.AiModule.slnx`
- web app: `src-dotnet/Ape.AiModule.Api`
- tài liệu: `Docs/Prototype_Document/`

## Yêu cầu môi trường

- `.NET SDK 10`
- kết nối internet nếu cần gọi provider thật
- API key hợp lệ cho `OpenAI`, `Gemini`, `Cohere`

Kiểm tra nhanh:

```powershell
dotnet --version
```

## Cấu hình API key và endpoint

File cấu hình kiểu `ENV` nằm tại:

- `src-dotnet/Ape.AiModule.Api/.env`

Mẫu cấu hình:

```env
AIProviders__OpenAI__ApiKey=your_openai_key
AIProviders__OpenAI__BaseUrl=https://api.openai.com/v1/
AIProviders__OpenAI__ApiVersion=v1

AIProviders__Gemini__ApiKey=your_gemini_key
AIProviders__Gemini__BaseUrl=https://generativelanguage.googleapis.com/
AIProviders__Gemini__ApiVersion=v1beta

AIProviders__Cohere__ApiKey=your_cohere_key
AIProviders__Cohere__BaseUrl=https://api.cohere.com/
AIProviders__Cohere__ApiVersion=v1
```

Sau khi sửa `.env`, có thể reload mà không cần restart app:

```http
POST /api/ai-module/providers/reload
```

## Build

```powershell
dotnet build .\src-dotnet\Ape.AiModule.slnx
```

## Run

```powershell
dotnet run --project .\src-dotnet\Ape.AiModule.Api
```

UI operator được serve trực tiếp từ `wwwroot` của API.

## Kiểm tra sau khi chạy

1. Mở UI local do ASP.NET Core in ra.
2. Vào phần `Overview`.
3. Bấm `Reload Providers`.
4. Ping lần lượt `OpenAI`, `Gemini`, `Cohere`.
5. Mở các tab chức năng để chạy thử.

## Các route cần nhớ

- `GET /api/ai-module/providers`
- `GET /api/ai-module/providers/{provider}/models`
- `GET /api/ai-module/providers/{provider}/ping`
- `POST /api/ai-module/uploads/ingest`
- `POST /api/ai-module/gatekeeper`
- `POST /api/ai-module/extracted-content`
- `POST /api/ai-module/embedding-tagging`
- `POST /api/ai-module/retrieval/plan`
- `GET /api/ai-module/context-packs/{packId}`
- `POST /api/ai-module/generation-review`
- `POST /api/ai-module/code-mentor`
- `GET /api/ai-module/history`

## Nơi lưu dữ liệu runtime

- `src-dotnet/Ape.AiModule.Api/App_Data/ai-prompts.json`
- `src-dotnet/Ape.AiModule.Api/App_Data/*-policy.json`
- `src-dotnet/Ape.AiModule.Api/App_Data/ai-rubrics/`
- `src-dotnet/Ape.AiModule.Api/App_Data/ai-groundtruth/`
- `src-dotnet/Ape.AiModule.Api/App_Data/run-history/`
- `src-dotnet/Ape.AiModule.Api/App_Data/context-packs/`
- `src-dotnet/Ape.AiModule.Api/App_Data/uploads/`

## Ghi chú vận hành

- `full-pipeline` hiện chỉ gồm `ingestion + generation/review`.
- `question-generation/debug` và `generation-review/debug` hiện vẫn là debug placeholder.
- PDF đã dùng parser thật qua `PdfPig`.
- `docx/pptx` đang ở mức parser prototype bằng OpenXML text + media extraction.
- Để test gần production cho tạo đề, thứ tự nên là:
  1. `Extracted Content`
  2. `Embedding + Auto Tagging`
  3. `Retrieval Plan`
  4. `Generation + Review` bằng `contextPackId`
- Nếu cần so model công bằng, nên dùng lại cùng một `contextPackId`.
