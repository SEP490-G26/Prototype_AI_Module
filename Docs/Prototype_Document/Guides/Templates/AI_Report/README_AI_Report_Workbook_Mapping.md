# README AI Report Workbook Mapping

## Mục tiêu

File này giúp map nhanh giữa các file CSV template và các sheet trong workbook Excel.

## Mapping đề xuất

| Workbook Sheet | CSV Template | Mục đích |
|---|---|---|
| `Input Quality Benchmark` | `input_quality_benchmark_template.csv` | Benchmark khối đầu vào: extracted, embedding, chunking, autotagging |
| `Question Generation Benchmark` | `question_generation_benchmark_template.csv` | Benchmark khối core tạo câu hỏi và review |
| `Code Mentor Benchmark` | `code_mentor_benchmark_template.csv` | Benchmark chất lượng AI mentor |
| `AI Config Version Tracking` | `ai_config_version_tracking_template.csv` | Theo dõi prompt, rubric, policy, ground truth version |
| `Scoring Dictionary` | `scoring_dictionary_template.csv` | Chuẩn hóa định nghĩa score, trọng số, pass threshold |

## Thứ tự import khuyến nghị

1. import `scoring_dictionary_template.csv`
2. import `ai_config_version_tracking_template.csv`
3. import `input_quality_benchmark_template.csv`
4. import `question_generation_benchmark_template.csv`
5. import `code_mentor_benchmark_template.csv`

## Ghi chú khi dùng

- mỗi sheet benchmark nên giữ `run_id` là khóa tra cứu chính
- luôn điền `prompt_version`, `rubric_version`, `policy_version`, `ground_truth_set_id`
- nếu 1 run không dùng rubric hoặc ground truth thì ghi `N/A`, không để trống
- nên khóa hàng header và bật filter cho toàn bộ sheet

## Gợi ý naming workbook

Ví dụ:

```text
AI_Benchmark_Report_v1.xlsx
AI_Benchmark_Report_2026_Q3.xlsx
AI_Benchmark_Report_Final_Defense.xlsx
```
