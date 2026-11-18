const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
  priority: { type: String, enum: ['must', 'nice'], required: true }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  requirement_ids: [{ type: String, required: true }],
  category: { 
    type: String, 
    enum: ['technical', 'behavioural', 'system-design', 'company-fit'], 
    required: true 
  },
  prompt: { type: String, required: true },
  answer_outline: { type: String, required: true },
  difficulty: { type: Number, min: 1, max: 5, default: 2 },
  state: { type: String, enum: ['generated', 'edited', 'pinned'], default: 'generated' },
  order: { type: Number, default: 0 }
}, { _id: false });

const flashcardSchema = new mongoose.Schema({
  id: { type: String, required: true },
  front: { type: String, required: true },
  back: { type: String, required: true },
  requirement_ids: [{ type: String, required: true }],
  state: { type: String, enum: ['generated', 'edited', 'pinned'], default: 'generated' }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
  day: { type: Number, required: true },
  focus: { type: String, required: true },
  question_ids: [{ type: String, required: true }],
  minutes: { type: Number, required: true }
}, { _id: false });

const kitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    default: null
  },
  // APPENDIX A FIELDS EXACT
  source: {
    company: { type: String, default: '' },
    company_url: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    jd_chars: { type: Number, default: 0 },
    researched_at: { type: String, default: '' },
    pages_used: [{ type: String }]
  },
  company_brief: {
    summary: { type: String, default: '' },
    what_they_do: { type: String, default: '' },
    sources: [{ type: String }]
  },
  role: {
    title: { type: String, default: '' },
    seniority: { type: String, default: '' },
    responsibilities: [{ type: String }],
    requirements: [requirementSchema]
  },
  questions: [questionSchema],
  flashcards: [flashcardSchema],
  schedule: {
    days_available: { type: Number, default: 5 },
    days: [dayScheduleSchema]
  },
  coverage: {
    uncovered_requirement_ids: [{ type: String }],
    passes: { type: Number, default: 2 }
  },
  // PRACTICE INTERACTIVE STATE
  practiceState: {
    completedCardIds: [{ type: String }],
    confidenceMap: {
      type: Map,
      of: String, // 'low' | 'medium' | 'high'
      default: {}
    },
    lastPracticedAt: { type: Date }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Kit', kitSchema);

