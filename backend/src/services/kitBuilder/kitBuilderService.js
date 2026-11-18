const questionGenerator = require('../pipeline/questionGenerator');
const flashcardGenerator = require('../pipeline/flashcardGenerator');
const companyResearcher = require('../pipeline/companyResearcher');
const coverageChecker = require('../pipeline/coverageChecker');
const scheduleGenerator = require('../pipeline/scheduleGenerator');

class KitBuilderService {
  /**
   * Update question content, category, difficulty, or pin state
   */
  updateQuestion(kit, questionId, updates) {
    const qIndex = kit.questions.findIndex(q => q.id === questionId);
    if (qIndex === -1) {
      throw new Error(`Question with id ${questionId} not found`);
    }

    const current = kit.questions[qIndex];
    const allowedFields = ['prompt', 'answer_outline', 'category', 'difficulty', 'state', 'order', 'requirement_ids'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        current[field] = updates[field];
      }
    }

    // Automatically mark as edited if text was updated and not pinned
    if (updates.prompt || updates.answer_outline || updates.category) {
      if (current.state !== 'pinned') {
        current.state = 'edited';
      }
    }

    kit.questions[qIndex] = current;

    // Recalculate schedule & coverage
    this.recalculateCoverageAndSchedule(kit);
    return kit;
  }

  /**
   * Add a new question to the kit
   */
  addQuestion(kit, questionData) {
    const nextNum = kit.questions.length + 1;
    const newQuestion = {
      id: questionData.id || `q_custom_${Date.now()}_${nextNum}`,
      requirement_ids: Array.isArray(questionData.requirement_ids) && questionData.requirement_ids.length > 0
        ? questionData.requirement_ids
        : [kit.role?.requirements?.[0]?.id || 'r1'],
      category: questionData.category || 'technical',
      prompt: questionData.prompt || 'New interview question',
      answer_outline: questionData.answer_outline || 'Outline key points here.',
      difficulty: questionData.difficulty || 2,
      state: 'edited',
      order: kit.questions.length
    };

    kit.questions.push(newQuestion);
    this.recalculateCoverageAndSchedule(kit);
    return kit;
  }

  /**
   * Delete a question from the kit
   */
  deleteQuestion(kit, questionId) {
    kit.questions = kit.questions.filter(q => q.id !== questionId);
    this.recalculateCoverageAndSchedule(kit);
    return kit;
  }

  /**
   * Reorder questions
   */
  reorderQuestions(kit, questionIdsInOrder) {
    const qMap = new Map(kit.questions.map(q => [q.id, q]));
    const reordered = [];

    questionIdsInOrder.forEach((id, index) => {
      const q = qMap.get(id);
      if (q) {
        q.order = index;
        reordered.push(q);
        qMap.delete(id);
      }
    });

    // Append any questions not in the reorder list
    for (const remaining of qMap.values()) {
      remaining.order = reordered.length;
      reordered.push(remaining);
    }

    kit.questions = reordered;
    this.recalculateCoverageAndSchedule(kit);
    return kit;
  }

  /**
   * Update flashcard content or pin state
   */
  updateFlashcard(kit, flashcardId, updates) {
    const fIndex = kit.flashcards.findIndex(f => f.id === flashcardId);
    if (fIndex === -1) {
      throw new Error(`Flashcard with id ${flashcardId} not found`);
    }

    const current = kit.flashcards[fIndex];
    if (updates.front !== undefined) current.front = updates.front;
    if (updates.back !== undefined) current.back = updates.back;
    if (updates.requirement_ids !== undefined) current.requirement_ids = updates.requirement_ids;
    if (updates.state !== undefined) {
      current.state = updates.state;
    } else if (updates.front || updates.back) {
      if (current.state !== 'pinned') current.state = 'edited';
    }

    kit.flashcards[fIndex] = current;
    return kit;
  }

  /**
   * Add a new flashcard
   */
  addFlashcard(kit, cardData) {
    const nextNum = kit.flashcards.length + 1;
    const newCard = {
      id: cardData.id || `f_custom_${Date.now()}_${nextNum}`,
      front: cardData.front || 'Question / Concept front',
      back: cardData.back || 'Answer / Explanation back',
      requirement_ids: Array.isArray(cardData.requirement_ids) && cardData.requirement_ids.length > 0
        ? cardData.requirement_ids
        : [kit.role?.requirements?.[0]?.id || 'r1'],
      state: 'edited'
    };

    kit.flashcards.push(newCard);
    return kit;
  }

  /**
   * Delete a flashcard
   */
  deleteFlashcard(kit, flashcardId) {
    kit.flashcards = kit.flashcards.filter(f => f.id !== flashcardId);
    return kit;
  }

  /**
   * Regenerate individual section preserving pinned and edited items
   */
  async regenerateSection(kit, sectionName) {
    if (sectionName === 'questions') {
      // Preserve pinned and edited questions
      const preserved = kit.questions.filter(q => q.state === 'pinned' || q.state === 'edited');
      
      // Generate fresh questions for the role
      const freshQuestions = await questionGenerator.generateQuestions(kit.role, kit.company_brief);

      // Merge: Keep preserved questions, replace/supplement generated
      const combined = [...preserved];
      for (const fq of freshQuestions) {
        // Avoid duplicate IDs
        if (!combined.some(c => c.id === fq.id)) {
          combined.push({ ...fq, state: 'generated', order: combined.length });
        }
      }

      // Check coverage and generate missing if needed
      const { questions: coveredQuestions, coverage } = await coverageChecker.ensureFullCoverage(
        kit.role.requirements,
        combined
      );

      kit.questions = coveredQuestions;
      kit.coverage = coverage;
      kit.schedule = scheduleGenerator.generateSchedule(
        kit.schedule.days_available || 5,
        kit.questions,
        kit.role.requirements
      );
    } else if (sectionName === 'flashcards') {
      // Preserve pinned and edited flashcards
      const preserved = kit.flashcards.filter(f => f.state === 'pinned' || f.state === 'edited');
      const freshCards = await flashcardGenerator.generateFlashcards(kit.role.requirements);

      const combined = [...preserved];
      for (const fc of freshCards) {
        if (!combined.some(c => c.id === fc.id)) {
          combined.push({ ...fc, state: 'generated' });
        }
      }
      kit.flashcards = combined;
    } else if (sectionName === 'company_brief') {
      const research = await companyResearcher.research(
        kit.source?.company_url || '',
        kit.source?.company || '',
        '',
        true
      );
      kit.company_brief = research.company_brief;
      kit.source.pages_used = research.pages_used;
    } else if (sectionName === 'schedule') {
      kit.schedule = scheduleGenerator.generateSchedule(
        kit.schedule.days_available || 5,
        kit.questions,
        kit.role.requirements
      );
    }

    return kit;
  }

  recalculateCoverageAndSchedule(kit) {
    const uncovered = coverageChecker.calculateUncoveredRequirements(
      kit.role?.requirements || [],
      kit.questions || []
    );

    kit.coverage = {
      uncovered_requirement_ids: uncovered,
      passes: 2
    };

    kit.schedule = scheduleGenerator.generateSchedule(
      kit.schedule?.days_available || 5,
      kit.questions || [],
      kit.role?.requirements || []
    );
  }
}

module.exports = new KitBuilderService();

