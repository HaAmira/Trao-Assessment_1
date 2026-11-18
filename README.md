# The AI Interview Prep Kit – Full-Stack Engineering Assessment

A production-ready full-stack web application and automated CLI evaluation suite that dynamically researches companies, extracts and classifies job requirements, generates a categorized interview preparation kit, enforces 100% requirement coverage with a two-pass deterministic checker, generates a deterministic study schedule, and provides interactive flashcard practice.

Strictly conforms to **Appendix A (JSON Schema)** and **Section 9 / Appendix B (Mandatory Batch CLI Evaluation)**.

---

## 1. Project Overview

Preparing for technical interviews requires tailoring study materials to the target company's business domain, tech stack, and specific role requirements. The AI Interview Prep Kit automates this end-to-end:
- **Input**: Target Job Description, Company Website URL, and Days available before interview (1 to 60 days). Supports single submissions and batch file uploads.
- **Dynamic Research**: Crawls company websites via Cheerio, discovering About, Careers, and hiring pages while respecting SSRF guardrails and rate limits.
- **10-Stage Pipeline**: Sequentially extracts roles, classifies requirements (`technical`, `behavioural`, `domain`), assigns priority (`must`, `nice`), generates categorized questions, generates flashcards, runs a 2-pass deterministic coverage check in JavaScript, and computes an integer-minute study schedule.
- **Kit Builder**: Inline editing, custom additions, pinning, reordering, and category moving. Pinned and edited items survive section regenerations.
- **Practice Mode**: Interactive flashcards with active recall, answer reveal, confidence grading (`low`, `medium`, `high`), progress tracking, and low-confidence card prioritization.
- **Mandatory Batch Evaluation CLI**: Automated non-crashing evaluation over multiple test cases via `npm run evaluate -- --input <cases.json> --output <kits.json>`.

---

## 2. Tech Stack & Reasoning

| Layer | Technology | Reasoning |
|---|---|---|
| **Frontend** | React 18 + Vite | Lightning-fast HMR, instant cold start, lightweight bundle, standard SPA architecture with `react-router-dom`. |
| **Routing** | React Router DOM v6 | Clean client-side routing, protected routes, declarative navigation, and route parameters. |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first, clean design system, responsive layouts without heavy UI library dependencies. |
| **Backend** | Node.js + Express.js | Modular REST architecture, battle-tested middleware ecosystem, high I/O throughput. |
| **Database** | MongoDB + Mongoose | Flexible document model matching Appendix A schema; includes an in-memory fallback store for offline tests and evaluation. |
| **Authentication** | JWT with HTTP-only Cookies | Secure cookie-based session persistence; prevents XSS access to tokens; protected frontend and backend routes. |
| **Web Scraping** | Cheerio + Axios + SSRF Guard | Lightweight, fast HTML parsing without headless browser bloat; strict IP and URL safety filters. |
| **LLM Provider** | Google Gemini / Groq / OpenAI | Free tier available via Google AI Studio (`gemini-1.5-flash`) or Groq (`llama-3.3-70b-versatile`), with deterministic fallback. |
| **Testing** | Jest | Lightweight, zero-config automated test runner for algorithms, schemas, and CLI handling. |

---

## 3. Architecture

```
ai-interview-prep-kit/
├── backend/
│   ├── src/
│   │   ├── config/              # Environment config and MongoDB connector
│   │   ├── controllers/         # Auth and Kit route controllers
│   │   ├── middleware/          # JWT auth guard, error handling
│   │   ├── models/              # User and Kit Mongoose schemas
│   │   ├── routes/              # Express API route endpoints
│   │   ├── services/
│   │   │   ├── llm/             # LLM provider adapter (Gemini, Groq, OpenAI, Mock)
│   │   │   ├── scraper/         # Cheerio crawler and page cleaner
│   │   │   ├── pipeline/        # 10-stage sequential pipeline
│   │   │   │   ├── requirementExtractor.js   # Stages A, B, C
│   │   │   │   ├── companyResearcher.js      # Stages D, E
│   │   │   │   ├── questionGenerator.js      # Stage F
│   │   │   │   ├── flashcardGenerator.js     # Stage G
│   │   │   │   ├── coverageChecker.js        # Stage H & I (2-pass deterministic)
│   │   │   │   └── scheduleGenerator.js      # Stage J (Deterministic JS)
│   │   │   │   └── kitPipeline.js            # Master orchestrator
│   │   │   └── kitBuilder/      # Editing, pinning, section regeneration
│   │   ├── utils/               # SSRF guard, text sanitizers
│   │   ├── app.js               # Express application configuration
│   │   └── server.js            # HTTP server bootstrap
├── cli/
│   └── evaluate.js              # Mandatory batch evaluation script
├── data/
│   └── sample_cases.json        # Diverse test cases for batch evaluation
├── frontend/                    # React.js + Vite frontend application
│   ├── src/
│   │   ├── components/          # Reusable UI cards, question bank, flashcard practice
│   │   ├── context/             # AuthContext (user, login, register, logout, cookies)
│   │   ├── pages/               # DashboardPage, NewKitPage, KitDetailPage, LoginPage, RegisterPage
│   │   ├── routes/              # AppRoutes, ProtectedRoute
│   │   ├── services/            # API client with credentials & VITE_ environment handling
│   │   ├── App.jsx              # Application router and provider shell
│   │   ├── main.jsx             # React DOM entry point
│   │   └── index.css            # Tailwind CSS directives
│   ├── public/                  # Public assets
│   ├── index.html               # Vite HTML entry point
│   └── vite.config.js           # Vite configuration with /api reverse proxy
├── tests/                       # Automated Jest test suite
│   ├── appendixASchema.test.js
│   ├── batchEvaluation.test.js
│   ├── coverageChecker.test.js
│   ├── requirementExtraction.test.js
│   └── scheduleGenerator.test.js
├── package.json
└── README.md
```

---

## 4. Environment Variables

Create a `.env` file in the project root:

```ini
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/interview_prep_kit
JWT_SECRET=super_secret_development_jwt_key_12345
JWT_EXPIRES_IN=7d

# Free Tier LLM Providers
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
LLM_PROVIDER=auto
```

For the frontend, optional environment variables in `frontend/.env` (or via deployment platform):
```ini
VITE_API_URL=/api
VITE_BACKEND_URL=http://localhost:5000
```

> **Obtaining Free LLM Keys**:
> - **Google Gemini**: Obtain a free API key at [Google AI Studio](https://aistudio.google.com/).
> - **Groq**: Obtain a free fast API key at [Groq Console](https://console.groq.com/).
> - If no API key is provided, the application automatically runs on a high-fidelity **Deterministic Mock Generator**, ensuring tests and batch evaluation run completely offline without cost or network dependencies.

---

## 5. Local Setup & Running

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (Optional: an automatic in-memory fallback store is included if a local daemon is not running)

### Installation
```bash
# 1. Install root & backend dependencies
npm install

# 2. Install frontend dependencies (React + Vite)
npm --prefix frontend install
```

### Starting the Application
```bash
# Start backend (Port 5000)
npm run dev:backend

# Start frontend with Vite (Port 3000)
npm run dev:frontend

# Or run both concurrently
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 6. Research & Scraping Strategy

1. **Safety & SSRF Protection**: Every user-provided URL is validated against private IP blocks (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, link-local, AWS/GCP metadata endpoints).
2. **Dynamic Discovery**: Crawls the home page and discovers internal paths matching `about`, `company`, `careers`, `jobs`, `culture`, and `team`.
3. **Cheerio Extraction**: Strips non-content scripts, styles, SVGs, and navbars. Sanitizes text and strips prompt injection markers (`ignore previous instructions`).
4. **Resilience**: Network timeouts (6 seconds) and 404s are caught gracefully and logged in `source.pages_used` or reported in `company_brief` without throwing errors or halting the pipeline.
5. **No Hallucinations**: When public company information is unreachable, the system transparently indicates that research is based solely on the job description.

---

## 7. Requirement Coverage Algorithm (Pass 1 & Pass 2)

- **Pure JavaScript Determinism**: Operates without LLM randomness.
- **Pass 1**: Extracts all IDs from `role.requirements` (`r1, r2, ...`). Scans all generated questions and builds a `Set` of covered `requirement_ids`. Computes set difference `uncovered = allReqs \ coveredReqs`.
- **Stage I**: If `uncovered.length > 0`, targeted questions are synthesized specifically for each missing requirement.
- **Pass 2**: Re-evaluates coverage deterministically. Records `coverage.uncovered_requirement_ids` and guarantees `coverage.passes = 2`.

---

## 8. Deterministic Schedule Algorithm (Stage J)

- **Pure JavaScript (No LLM)**: Computes a daily study plan matching `days_available` (1 to 60 days).
- **Prioritization**:
  1. `must-have` priority requirements receive highest priority weight.
  2. Question difficulty (1 to 5) ranks harder topics earlier (Days 1, 2, ...).
  3. Category weights: System Design (4) -> Technical (3) -> Behavioural (2) -> Company Fit (1).
- **Durations**: Integer minutes allocated per day (45 to 120 minutes), with thematic focus descriptions.

---

## 9. Section Regeneration & Pinning Strategy

- Questions and flashcards feature three explicit states:
  - `generated`: AI created, eligible for replacement.
  - `edited`: User-modified text, preserved across regenerations.
  - `pinned`: Explicitly locked by user, never modified during regeneration.
- When regenerating the question bank, only `generated` questions are refreshed. Pinned and edited questions are preserved, after which coverage and schedule are recalculated.

---

## 10. Mandatory Batch Evaluation CLI (Appendix B)

Run the mandatory evaluation command:

```bash
npm run evaluate -- --input data/sample_cases.json --output data/output_kits.json
```

### CLI Capabilities:
- Processes all cases sequentially or concurrently.
- Reuses the exact same 10-stage pipeline as the web application.
- Supports relative links and local company URLs (`allowLocal: true`).
- Catches errors per case and continues processing without crashing.
- Records structured error objects with case index for failed cases.
- Targets 5 cases in < 15 minutes (finishes in under 1 second with mock/cached provider).

---

## 11. Automated Test Suite

Run the automated test suite:

```bash
npm test
```

Verified test coverage:
1. `tests/requirementExtraction.test.js`: Title, seniority, responsibilities, kind enums (`technical`, `behavioural`, `domain`), and priority (`must`, `nice`).
2. `tests/coverageChecker.test.js`: Deterministic JS calculation, 2-pass execution, and missing question synthesis.
3. `tests/scheduleGenerator.test.js`: Exactly requested days count, integer minutes, and must-have prioritization.
4. `tests/appendixASchema.test.js`: Strict validation of every single required field in Appendix A.
5. `tests/batchEvaluation.test.js`: Failure handling, error logging per case, and uninterrupted execution.

---

## 12. Deployment Instructions

### Frontend (Vercel / Netlify / Render)
1. Push repository to GitHub.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`.
6. Deploy.

### Backend (Render)
1. Create a **Web Service** on Render pointing to your repository.
2. Set **Root Directory** to `.`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm run start:backend`.
5. Add environment variables:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGODB_URI=your_mongodb_atlas_connection_string`
   - `JWT_SECRET=your_production_secret`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `GEMINI_API_KEY=your_gemini_key`
6. Deploy.

---

## 13. Known Limitations

- **JavaScript Single-Page Apps (SPA) Crawling**: Websites rendering content purely via client-side JavaScript (e.g. CSR without SSR) may yield minimal raw HTML text with Cheerio. In such cases, the pipeline falls back gracefully to job description details.
- **Strict Anti-Bot Firewalls**: Corporate firewalls (e.g. Cloudflare Captcha) that block automated HTTP GET requests are safely skipped and reported under `pages_used` / `company_brief.summary` without crashing.
