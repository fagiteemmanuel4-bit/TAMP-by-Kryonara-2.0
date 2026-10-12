# AI Instructor: architecture and setup

Goal: an AI model acts as TAMP's course author (the "instructor"), so you do not have to hire writers. It drafts the outline, the 63 daily topics, the assignments and the exam. Humans check and publish. Backend work comes later; everything below is ready for that.

## 1. What the AI must understand about TAMP (the platform brief)
- Students are beginners in Nigeria and nearby countries, often on phones and slow data, who want remote work.
- Every course = 3 levels (Beginner, Intermediate, Advanced) x 21 topics = 63 topics, one topic per day, about 50 minutes each (notes + 3 or more videos).
- Each level ends with an assignment. Submitting closes the level for good. The Advanced assignment is the final project. A timed final exam (pass mark 60%) comes before the final project. Certificates are issued after a human approves the final project.
- Content is made of blocks: heading, paragraph, tip/warn/note, code (read-only, numbered lines), quiz (2 to 3 questions), video (YouTube).
- The AI's full instructions are in `system-prompt.txt` (also built into the admin). Its output format is `course-schema.json`.

## 2. The pipeline (how a course gets made)
1. **Outline**: admin enters title, audience, price, start date. AI returns `tamp.outline.v1` (63 titles, objectives, 3 assignments, skills).
2. **Topics**: AI writes topics in small batches (3 to 5 per request) so answers stay complete. Returns `tamp.topics.v1`.
3. **Exam**: AI returns `tamp.exam.v1` (15 questions).
4. **Videos**: the AI gives a title and `searchQuery`. A tool (YouTube Data API) or a human picks real videos and adds `youtubeId`. The AI must never invent IDs.
5. **Automatic checks**: the admin validates structure (3 levels, 21 topics, valid blocks, quizzes, IDs, exam) and warns about thin topics.
6. **Human review**: a person reads the content and ticks every video in "Verify videos". Publishing is blocked until all checks pass and videos are verified.
7. **Publish**: the course appears in the student catalog. Unpublish any time.

## 3. Using it today (no backend): manual mode
Admin > AI instructor: build a prompt, paste it into any AI chat (for example Claude), paste the JSON answer back, import, repeat for the topic batches and the exam, check, verify videos, publish. In the demo, publishing makes the course appear in the student dashboard (same browser address).

## 4. Connecting the AI properly (backend plan)
The model key must live on the server. Build:
- `POST /api/admin/v1/ai/generate` {stage, courseId, prompt} -> {output} (the admin's "Generate with AI" button already calls this). Better: return a job id and let the admin poll `GET /ai/jobs/:id`, because a topic batch can take a minute.
- Server side: call the model with `system-prompt.txt` as the system message and the task as the user message. Ask for JSON only; validate against `course-schema.json`; retry once with the validation errors if it fails.
- Run topic batches in parallel (for example 5 jobs of 3 topics), then merge. Store every generation (prompt, output, model, cost, time, admin) for audit.
- **Video tool**: for each `searchQuery` call YouTube Data API v3 `search.list` (videoEmbeddable=true, safeSearch=strict, relevanceLanguage=en), then `videos.list` (status, contentDetails) to check that it is embeddable, public and 5 to 25 minutes long. Offer the top 3 to the reviewer. Embed with youtube-nocookie.com.
- **Optional checks**: reading level score, plagiarism check against the web, banned-topics filter, link checker.
- **Cost control**: batch size limits, per-course budget, caching of outlines.
- **Roles** for the AI: (a) Course author (built now). (b) Assignment grading assistant that drafts feedback for a reviewer (later, human approves). (c) Student tutor that answers questions about the topic (later, grounded only in the course text, with a "ask a human" fallback).

## 5. Safety and quality rules (already in the system prompt)
No invented facts, links or IDs; no income promises; no copied text; plain English; every AI draft is reviewed by a human; every published course records `meta.generatedBy`, `model` and `reviewedBy`. Students should see a short note that courses are written with AI and reviewed by staff.

## 6. How the student site reads courses
`dashboard.js` loads published packages from `window.TAMP_COURSES` (static files) and from the `tamp_courses` store (demo). In production the backend serves `GET /courses` and `GET /courses/:id/package` (only unlocked topics, never the exam answers). A package with the same `id` as a built-in course replaces it.

## 7. Files
`system-prompt.txt` the AI's instructions | `course-schema.json` the data format | `example-topic.json` a style example | `ai.js` (admin) prompt builder, importer, validator, review and publish.
