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

| **Frontend** | React 18 + Vite | Lightning-fast HMR, instant cold start, lightweight bundle, standard SPA architecture with `react-router-dom`. |
| **Routing** | React Router DOM v6 | Clean client-side routing, protected routes, declarative navigation, and route parameters. |
| **Styling** | Tailwind CSS + Lucide Icons | Utility-first, clean design system, responsive layouts without heavy UI library dependencies. |
| **Backend** | Node.js + Express.js | Modular REST architecture, battle-tested middleware ecosystem, high I/O throughput. |
| **Database** | MongoDB + Mongoose | Flexible document model matching Appendix A schema; includes an in-memory fallback store for offline tests and evaluation. |
| **Authentication** | JWT with HTTP-only Cookies | Secure cookie-based session persistence; prevents XSS access to tokens; protected frontend and backend routes. |
| **Web Scraping** | Cheerio + Axios + SSRF Guard | Lightweight, fast HTML parsing without headless browser bloat; strict IP and URL safety filters. |
| **LLM Provider** | Google Gemini / Groq / OpenAI | Free tier available via Google AI Studio (`gemini-1.5-flash`) or Groq (`llama-3.3-70b-versatile`), with deterministic fallback. |
| **Testing** | Jest | Lightweight, zero-config automated test runner for algorithms, schemas, and CLI handling. |


## 3. Research & Scraping Strategy

1. **Safety & SSRF Protection**: Every user-provided URL is validated against private IP blocks (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, link-local, AWS/GCP metadata endpoints).
2. **Dynamic Discovery**: Crawls the home page and discovers internal paths matching `about`, `company`, `careers`, `jobs`, `culture`, and `team`.
3. **Cheerio Extraction**: Strips non-content scripts, styles, SVGs, and navbars. Sanitizes text and strips prompt injection markers (`ignore previous instructions`).
4. **Resilience**: Network timeouts (6 seconds) and 404s are caught gracefully and logged in `source.pages_used` or reported in `company_brief` without throwing errors or halting the pipeline.
5. **No Hallucinations**: When public company information is unreachable, the system transparently indicates that research is based solely on the job description.



## 4. Known Limitations

- **JavaScript Single-Page Apps (SPA) Crawling**: Websites rendering content purely via client-side JavaScript (e.g. CSR without SSR) may yield minimal raw HTML text with Cheerio. In such cases, the pipeline falls back gracefully to job description details.
- **Strict Anti-Bot Firewalls**: Corporate firewalls (e.g. Cloudflare Captcha) that block automated HTTP GET requests are safely skipped and reported under `pages_used` / `company_brief.summary` without crashing.
