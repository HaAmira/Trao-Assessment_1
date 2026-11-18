const llmService = require('../llm/llmService');

class CoverageChecker {
  /**
   * Deterministic coverage check in pure JavaScript
   * @param {Array} requirements - List of role requirements [{ id, text, kind, priority }]
   * @param {Array} questions - List of questions [{ id, requirement_ids, ... }]
   * @returns {Array<string>} Array of uncovered requirement IDs
   */
  calculateUncoveredRequirements(requirements = [], questions = []) {
    const coveredSet = new Set();
    
    for (const q of questions) {
      if (Array.isArray(q.requirement_ids)) {
        for (const reqId of q.requirement_ids) {
          coveredSet.add(reqId);
        }
      }
    }

    const uncovered = [];
    for (const req of requirements) {
      if (!coveredSet.has(req.id)) {
        uncovered.push(req.id);
      }
    }

    return uncovered;
  }

  /**
   * Two-pass coverage pipeline
   * Pass 1: Deterministic check
   * If uncovered requirements exist: Generate missing questions (Stage I)
   * Pass 2: Re-run deterministic check and record 2 passes
   */
  async ensureFullCoverage(requirements = [], questions = []) {
    let currentQuestions = [...questions];

    // Pass 1
    const pass1Uncovered = this.calculateUncoveredRequirements(requirements, currentQuestions);

    if (pass1Uncovered.length > 0) {
      // Stage I: Generate missing questions for uncovered requirements
      const uncoveredReqObjects = requirements.filter(r => pass1Uncovered.includes(r.id));
      const missingQuestions = await this.generateMissingQuestions(uncoveredReqObjects, currentQuestions.length);
      currentQuestions = currentQuestions.concat(missingQuestions);
    }

    // Pass 2: Deterministic verification
    const pass2Uncovered = this.calculateUncoveredRequirements(requirements, currentQuestions);

    return {
      questions: currentQuestions,
      coverage: {
        uncovered_requirement_ids: pass2Uncovered,
        passes: 2
      }
    };
  }

  async generateMissingQuestions(uncoveredRequirements, startIndex = 0) {
    if (!uncoveredRequirements || uncoveredRequirements.length === 0) {
      return [];
    }

    const prompt = `
The following job requirements currently have NO interview questions assigned:
${JSON.stringify(uncoveredRequirements, null, 2)}

Generate targeted interview questions to ensure 100% coverage.
Return a JSON object:
{
  "questions": [
    {
      "id": "q${startIndex + 1}",
      "requirement_ids": ["${uncoveredRequirements[0].id}"],
      "category": "technical", // "technical" | "behavioural" | "system-design" | "company-fit"
      "prompt": "Question text...",
      "answer_outline": "Key response points...",
      "difficulty": 3
    }
  ]
}
`;

    try {
      const parsed = await llmService.generateJSON(prompt);
      let genQuestions = parsed.questions || [];
      if (!Array.isArray(genQuestions) || genQuestions.length === 0) {
        return this.fallbackMissingQuestions(uncoveredRequirements, startIndex);
      }

      return genQuestions.map((q, i) => ({
        id: q.id || `q${startIndex + i + 1}`,
        requirement_ids: Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0
          ? q.requirement_ids
          : [uncoveredRequirements[i % uncoveredRequirements.length].id],
        category: ['technical', 'behavioural', 'system-design', 'company-fit'].includes(q.category)
          ? q.category
          : 'technical',
        prompt: q.prompt || `Explain your experience with ${uncoveredRequirements[i % uncoveredRequirements.length].text}`,
        answer_outline: q.answer_outline || 'Discuss architectural decisions and concrete examples.',
        difficulty: Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5 ? q.difficulty : 3
      }));
    } catch (err) {
      return this.fallbackMissingQuestions(uncoveredRequirements, startIndex);
    }
  }

  fallbackMissingQuestions(uncoveredRequirements, startIndex = 0) {
    return uncoveredRequirements.map((req, i) => {
      let category = req.kind === 'behavioural' ? 'behavioural' : 'technical';
      if (req.text.toLowerCase().includes('design')) category = 'system-design';

      return {
        id: `q${startIndex + i + 1}`,
        requirement_ids: [req.id],
        category,
        prompt: `In-depth evaluation question for ${req.text}: How would you implement and optimize this in production?`,
        answer_outline: `Provide architectural context, code considerations, error handling, and performance metrics for ${req.text}.`,
        difficulty: req.priority === 'must' ? 3 : 2
      };
    });
  }
}

module.exports = new CoverageChecker();

