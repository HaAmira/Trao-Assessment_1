const requirementExtractor = require('../backend/src/services/pipeline/requirementExtractor');

describe('Requirement Extractor Service', () => {
  const sampleJD = `
  Senior Backend Engineer at CloudScale
  We are looking for a Senior Backend Engineer to join our core team.
  Responsibilities:
  - Design, build, and deploy distributed microservices.
  - Optimize database performance and implement caching strategies.
  Requirements:
  - 5+ years of experience with Node.js and TypeScript (Must have)
  - Experience with PostgreSQL and MongoDB schema design (Must have)
  - Strong knowledge of microservice design patterns and event-driven architecture
  - Excellent communication and cross-functional leadership skills
  - Nice to have: Experience with Kubernetes, Docker, and GCP
  `;

  test('extracts role title, seniority, responsibilities, and requirements', async () => {
    const role = await requirementExtractor.extract(sampleJD, 'CloudScale');

    expect(role).toBeDefined();
    expect(typeof role.title).toBe('string');
    expect(typeof role.seniority).toBe('string');
    expect(Array.isArray(role.responsibilities)).toBe(true);
    expect(role.responsibilities.length).toBeGreaterThan(0);
    expect(Array.isArray(role.requirements)).toBe(true);
    expect(role.requirements.length).toBeGreaterThan(0);
  });

  test('classifies requirements into technical, behavioural, or domain', async () => {
    const role = await requirementExtractor.extract(sampleJD, 'CloudScale');
    const validKinds = ['technical', 'behavioural', 'domain'];

    for (const req of role.requirements) {
      expect(validKinds).toContain(req.kind);
    }
  });

  test('marks each requirement priority as must or nice', async () => {
    const role = await requirementExtractor.extract(sampleJD, 'CloudScale');
    const validPriorities = ['must', 'nice'];

    for (const req of role.requirements) {
      expect(validPriorities).toContain(req.priority);
      expect(req.id).toMatch(/^r\d+$/);
    }
  });

  test('throws error on empty job description', async () => {
    await expect(requirementExtractor.extract('')).rejects.toThrow();
  });
});

