const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('Batch Evaluation & CLI Failure Handling', () => {
  const testInputPath = path.join(__dirname, 'temp_batch_test.json');
  const testOutputPath = path.join(__dirname, 'temp_batch_output.json');

  beforeAll(() => {
    // 1 valid case, 1 invalid case with empty job description (expected to fail), 1 valid case
    const cases = [
      {
        company: 'ValidCo',
        company_url: 'https://example.com',
        job_description: 'Full stack engineer needed with Node.js and React expertise.',
        days_available: 3
      },
      {
        company: 'FailingCo',
        company_url: 'https://example.com',
        job_description: '', // Empty JD will trigger error
        days_available: 5
      },
      {
        company: 'SecondValidCo',
        company_url: 'https://example.com',
        job_description: 'Backend Go engineer with distributed systems knowledge.',
        days_available: 4
      }
    ];

    fs.writeFileSync(testInputPath, JSON.stringify(cases, null, 2));
  });

  afterAll(() => {
    if (fs.existsSync(testInputPath)) fs.unlinkSync(testInputPath);
    if (fs.existsSync(testOutputPath)) fs.unlinkSync(testOutputPath);
  });

  test('CLI runs, continues through failed cases, and produces structured output', () => {
    // Run CLI command
    const cmd = `node cli/evaluate.js --input "${testInputPath}" --output "${testOutputPath}"`;
    const output = execSync(cmd, { encoding: 'utf8' });

    expect(output).toContain('Starting Batch Evaluation');
    expect(output).toContain('Batch Evaluation Complete');
    expect(fs.existsSync(testOutputPath)).toBe(true);

    const results = JSON.parse(fs.readFileSync(testOutputPath, 'utf8'));
    expect(results).toHaveLength(3);

    // First case succeeded
    expect(results[0]).toHaveProperty('source');
    expect(results[0].source.company).toBe('ValidCo');
    expect(results[0]).toHaveProperty('coverage');

    // Second case failed gracefully and recorded error without crashing
    expect(results[1]).toHaveProperty('error', true);
    expect(results[1].source.company).toBe('FailingCo');

    // Third case succeeded despite second case failing
    expect(results[2]).toHaveProperty('source');
    expect(results[2].source.company).toBe('SecondValidCo');
  });
});

