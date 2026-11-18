const llmService = require('../llm/llmService');

class RequirementExtractor {
  async extract(jobDescription, companyName = '') {
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      throw new Error('Job description is required and cannot be empty.');
    }

    const prompt = `
Analyze the following job description:
${jobDescription.slice(0, 5000)}

Extract the role details and requirements. Return a JSON object with this exact structure:
{
  "title": "Role Title",
  "seniority": "Junior / Mid / Senior / Lead",
  "responsibilities": ["bullet 1", "bullet 2"],
  "requirements": [
    {
      "id": "r1",
      "text": "Clear description of requirement",
      "kind": "technical", // Must be one of: "technical", "behavioural", "domain"
      "priority": "must"  // Must be one of: "must", "nice"
    }
  ]
}

Classification guidelines:
- "kind":
  - "technical": Programming languages, frameworks, databases, system architecture, tools.
  - "behavioural": Communication, leadership, teamwork, adaptability, conflict resolution.
  - "domain": Industry knowledge (e.g. Fintech, Healthcare, E-commerce, compliance).
- "priority":
  - "must": Core qualifications, prerequisites, mandatory experience.
  - "nice": Preferred qualifications, bonus points, nice-to-haves.
Ensure each requirement has a unique sequential ID: r1, r2, r3, etc.
Output raw JSON only.
`;

    try {
      const parsed = await llmService.generateJSON(prompt);
      return this.normalizeRoleData(parsed, jobDescription);
    } catch (err) {
      console.warn(`[RequirementExtractor] LLM extraction failed: ${err.message}. Using heuristic fallback.`);
      return this.heuristicFallback(jobDescription);
    }
  }

  normalizeRoleData(data, jd) {
    const validKinds = ['technical', 'behavioural', 'domain'];
    const validPriorities = ['must', 'nice'];

    const title = data.title && typeof data.title === 'string' ? data.title.trim() : 'Software Engineer';
    const seniority = data.seniority && typeof data.seniority === 'string' ? data.seniority.trim() : 'Mid-Level';
    
    const responsibilities = Array.isArray(data.responsibilities) && data.responsibilities.length > 0
      ? data.responsibilities.map(r => String(r).trim()).filter(Boolean)
      : ['Deliver high-quality software features and participate in agile sprints.'];

    let rawReqs = Array.isArray(data.requirements) ? data.requirements : [];
    if (rawReqs.length === 0) {
      return this.heuristicFallback(jd, title, seniority, responsibilities);
    }

    const requirements = rawReqs.map((req, index) => {
      const id = req.id && typeof req.id === 'string' ? req.id : `r${index + 1}`;
      const text = req.text && typeof req.text === 'string' ? req.text.trim() : `Requirement ${index + 1}`;
      
      let kind = req.kind && typeof req.kind === 'string' ? req.kind.toLowerCase() : 'technical';
      if (!validKinds.includes(kind)) kind = 'technical';

      let priority = req.priority && typeof req.priority === 'string' ? req.priority.toLowerCase() : 'must';
      if (!validPriorities.includes(priority)) priority = 'must';

      return { id, text, kind, priority };
    });

    return {
      title,
      seniority,
      responsibilities,
      requirements
    };
  }

  heuristicFallback(jd, title = 'Software Engineer', seniority = 'Mid-Level', responsibilities = []) {
    const lines = jd.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    const requirements = [];
    let count = 1;

    for (const line of lines) {
      const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim();
      if (cleaned.length > 15 && count <= 6) {
        const lower = cleaned.toLowerCase();
        let kind = 'technical';
        if (lower.includes('team') || lower.includes('communicat') || lower.includes('collaborat')) {
          kind = 'behavioural';
        } else if (lower.includes('domain') || lower.includes('business') || lower.includes('fintech') || lower.includes('health')) {
          kind = 'domain';
        }

        let priority = (lower.includes('preferred') || lower.includes('plus') || lower.includes('bonus')) ? 'nice' : 'must';

        requirements.push({
          id: `r${count}`,
          text: cleaned,
          kind,
          priority
        });
        count++;
      }
    }

    if (requirements.length === 0) {
      requirements.push({
        id: 'r1',
        text: 'Core software development and computer science fundamentals',
        kind: 'technical',
        priority: 'must'
      });
    }

    return {
      title,
      seniority,
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Execute software engineering initiatives and collaborate with cross-functional teams.'],
      requirements
    };
  }
}

module.exports = new RequirementExtractor();

