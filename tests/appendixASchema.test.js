const kitPipeline = require('../backend/src/services/pipeline/kitPipeline');

describe('Appendix A JSON Schema Strict Validation', () => {
  let kit;

  beforeAll(async () => {
    kit = await kitPipeline.generateKit({
      jobDescription: 'Seeking Senior Full Stack Developer. Must have TypeScript, Node.js, and React experience. Nice to have: Docker. Behavioural: Team leadership.',
      companyUrl: 'https://example.com',
      companyName: 'Acme Corp',
      location: 'Remote',
      daysAvailable: 5,
      allowLocal: true
    });
  });

  test('validates source object schema', () => {
    expect(kit).toHaveProperty('source');
    expect(typeof kit.source.company).toBe('string');
    expect(typeof kit.source.company_url).toBe('string');
    expect(typeof kit.source.role).toBe('string');
    expect(typeof kit.source.location).toBe('string');
    expect(typeof kit.source.jd_chars).toBe('number');
    expect(typeof kit.source.researched_at).toBe('string');
    expect(Array.isArray(kit.source.pages_used)).toBe(true);
  });

  test('validates company_brief object schema', () => {
    expect(kit).toHaveProperty('company_brief');
    expect(typeof kit.company_brief.summary).toBe('string');
    expect(typeof kit.company_brief.what_they_do).toBe('string');
    expect(Array.isArray(kit.company_brief.sources)).toBe(true);
  });

  test('validates role object schema and requirement enums', () => {
    expect(kit).toHaveProperty('role');
    expect(typeof kit.role.title).toBe('string');
    expect(typeof kit.role.seniority).toBe('string');
    expect(Array.isArray(kit.role.responsibilities)).toBe(true);
    expect(Array.isArray(kit.role.requirements)).toBe(true);

    for (const req of kit.role.requirements) {
      expect(typeof req.id).toBe('string');
      expect(typeof req.text).toBe('string');
      expect(['technical', 'behavioural', 'domain']).toContain(req.kind);
      expect(['must', 'nice']).toContain(req.priority);
    }
  });

  test('validates questions array schema and category enums', () => {
    expect(Array.isArray(kit.questions)).toBe(true);
    expect(kit.questions.length).toBeGreaterThan(0);

    const validCategories = ['technical', 'behavioural', 'system-design', 'company-fit'];
    for (const q of kit.questions) {
      expect(typeof q.id).toBe('string');
      expect(Array.isArray(q.requirement_ids)).toBe(true);
      expect(q.requirement_ids.length).toBeGreaterThan(0);
      expect(validCategories).toContain(q.category);
      expect(typeof q.prompt).toBe('string');
      expect(typeof q.answer_outline).toBe('string');
      expect(Number.isInteger(q.difficulty)).toBe(true);
      expect(q.difficulty).toBeGreaterThanOrEqual(1);
      expect(q.difficulty).toBeLessThanOrEqual(5);
    }
  });

  test('validates flashcards array schema', () => {
    expect(Array.isArray(kit.flashcards)).toBe(true);
    for (const fc of kit.flashcards) {
      expect(typeof fc.id).toBe('string');
      expect(typeof fc.front).toBe('string');
      expect(typeof fc.back).toBe('string');
      expect(Array.isArray(fc.requirement_ids)).toBe(true);
    }
  });

  test('validates schedule schema and day counts', () => {
    expect(kit).toHaveProperty('schedule');
    expect(kit.schedule.days_available).toBe(5);
    expect(kit.schedule.days).toHaveLength(5);

    for (const d of kit.schedule.days) {
      expect(typeof d.day).toBe('number');
      expect(typeof d.focus).toBe('string');
      expect(Array.isArray(d.question_ids)).toBe(true);
      expect(Number.isInteger(d.minutes)).toBe(true);
      expect(d.minutes).toBeGreaterThan(0);
    }
  });

  test('validates coverage schema with 2 passes', () => {
    expect(kit).toHaveProperty('coverage');
    expect(Array.isArray(kit.coverage.uncovered_requirement_ids)).toBe(true);
    expect(kit.coverage.passes).toBe(2);
  });
});

