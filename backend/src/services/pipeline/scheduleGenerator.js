/**
 * Deterministic Study Schedule Generator in pure JavaScript (NO LLM)
 * Strictly follows Section 3.6, Stage J, and Appendix A schema.
 */

class ScheduleGenerator {
  generateSchedule(daysAvailable = 5, questions = [], requirements = []) {
    // Validate and normalize daysAvailable (support 1 to 60 days)
    let totalDays = parseInt(daysAvailable, 10);
    if (isNaN(totalDays) || totalDays < 1) {
      totalDays = 5;
    }
    if (totalDays > 60) {
      totalDays = 60;
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      // Empty questions fallback
      const emptyDays = [];
      for (let i = 1; i <= totalDays; i++) {
        emptyDays.push({
          day: i,
          focus: `Preparation Day ${i}`,
          question_ids: [],
          minutes: 45
        });
      }
      return {
        days_available: totalDays,
        days: emptyDays
      };
    }

    // Map requirement IDs to their priority ('must' vs 'nice')
    const reqPriorityMap = new Map();
    if (Array.isArray(requirements)) {
      for (const r of requirements) {
        reqPriorityMap.set(r.id, r.priority || 'nice');
      }
    }

    // Score and prioritize questions:
    // 1. Must-have requirement connection (weight +10)
    // 2. High difficulty (difficulty 1-5, weight * 2)
    // 3. Category weight (system-design: 4, technical: 3, behavioural: 2, company-fit: 1)
    const categoryWeights = {
      'system-design': 4,
      'technical': 3,
      'behavioural': 2,
      'company-fit': 1
    };

    const scoredQuestions = questions.map(q => {
      let isMust = false;
      if (Array.isArray(q.requirement_ids)) {
        isMust = q.requirement_ids.some(rId => reqPriorityMap.get(rId) === 'must');
      }

      const diff = Number.isInteger(q.difficulty) ? q.difficulty : 2;
      const catWeight = categoryWeights[q.category] || 2;
      
      const score = (isMust ? 20 : 0) + (diff * 3) + catWeight;
      return {
        ...q,
        score,
        isMust,
        diff
      };
    });

    // Sort descending by score (difficult & must-have first)
    scoredQuestions.sort((a, b) => b.score - a.score);

    // Initialize days array
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d,
        focus: '',
        question_ids: [],
        minutes: 60
      });
    }

    // Distribute questions across the days:
    // If days >= questions count, distribute evenly and assign review to remaining
    if (totalDays >= scoredQuestions.length) {
      scoredQuestions.forEach((q, idx) => {
        days[idx].question_ids.push(q.id);
      });

      // For remaining days, schedule review sessions of the hardest questions
      for (let d = scoredQuestions.length; d < totalDays; d++) {
        const reviewIndex = (d - scoredQuestions.length) % scoredQuestions.length;
        days[d].question_ids.push(scoredQuestions[reviewIndex].id);
      }
    } else {
      // More questions than days: chunk questions into available days
      scoredQuestions.forEach((q, idx) => {
        const assignedDay = Math.floor((idx / scoredQuestions.length) * totalDays);
        const dayIndex = Math.min(assignedDay, totalDays - 1);
        days[dayIndex].question_ids.push(q.id);
      });
    }

    // Determine thematic focus and minutes for each day based on questions assigned
    const questionById = new Map(questions.map(q => [q.id, q]));

    days.forEach((dayObj, index) => {
      const dayQuestions = dayObj.question_ids.map(id => questionById.get(id)).filter(Boolean);
      
      const hasSystemDesign = dayQuestions.some(q => q.category === 'system-design');
      const hasTechnical = dayQuestions.some(q => q.category === 'technical');
      const hasBehavioural = dayQuestions.some(q => q.category === 'behavioural');
      const hasCompanyFit = dayQuestions.some(q => q.category === 'company-fit');

      if (index === 0) {
        dayObj.focus = hasSystemDesign 
          ? 'Deep Dive: Core Architecture & High-Impact Technical Must-Haves' 
          : 'Core Technical Foundations & Key Architectural Concepts';
      } else if (index === totalDays - 1) {
        dayObj.focus = totalDays === 1 
          ? 'Rapid Comprehensive Sprint: Architecture, Coding & Fit' 
          : 'Final Rehearsal: Culture Fit, Leadership & Mock Interview Practice';
      } else if (hasSystemDesign) {
        dayObj.focus = 'System Design, Scalability & Complex Problem Solving';
      } else if (hasTechnical && hasBehavioural) {
        dayObj.focus = 'Technical Mastery & Situational Leadership Scenarios';
      } else if (hasBehavioural || hasCompanyFit) {
        dayObj.focus = 'Behavioural STAR Responses, Culture Alignment & Case Studies';
      } else {
        dayObj.focus = `Preparation Focus: Module ${index + 1} Deep Dive`;
      }

      // Calculate integer minutes (e.g., 20 mins per question, min 45, max 120)
      const count = dayObj.question_ids.length;
      dayObj.minutes = Math.max(45, Math.min(120, count * 25));
    });

    return {
      days_available: totalDays,
      days
    };
  }
}

module.exports = new ScheduleGenerator();

