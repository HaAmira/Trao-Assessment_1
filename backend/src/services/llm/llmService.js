const axios = require('axios');
const config = require('../../config/env');

class LLMService {
  constructor() {
    this.geminiKey = config.GEMINI_API_KEY;
    this.groqKey = config.GROQ_API_KEY;
    this.openaiKey = config.OPENAI_API_KEY;
    this.openaiBaseUrl = config.OPENAI_BASE_URL;
    this.preferredProvider = config.LLM_PROVIDER;
  }

  getProvider() {
    if (this.preferredProvider !== 'auto') {
      return this.preferredProvider;
    }
    if (this.geminiKey) return 'gemini';
    if (this.groqKey) return 'groq';
    if (this.openaiKey) return 'openai';
    return 'mock';
  }

  async generateJSON(prompt, systemPrompt = 'You are an expert technical interviewer and hiring analyst. Return only valid raw JSON.') {
    const provider = this.getProvider();
    
    // Retry up to 2 times on rate-limit / transient error
    let lastError = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        if (provider === 'gemini') {
          return await this.callGemini(prompt, systemPrompt);
        } else if (provider === 'groq') {
          return await this.callGroq(prompt, systemPrompt);
        } else if (provider === 'openai') {
          return await this.callOpenAI(prompt, systemPrompt);
        } else {
          return this.callMock(prompt);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[LLMService] Attempt ${attempt} failed with provider '${provider}': ${err.message}`);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    console.warn(`[LLMService] Falling back to deterministic fallback due to: ${lastError?.message}`);
    return this.callMock(prompt);
  }

  async callGemini(prompt, systemPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nTask:\n${prompt}\n\nImportant: Output ONLY valid JSON without markdown tags.` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const response = await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 25000
    });

    const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) throw new Error('No content returned from Gemini API');
    return this.parseJSON(candidate);
  }

  async callGroq(prompt, systemPrompt) {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${systemPrompt} Always output valid JSON.` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${this.groqKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from Groq API');
    return this.parseJSON(content);
  }

  async callOpenAI(prompt, systemPrompt) {
    const url = `${this.openaiBaseUrl}/chat/completions`;
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `${systemPrompt} Always output valid JSON.` },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${this.openaiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content returned from OpenAI API');
    return this.parseJSON(content);
  }

  parseJSON(text) {
    if (typeof text === 'object') return text;
    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned);
  }

  // Deterministic Mock Generator for tests, offline mode and graceful degradation
  callMock(prompt) {
    const p = prompt.toLowerCase();

    // 1. Requirement Extraction
    if (p.includes('extract role') || p.includes('responsibilities and requirements')) {
      return {
        title: 'Full Stack Engineer',
        seniority: 'Mid-Senior',
        responsibilities: [
          'Design and maintain scalable full-stack web applications and microservices.',
          'Collaborate with product and design teams to ship responsive user interfaces.',
          'Optimize database queries and system performance for high throughput.',
          'Participate in code reviews, automated testing, and technical documentation.'
        ],
        requirements: [
          {
            id: 'r1',
            text: 'Experience with JavaScript/TypeScript, React/Next.js and Node.js ecosystems',
            kind: 'technical',
            priority: 'must'
          },
          {
            id: 'r2',
            text: 'Proficiency with relational and NoSQL databases such as MongoDB and PostgreSQL',
            kind: 'technical',
            priority: 'must'
          },
          {
            id: 'r3',
            text: 'System design experience including REST APIs, caching, and microservices architecture',
            kind: 'technical',
            priority: 'must'
          },
          {
            id: 'r4',
            text: 'Cross-functional collaboration and clear technical communication in an agile environment',
            kind: 'behavioural',
            priority: 'must'
          },
          {
            id: 'r5',
            text: 'Experience with cloud infrastructure (GCP/AWS), Docker, and CI/CD automation',
            kind: 'domain',
            priority: 'nice'
          }
        ]
      };
    }

    // 2. Company Brief Synthesis
    if (p.includes('company brief') || p.includes('what they do')) {
      return {
        summary: 'A fast-growing technology platform building modern software solutions and cloud-native digital infrastructure.',
        what_they_do: 'The company provides scalable software products, engineering platforms, and customer-focused digital tools designed to accelerate business workflows.',
        sources: ['https://example.com/about', 'https://example.com/careers']
      };
    }

    // 3. Question Generation
    if (p.includes('generate technical') || p.includes('generate questions') || p.includes('missing questions')) {
      return {
        questions: [
          {
            id: 'q1',
            requirement_ids: ['r1'],
            category: 'technical',
            prompt: 'How does the React virtual DOM reconciliation algorithm work, and how do Next.js Server Components differ from standard client components?',
            answer_outline: 'Explain reconciliation, fiber tree diffing by key and component type, SSR vs RSC execution model, and reduction of client JS bundle size.',
            difficulty: 3
          },
          {
            id: 'q2',
            requirement_ids: ['r2'],
            category: 'technical',
            prompt: 'When would you choose MongoDB over a relational database like PostgreSQL for high-scale microservices, and how do you handle data consistency?',
            answer_outline: 'Discuss schema flexibility, horizontal sharding, document embedding vs referencing, two-phase commits or transactional sessions, and eventual consistency trade-offs.',
            difficulty: 3
          },
          {
            id: 'q3',
            requirement_ids: ['r3'],
            category: 'system-design',
            prompt: 'Design an end-to-end distributed rate limiting service for an API gateway supporting 100,000 requests per second.',
            answer_outline: 'Cover algorithms (token bucket / sliding window log), Redis distributed locks or Lua scripts, local memory caching fallback, and HTTP 429 response handling.',
            difficulty: 4
          },
          {
            id: 'q4',
            requirement_ids: ['r4'],
            category: 'behavioural',
            prompt: 'Describe a situation where you had a strong technical disagreement with a teammate or product manager. How did you resolve it constructively?',
            answer_outline: 'Use STAR method: explain context, focus on data-driven benchmarks or user impact, active listening, finding compromise, and committing to shared outcomes.',
            difficulty: 2
          },
          {
            id: 'q5',
            requirement_ids: ['r5'],
            category: 'company-fit',
            prompt: 'Why are you interested in joining our engineering team, and how do your cloud and DevOps practices align with our deployment goals?',
            answer_outline: 'Connect personal engineering values with the company mission, highlight hands-on experience with automated CI/CD pipelines, and demonstrate curiosity about their scaling challenges.',
            difficulty: 2
          }
        ]
      };
    }

    // 4. Flashcard Generation
    if (p.includes('flashcard')) {
      return {
        flashcards: [
          {
            id: 'f1',
            front: 'What is the primary difference between useEffect and useLayoutEffect in React?',
            back: 'useEffect runs asynchronously after paint, avoiding blocking the browser; useLayoutEffect runs synchronously immediately after DOM mutations before paint, useful for measuring layout.',
            requirement_ids: ['r1']
          },
          {
            id: 'f2',
            front: 'What does the CAP theorem state regarding distributed databases?',
            back: 'A distributed system can guarantee at most two out of three: Consistency (every read gets latest write), Availability (every request receives non-error response), and Partition Tolerance.',
            requirement_ids: ['r2']
          },
          {
            id: 'f3',
            front: 'Explain the Token Bucket algorithm used in API rate limiting.',
            back: 'Tokens are added to a bucket at a constant refill rate up to maximum capacity. Each request consumes one token; if the bucket is empty, the request is throttled or dropped.',
            requirement_ids: ['r3']
          },
          {
            id: 'f4',
            front: 'What is the STAR technique for answering behavioural interview questions?',
            back: 'Situation (set the scene), Task (describe your responsibility), Action (explain the specific steps you took), and Result (share the quantifiable outcome or learnings).',
            requirement_ids: ['r4']
          }
        ]
      };
    }

    // Default fallback
    return {};
  }
}

module.exports = new LLMService();

