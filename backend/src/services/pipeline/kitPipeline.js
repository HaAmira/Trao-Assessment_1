const requirementExtractor = require('./requirementExtractor');
const companyResearcher = require('./companyResearcher');
const questionGenerator = require('./questionGenerator');
const flashcardGenerator = require('./flashcardGenerator');
const coverageChecker = require('./coverageChecker');
const scheduleGenerator = require('./scheduleGenerator');

class KitPipeline {
  /**
   * Executes the full 10-stage sequential pipeline.
   * @param {Object} options
   * @param {string} options.jobDescription - Raw JD text
   * @param {string} [options.companyUrl] - Company website
   * @param {string} [options.companyName] - Company name override
   * @param {string} [options.location] - Job location
   * @param {number} [options.daysAvailable=5] - Number of days before interview
   * @param {boolean} [options.allowLocal=false] - Whether to allow local URLs (for test/evaluation)
   * @returns {Promise<Object>} Output adhering strictly to Appendix A schema
   */
  async generateKit({
    jobDescription,
    companyUrl = '',
    companyName = '',
    location = 'Remote / Unspecified',
    daysAvailable = 5,
    allowLocal = false
  }) {
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      throw new Error('A valid job description is required to generate the interview kit.');
    }

    const jdClean = jobDescription.trim();
    const researchedAt = new Date().toISOString();

    // Stage A, B, C: Extract role, seniority, responsibilities, classify requirements (kind & priority)
    const role = await requirementExtractor.extract(jdClean, companyName);

    // Stage D, E: Crawl and clean company web pages & public interview research
    const researchResult = await companyResearcher.research(
      companyUrl,
      companyName || role.title,
      jdClean,
      allowLocal,
      role.title
    );

    // Construct source object
    const finalCompanyName = companyName || researchResult.company || 'Target Company';
    const source = {
      company: finalCompanyName,
      company_url: companyUrl || '',
      role: role.title,
      location: location || 'Remote / Unspecified',
      jd_chars: jdClean.length,
      researched_at: researchedAt,
      pages_used: researchResult.pages_used || []
    };

    // Stage F: Generate questions across categories (technical, system-design, behavioural, company-fit)
    const initialQuestions = await questionGenerator.generateQuestions(role, researchResult.company_brief);

    // Stage G: Generate flashcards
    const flashcards = await flashcardGenerator.generateFlashcards(role.requirements);

    // Stage H & I: Deterministic coverage check (Pass 1) -> generate missing (Stage I) -> Pass 2
    const { questions: coveredQuestions, coverage } = await coverageChecker.ensureFullCoverage(
      role.requirements,
      initialQuestions
    );

    // Stage J: Deterministic study schedule in JavaScript (NOT LLM)
    const schedule = scheduleGenerator.generateSchedule(
      daysAvailable,
      coveredQuestions,
      role.requirements
    );

    // Return the exact structure specified in Appendix A
    return {
      source,
      company_brief: researchResult.company_brief,
      role,
      questions: coveredQuestions,
      flashcards,
      schedule,
      coverage
    };
  }
}

module.exports = new KitPipeline();

