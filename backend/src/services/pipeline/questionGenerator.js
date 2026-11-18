const llmService = require('../llm/llmService');

class QuestionGenerator {
  async generateQuestions(role, companyBrief) {
    const requirements = role.requirements || [];
    const categories = ['technical', 'system-design', 'behavioural', 'company-fit'];
    const validCategories = ['technical', 'behavioural', 'system-design', 'company-fit'];

    const prompt = `
You are preparing an interview question bank for the role of ${role.title} (${role.seniority}).
Company Brief: ${companyBrief.summary || 'Technology firm'} ${companyBrief.what_they_do || ''}

Requirements to test:
${JSON.stringify(requirements, null, 2)}

Generate interview questions covering all requirements. You must include questions in each of these four categories:
1. "technical"
2. "system-design"
3. "behavioural"
4. "company-fit"

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "technical", // Must be one of: "technical", "behavioural", "system-design", "company-fit"
      "prompt": "Detailed interview question...",
      "answer_outline": "Key points the candidate should discuss...",
      "difficulty": 3 // Integer from 1 (entry) to 5 (expert)
    }
  ]
}

Important:
- Every question must link to at least one valid requirement ID from the list.
- Prioritize must-have requirements.
- Ensure unique IDs: q1, q2, q3, etc.
- Return raw JSON only.
`;

    try {
      const parsed = await llmService.generateJSON(prompt);
      let rawQuestions = parsed.questions || [];
      if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
        return this.generateFallbackQuestions(requirements);
      }

      return rawQuestions.map((q, idx) => {
        const id = q.id || `q${idx + 1}`;
        let category = q.category && validCategories.includes(q.category) ? q.category : 'technical';
        let difficulty = Number.isInteger(q.difficulty) && q.difficulty >= 1 && q.difficulty <= 5 ? q.difficulty : 2;
        let reqIds = Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0 
          ? q.requirement_ids 
          : (requirements[0] ? [requirements[0].id] : ['r1']);

        return {
          id,
          requirement_ids: reqIds,
          category,
          prompt: q.prompt || `Explain your experience with ${reqIds.join(', ')}.`,
          answer_outline: q.answer_outline || 'Provide specific architectural examples, tradeoffs, and key learnings.',
          difficulty
        };
      });
    } catch (err) {
      console.warn(`[QuestionGenerator] Failed to generate questions via LLM: ${err.message}. Using fallback.`);
      return this.generateFallbackQuestions(requirements);
    }
  }

  generateFallbackQuestions(requirements) {
    const questions = [];
    let qCount = 1;

    for (const req of requirements) {
      let category = 'technical';
      let difficulty = req.priority === 'must' ? 3 : 2;

      if (req.kind === 'behavioural') {
        category = 'behavioural';
      } else if (req.text.toLowerCase().includes('design') || req.text.toLowerCase().includes('architecture')) {
        category = 'system-design';
        difficulty = 4;
      } else if (req.kind === 'domain') {
        category = 'company-fit';
      }

      questions.push({
        id: `q${qCount}`,
        requirement_ids: [req.id],
        category,
        prompt: `How do you approach ${req.text} in a production environment?`,
        answer_outline: `Discuss practical implementation strategies, pitfalls to avoid, and metrics for validating success in relation to ${req.text}.`,
        difficulty
      });
      qCount++;
    }

    // Ensure all 4 categories exist if requirements count >= 4
    const existingCategories = new Set(questions.map(q => q.category));
    if (!existingCategories.has('company-fit') && requirements[0]) {
      questions.push({
        id: `q${qCount++}`,
        requirement_ids: [requirements[0].id],
        category: 'company-fit',
        prompt: 'How do your personal engineering standards align with this company’s operational speed and culture?',
        answer_outline: 'Highlight team communication, continuous improvement, and reliability standards.',
        difficulty: 2
      });
    }

    if (!existingCategories.has('system-design') && requirements[0]) {
      questions.push({
        id: `q${qCount++}`,
        requirement_ids: [requirements[0].id],
        category: 'system-design',
        prompt: 'Describe how you would design a resilient, highly available service supporting this feature set.',
        answer_outline: 'Walk through API contract, caching layer, database choice, and fault recovery.',
        difficulty: 4
      });
    }

    return questions;
  }
}

module.exports = new QuestionGenerator();

