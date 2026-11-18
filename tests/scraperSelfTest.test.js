const companyScraper = require('../backend/src/services/scraper/companyScraper');
const companyResearcher = require('../backend/src/services/pipeline/companyResearcher');

describe('Scraper & Company Researcher Self-Testing Suite', () => {
  test('discovers, normalizes and ranks relative and absolute links correctly', () => {
    const html = `
      <html>
        <body>
          <a href="/careers">Join Us</a>
          <a href="/about-us">About Company</a>
          <a href="/team">Leadership Team</a>
          <a href="https://external.com/careers">External</a>
        </body>
      </html>
    `;

    const ranked = companyScraper.discoverAndRankLinks('https://example.com/home', html);
    expect(ranked.length).toBeGreaterThan(0);
    
    // Careers should have highest score
    const careerLink = ranked.find(l => l.category === 'careers');
    const aboutLink = ranked.find(l => l.category === 'about');

    expect(careerLink).toBeDefined();
    expect(careerLink.url).toBe('https://example.com/careers');
    expect(careerLink.score).toBeGreaterThanOrEqual(aboutLink.score);

    // External link must be filtered out
    expect(ranked.some(l => l.url.includes('external.com'))).toBe(false);
  });

  test('safely rejects invalid and unsafe protocol URLs', async () => {
    const res1 = await companyResearcher.research('invalid-url-string', 'TestCo', 'Role', false);
    expect(res1.errors.length).toBeGreaterThan(0);
    expect(res1.errors[0]).toContain('SSRF security policy');

    const res2 = await companyResearcher.research('ftp://unsafe.org', 'TestCo', 'Role', false);
    expect(res2.errors.length).toBeGreaterThan(0);
  });

  test('handles 404 and unreachable sites without crashing', async () => {
    const res = await companyResearcher.research('https://example.com/this-route-does-not-exist-404', 'MissingCo', 'Role', true);
    expect(res).toHaveProperty('company_brief');
    expect(res.company_brief.sources).toBeDefined();
    expect(res.errors.length).toBeGreaterThan(0);
  });

  test('does not fabricate hiring process or interview discussions when missing', () => {
    const interview = companyResearcher.researchInterviewDiscussions('Acme', 'Engineer', '', '');
    expect(interview.has_official_hiring_process).toBe(false);
    expect(interview.hiring_process_summary).toContain('were not published on public company pages');
    expect(interview.source_note).toContain('No unverified hiring claims were made');
  });

  test('extracts grounded brief directly from real scraped content', () => {
    const scrapedText = 'MantraCare provides global mental and physical wellbeing services for employees across 30 countries. The platform delivers therapy, fitness coaching, and preventative healthcare solutions.';
    const brief = companyResearcher.extractGroundedBrief(scrapedText, [{ title: 'MantraCare Wellbeing', category: 'about' }]);
    
    expect(brief.summary).toContain('MantraCare');
    expect(brief.what_they_do).toContain('platform');
  });
});

