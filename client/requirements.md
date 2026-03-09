## EduPro Product Requirements

### Scope
This document captures **Part 1/4** requirements: AI Features and Adaptive Learning.
Products in scope: IELTS, SAT, THPTQG Văn, and general practice flows.

### Packages
canvas-confetti | Celebration effect when completing a test  
@types/canvas-confetti | Types for canvas-confetti  
recharts | Dashboard analytics and progress charts

## 1) AI-Powered Features

### 1.1 AI Chấm bài Writing (IELTS / THPTQG Văn)
**User value**
- Chấm IELTS Writing Task 1/2 theo 4 tiêu chí: `TR`, `CC`, `LR`, `GRA`.
- Trả về band từng tiêu chí + overall band.
- Highlight lỗi trực tiếp trên bài viết:
  - Đỏ: ngữ pháp
  - Vàng: từ vựng lặp
  - Xanh: gợi ý cải thiện
- So sánh bài viết với sample band 7.0/8.0.
- Lưu lịch sử chấm và biểu đồ tiến bộ theo thời gian.

**Acceptance criteria (MVP)**
- User gửi bài viết và nhận kết quả dưới 15 giây cho bài <= 350 từ.
- Có score cho đủ 4 tiêu chí và overall.
- Có ít nhất 1 danh sách lỗi gắn theo vị trí ký tự (`start`, `end`, `type`, `message`).
- History lưu được theo từng attempt và hiển thị line chart theo ngày.

**Suggested data model**
- `writing_submissions`: id, user_id, exam_type, task_type, prompt, essay_text, created_at
- `writing_scores`: id, submission_id, tr_band, cc_band, lr_band, gra_band, overall_band, ai_summary
- `writing_annotations`: id, submission_id, start_idx, end_idx, label, suggestion
- `writing_comparisons`: id, submission_id, sample_band, strengths, gaps, model_text

### 1.2 AI Study Planner
**User inputs**
- Ngày thi, điểm hiện tại, điểm mục tiêu, số giờ rảnh mỗi ngày.

**User value**
- Sinh lộ trình học theo tuần: chủ đề học, đề cần làm, phần ôn tập.
- Nút `Thêm vào Google Calendar`.
- Tự điều chỉnh lộ trình khi user nhanh/chậm hơn kế hoạch.

**Acceptance criteria (MVP)**
- Tạo được plan >= 1 tuần và <= đến ngày thi.
- Mỗi tuần có mục tiêu điểm + task cụ thể theo ngày.
- User bấm sync để tạo calendar events (manual sync).
- Có action `Replan` dựa trên tiến độ thực tế 7 ngày gần nhất.

**Suggested data model**
- `study_plans`: id, user_id, exam_date, current_score, target_score, daily_hours, status
- `study_plan_weeks`: id, plan_id, week_index, focus_topics, target_outcome
- `study_plan_tasks`: id, week_id, date, task_type, title, est_minutes, source_ref
- `calendar_integrations`: id, user_id, provider, access_token_encrypted, refresh_token_encrypted, expiry_at

### 1.3 AI Phân tích điểm yếu
**User value**
- Sau mỗi 5 đề đã làm, tổng hợp dạng sai nhiều nhất và chủ đề cần ôn.
- Đề xuất bài tập mục tiêu (ví dụ: yếu Xác suất thống kê thì ưu tiên 10 câu tương ứng).
- Radar chart hiển thị điểm mạnh/yếu theo mảng kiến thức.

**Acceptance criteria (MVP)**
- Batch phân tích chạy tự động khi user đủ 5 kết quả mới.
- Trả ra top 3 weak topics + danh sách bài tập gợi ý.
- Radar chart có dữ liệu tối thiểu 5 trục kỹ năng.

### 1.4 AI Chatbot Giải bài
**User value**
- Hiểu ngữ cảnh câu hỏi user đang làm.
- Trả lời kiểu giải thích từng bước, không chỉ trả đáp án.
- Hỗ trợ follow-up liên tục trong cùng hội thoại.
- Free: 5 câu/ngày; Pro: không giới hạn.

**Acceptance criteria (MVP)**
- Chat request chứa `question_id` + `selected_answer` + `exam_type`.
- Trả về giải thích theo từng bước + hint tiếp theo.
- Hệ thống chặn quota cho Free theo ngày.

### 1.5 AI Tạo đề cá nhân hóa
**User value**
- Tạo đề cá nhân dựa trên các dạng user hay sai.
- Gợi ý `Daily Challenge` 10 câu mỗi sáng theo trình độ hiện tại.

**Acceptance criteria (MVP)**
- Sinh được bộ 10 câu theo trọng số lỗi lịch sử.
- Mỗi user chỉ có tối đa 1 daily challenge mỗi ngày.
- Sau khi làm xong, kết quả feed ngược vào engine phân tích điểm yếu.

## 2) Adaptive Learning Engine

### 2.1 Spaced Repetition System (SRS)
**Core**
- Thuật toán SM-2 cho flashcard từ vựng IELTS/SAT.
- Câu sai/lần ôn kém được lên lịch lại 1 -> 3 -> 7 -> 30 ngày.
- Dashboard hiển thị: "Hôm nay cần ôn lại X từ / X câu".
- Hỗ trợ import Anki deck `.apkg`.

**Acceptance criteria (MVP)**
- Mỗi flashcard có `ease_factor`, `interval`, `repetition`, `due_date`.
- Mỗi lần review cập nhật lịch đúng SM-2.
- Dashboard hiển thị số lượng due hôm nay theo user timezone.

### 2.2 Adaptive Testing (SAT-style)
**Core**
- Test module 1 quyết định module 2 dễ/khó.
- Điều chỉnh độ khó theo IRT.
- Ước tính điểm realtime trong lúc làm bài.

**Acceptance criteria (Phase 2)**
- Có ngân hàng câu hỏi gắn tham số khó (`a`, `b`, `c`) hoặc fallback level.
- Sau module 1, hệ thống route sang module 2 phù hợp.
- UI hiển thị estimated score với confidence interval.

### 2.3 Skill Tree
**Core**
- Mỗi môn có skill tree kiểu Duolingo.
- Bắt buộc mở khóa level thấp trước level cao.
- Ví dụ Toán: Số học -> Đại số -> Hàm số -> Giải tích -> Tích phân.
- Trạng thái node:
  - Hoàn thành: xanh
  - Đang học: vàng
  - Chưa mở: xám

**Acceptance criteria (MVP)**
- Node có `prerequisite_node_ids`.
- Chỉ cho phép học node khi đủ điều kiện tiên quyết.
- Lưu tiến độ theo `user_id + node_id`.

## 3) API Draft
Existing endpoints:
- `GET /api/tests`
- `GET /api/tests/:id`
- `GET /api/results`
- `POST /api/results`

New endpoints (proposed):
- `POST /api/ai/writing/grade`
- `GET /api/ai/writing/history`
- `POST /api/ai/study-plans/generate`
- `POST /api/ai/study-plans/:id/replan`
- `POST /api/integrations/google-calendar/connect`
- `POST /api/integrations/google-calendar/sync`
- `GET /api/ai/weakness-analysis`
- `POST /api/ai/chat/explain`
- `POST /api/ai/personalized-tests/generate`
- `GET /api/srs/due-today`
- `POST /api/srs/review`

## 4) Priority
MVP (build first):
1. AI Writing grading + history chart
2. AI Study Planner + manual Google Calendar sync
3. AI Weakness Analysis + recommendation set
4. AI Chatbot with free/pro quota
5. SRS SM-2 + due dashboard + skill tree lock/unlock

Phase 2:
1. Adaptive testing with full IRT calibration
2. Anki `.apkg` import
3. More advanced auto-replan and confidence scoring

## 5) Notes
Tailwind config should keep:
```ts
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
}
```
