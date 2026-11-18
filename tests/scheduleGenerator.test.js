const scheduleGenerator = require('../backend/src/services/pipeline/scheduleGenerator');

describe('Schedule Generator Service (Deterministic JavaScript)', () => {
  const requirements = [
    { id: 'r1', text: 'Distributed systems', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'React performance', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Communication', kind: 'behavioural', priority: 'nice' }
  ];

  const questions = [
    { id: 'q1', requirement_ids: ['r1'], category: 'system-design', difficulty: 5 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', difficulty: 3 },
    { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', difficulty: 2 }
  ];

  test('creates a schedule with exactly the requested number of days', () => {
    for (const days of [1, 3, 5, 14, 30]) {
      const schedule = scheduleGenerator.generateSchedule(days, questions, requirements);
      expect(schedule.days_available).toBe(days);
      expect(schedule.days).toHaveLength(days);
      
      schedule.days.forEach((day, index) => {
        expect(day.day).toBe(index + 1);
        expect(typeof day.focus).toBe('string');
        expect(Array.isArray(day.question_ids)).toBe(true);
        expect(Number.isInteger(day.minutes)).toBe(true);
        expect(day.minutes).toBeGreaterThan(0);
      });
    }
  });

  test('prioritizes difficult and important (must-have) topics earlier', () => {
    const schedule = scheduleGenerator.generateSchedule(3, questions, requirements);
    
    // Day 1 should have q1 (system-design, difficulty 5, must-have)
    expect(schedule.days[0].question_ids).toContain('q1');
  });

  test('ensures every must-have requirement is scheduled', () => {
    const schedule = scheduleGenerator.generateSchedule(5, questions, requirements);
    const scheduledQuestionIds = new Set(schedule.days.flatMap(d => d.question_ids));

    // Must-have requirements r1 and r2 are covered by q1 and q2
    expect(scheduledQuestionIds.has('q1')).toBe(true);
    expect(scheduledQuestionIds.has('q2')).toBe(true);
  });
});

