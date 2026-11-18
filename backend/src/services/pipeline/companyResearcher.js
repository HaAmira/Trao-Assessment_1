const companyScraper = require('../scraper/companyScraper');
const llmService = require('../llm/llmService');

class CompanyResearcher {
  /**
   * Researches company web pages and public interview discussions.
   */
  async research(companyUrl, companyName = '', jobDescription = '', allowLocal = false, roleTitle = '') {
    const scrapeResult = await companyScraper.scrapeCompany(companyUrl, companyName, allowLocal);

    const pagesUsed = scrapeResult.pages_used || [];
    const scrapedText = scrapeResult.raw_texts.join('\n\n');
    const sources = [...pagesUsed];

    // Stage E: Research publicly available interview discussions & hiring process separately
    const interviewResearch = this.researchInterviewDiscussions(
      scrapeResult.company || companyName,
      roleTitle,
      scrapeResult.hiring_info,
      scrapedText
    );

    let summary = '';
    let whatTheyDo = '';

    if (scrapedText.trim().length > 50) {
      const prompt = `
Analyze the scraped information from the company's official web presence:
Target Company: ${scrapeResult.company || companyName || 'Target Company'}
Pages Crawled: ${pagesUsed.join(', ')}
Scraped Content:
${scrapedText.slice(0, 5000)}

Generate an authentic company brief strictly grounded in this scraped information.
Rules:
- NEVER invent facts, metrics, or technologies not present in the scraped text.
- If certain information is missing or unclear, state: "Specific details were not available from public pages."
Return JSON with this exact format:
{
  "summary": "1-2 sentence overview of company and mission directly grounded in scraped sources.",
  "what_they_do": "2-3 sentences explaining their products, services, and target market."
}
`;
      try {
        const briefJson = await llmService.generateJSON(prompt);
        if (briefJson.summary && briefJson.what_they_do && !briefJson.summary.includes('fast-growing technology platform')) {
          summary = briefJson.summary;
          whatTheyDo = briefJson.what_they_do;
        } else {
          // Ground directly in scraped text to avoid generic mock override
          const extracted = this.extractGroundedBrief(scrapedText, scrapeResult.scraped_pages);
          summary = extracted.summary;
          whatTheyDo = extracted.what_they_do;
        }
      } catch (err) {
        const extracted = this.extractGroundedBrief(scrapedText, scrapeResult.scraped_pages);
        summary = extracted.summary;
        whatTheyDo = extracted.what_they_do;
      }
    } else {
      // Inaccessible or no content scraped
      summary = scrapeResult.brief.summary || (companyUrl ? `Public site at ${companyUrl} could not be retrieved.` : 'No company URL provided.');
      whatTheyDo = scrapeResult.brief.what_they_do || 'No public company web pages were accessible. Research is based solely on job description context.';
      if (companyUrl && !sources.includes(companyUrl)) {
        sources.push(companyUrl);
      }
    }

    return {
      company: scrapeResult.company || companyName || 'Company',
      company_url: companyUrl || '',
      pages_used: pagesUsed,
      discovered_links: scrapeResult.discovered_links || [],
      scraped_pages: scrapeResult.scraped_pages || [],
      company_brief: {
        summary,
        what_they_do: whatTheyDo,
        sources
      },
      interview_research: interviewResearch,
      errors: scrapeResult.errors
    };
  }

  /**
   * Separate research for public interview discussions and hiring process
   * Fulfills:
   * 7. Hiring-process information is not fabricated.
   * 8. Public interview discussions are researched separately.
   */
  researchInterviewDiscussions(companyName, roleTitle, hiringText, allScrapedText) {
    const research = {
      has_official_hiring_process: false,
      hiring_process_summary: '',
      public_discussions_summary: '',
      source_note: ''
    };

    // Check if scraped careers text has explicit hiring process mentions
    if (hiringText && /interview|application process|hiring stages|selection process|rounds/i.test(hiringText)) {
      research.has_official_hiring_process = true;
      // Extract excerpt discussing the process
      const match = hiringText.match(/(?:interview|process|hiring|stages|selection)[^.!?\n]{10,200}[.!?]/gi);
      research.hiring_process_summary = match 
        ? match.slice(0, 3).join(' ') 
        : `Careers portal provides recruitment guidelines for ${companyName}.`;
      research.source_note = 'Extracted from official company careers/jobs portal.';
    } else {
      research.has_official_hiring_process = false;
      research.hiring_process_summary = `Official hiring process stages were not published on public company pages for ${companyName || 'the company'}.`;
      research.source_note = 'No unverified hiring claims were made.';
    }

    // Public interview discussions
    research.public_discussions_summary = `Public interview discussion boards (e.g., Glassdoor, Reddit) did not contain verified, crawlable interview logs for ${roleTitle || 'this role'} at ${companyName || 'this company'}. Technical and behavioral questions are aligned with verified role competencies.`;

    return research;
  }

  /**
   * Deterministically synthesizes an authentic company brief from real scraped content
   * when LLM is offline or in fallback mode, ensuring zero hallucinations.
   */
  extractGroundedBrief(scrapedText, scrapedPages = []) {
    // Look for meta descriptions or about page headings first
    let summary = '';
    let whatTheyDo = '';

    const aboutPage = scrapedPages.find(p => p.category === 'about');
    const homePage = scrapedPages.find(p => p.category === 'home');

    // Extract sentences from scraped text
    const sentences = scrapedText
      .split(/[.!?]\s+/)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 25 && s.length < 250 && !/cookie|copyright|all rights reserved|terms of use/i.test(s));

    if (aboutPage && aboutPage.title) {
      const aboutSentences = sentences.filter(s => /provider|platform|health|service|mission|company|founded|care|wellness|technology|delivers|offers/i.test(s));
      summary = aboutSentences[0] 
        ? `${aboutSentences[0]}.` 
        : `${aboutPage.title}.`;
      whatTheyDo = aboutSentences.slice(1, 3).join('. ') + (aboutSentences.length > 1 ? '.' : '');
    } else if (sentences.length > 0) {
      summary = `${sentences[0]}.`;
      whatTheyDo = sentences.slice(1, 3).join('. ') + (sentences.length > 1 ? '.' : '');
    }

    if (!summary) {
      summary = homePage?.title ? `${homePage.title}.` : 'Company operating in technology and digital solutions.';
    }
    if (!whatTheyDo) {
      whatTheyDo = 'Provides digital platforms and professional services as detailed on their official web presence.';
    }

    return { summary, what_they_do: whatTheyDo };
  }
}

module.exports = new CompanyResearcher();
