const coverageChecker = require('../backend/src/services/pipeline/coverageChecker');

describe('Coverage Checker Service', () => {
  const sampleRequirements = [
    { id: 'r1', text: 'Node.js and TypeScript', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'MongoDB and PostgreSQL', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'System design and caching', kind: 'technical', priority: 'must' },
    { id: 'r4', text: 'Communication & Leadership', kind: 'behavioural', priority: 'must' },
    { id: 'r5', text: 'Docker & Kubernetes', kind: 'domain', priority: 'nice' }
  ];

  test('correctly identifies covered and uncovered requirements', () => {
    const partialQuestions = [
      { id: 'q1', requirement_ids: ['r1'] },
      { id: 'q2', requirement_ids: ['r2'] }
    ];

    const uncovered = coverageChecker.calculateUncoveredRequirements(sampleRequirements, partialQuestions);
    expect(uncovered).toEqual(['r3', 'r4', 'r5']);
  });

  test('reports zero uncovered requirements when all requirements are covered', () => {
    const fullQuestions = [
      { id: 'q1', requirement_ids: ['r1', 'r2'] },
      { id: 'q2', requirement_ids: ['r3'] },
      { id: 'q3', requirement_ids: ['r4'] },
      { id: 'q4', requirement_ids: ['r5'] }
    ];

    const uncovered = coverageChecker.calculateUncoveredRequirements(sampleRequirements, fullQuestions);
    expect(uncovered).toEqual([]);
  });

  test('ensureFullCoverage runs 2 passes and generates missing questions', async () => {
    const partialQuestions = [
      { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'P1', answer_outline: 'A1', difficulty: 2 }
    ];

    const result = await coverageChecker.ensureFullCoverage(sampleRequirements, partialQuestions);

    expect(result.coverage.passes).toBe(2);
    expect(result.coverage.uncovered_requirement_ids.length).toBe(0);
    expect(result.questions.length).toBeGreaterThan(partialQuestions.length);

    // Verify all requirements r1..r5 are now covered
    const finalUncovered = coverageChecker.calculateUncoveredRequirements(sampleRequirements, result.questions);
    expect(finalUncovered).toEqual([]);
  });
});

