const llmService = require('../llm/llmService');

class FlashcardGenerator {
  async generateFlashcards(requirements) {
    if (!requirements || requirements.length === 0) {
      return [];
    }

    const prompt = `
Create concise, high-yield technical and behavioural interview prep flashcards for the following requirements:
${JSON.stringify(requirements, null, 2)}

Return a JSON object with this exact structure:
{
  "flashcards": [
    {
      "id": "f1",
      "front": "Clear concept or interview question on the front",
      "back": "Concise, authoritative explanation / answer points on the back",
      "requirement_ids": ["r1"]
    }
  ]
}

Guidelines:
- Create 1-2 flashcards per requirement.
- Front must be a punchy question or concept test.
- Back must be a crisp, memorable answer.
- Ensure unique IDs: f1, f2, f3, etc.
- Return raw JSON only.
`;

    try {
      const parsed = await llmService.generateJSON(prompt);
      const rawCards = parsed.flashcards || [];
      if (!Array.isArray(rawCards) || rawCards.length === 0) {
        return this.generateFallbackFlashcards(requirements);
      }

      return rawCards.map((card, idx) => ({
        id: card.id || `f${idx + 1}`,
        front: card.front || `Core concept for ${card.requirement_ids?.[0] || 'requirement'}`,
        back: card.back || 'Key definition and practical architectural trade-offs.',
        requirement_ids: Array.isArray(card.requirement_ids) && card.requirement_ids.length > 0
          ? card.requirement_ids
          : [requirements[0].id]
      }));
    } catch (err) {
      console.warn(`[FlashcardGenerator] LLM failed: ${err.message}. Using fallback.`);
      return this.generateFallbackFlashcards(requirements);
    }
  }

  generateFallbackFlashcards(requirements) {
    return requirements.map((req, idx) => ({
      id: `f${idx + 1}`,
      front: `Key interview takeaways for: ${req.text}`,
      back: `Demonstrate mastery of ${req.kind} principles, practical project examples, and trade-off considerations.`,
      requirement_ids: [req.id]
    }));
  }
}

module.exports = new FlashcardGenerator();

