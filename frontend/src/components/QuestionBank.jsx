import React, { useState } from 'react';
import { 
  Pin, PinOff, Edit2, Trash2, Plus, 
  RefreshCw 
} from 'lucide-react';

export default function QuestionBank({
  kitId,
  questions = [],
  requirements = [],
  onUpdateQuestion,
  onAddQuestion,
  onDeleteQuestion,
  onRegenerateSection
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Form states
  const [formPrompt, setFormPrompt] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState('technical');
  const [formDifficulty, setFormDifficulty] = useState(3);
  const [formReqIds, setFormReqIds] = useState([]);

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'technical', label: 'Technical' },
    { id: 'system-design', label: 'System Design' },
    { id: 'behavioural', label: 'Behavioural' },
    { id: 'company-fit', label: 'Company Fit' },
  ];

  const filteredQuestions = activeTab === 'all' 
    ? questions 
    : questions.filter(q => q.category === activeTab);

  const startEdit = (q) => {
    setEditingQuestion(q);
    setFormPrompt(q.prompt);
    setFormAnswer(q.answer_outline);
    setFormCategory(q.category);
    setFormDifficulty(q.difficulty);
    setFormReqIds(q.requirement_ids || []);
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    await onUpdateQuestion(editingQuestion.id, {
      prompt: formPrompt,
      answer_outline: formAnswer,
      category: formCategory,
      difficulty: Number(formDifficulty),
      requirement_ids: formReqIds,
    });
    setEditingQuestion(null);
  };

  const handleTogglePin = async (q) => {
    const newState = q.state === 'pinned' ? 'generated' : 'pinned';
    await onUpdateQuestion(q.id, { state: newState });
  };

  const handleMoveCategory = async (q, newCat) => {
    await onUpdateQuestion(q.id, { category: newCat });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await onAddQuestion({
      prompt: formPrompt,
      answer_outline: formAnswer,
      category: formCategory,
      difficulty: Number(formDifficulty),
      requirement_ids: formReqIds.length > 0 ? formReqIds : [requirements[0]?.id || 'r1']
    });
    setIsAdding(false);
    setFormPrompt('');
    setFormAnswer('');
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerateSection('questions');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-slate-900">Question Bank</h3>
            <span className="bg-slate-100 text-slate-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              {questions.length} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Categorized questions with coverage tracking. Pinned and edited questions survive regeneration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsAdding(true);
              setFormPrompt('');
              setFormAnswer('');
              setFormCategory('technical');
              setFormDifficulty(3);
              setFormReqIds([requirements[0]?.id || 'r1']);
            }}
            className="inline-flex items-center space-x-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition disabled:opacity-50"
            title="Regenerate unpinned questions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-brand-600' : ''}`} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 my-5">
        {categories.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              activeTab === tab.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm text-slate-500">No questions found in this category.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isPinned = q.state === 'pinned';
            const isEdited = q.state === 'edited';

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition ${
                  isPinned 
                    ? 'border-amber-300 bg-amber-50/20' 
                    : isEdited 
                    ? 'border-indigo-200 bg-indigo-50/10' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-slate-500">{q.id}</span>
                      
                      {/* Category Badge & Move */}
                      <select
                        value={q.category}
                        onChange={(e) => handleMoveCategory(q, e.target.value)}
                        className="text-[11px] font-semibold uppercase bg-slate-100 text-slate-700 border-none rounded px-2 py-0.5 cursor-pointer focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="technical">Technical</option>
                        <option value="system-design">System Design</option>
                        <option value="behavioural">Behavioural</option>
                        <option value="company-fit">Company Fit</option>
                      </select>

                      {/* Difficulty */}
                      <span className="text-[11px] text-slate-500 font-medium">
                        Diff: <strong className="text-slate-800">{q.difficulty}/5</strong>
                      </span>

                      {/* State Badge */}
                      {isPinned && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Pin className="w-2.5 h-2.5 fill-current" />
                          <span>Pinned</span>
                        </span>
                      )}
                      {isEdited && !isPinned && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                          Edited
                        </span>
                      )}

                      {/* Linked Requirement IDs */}
                      {q.requirement_ids && q.requirement_ids.length > 0 && (
                        <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                          <span>Reqs:</span>
                          {q.requirement_ids.map(rid => (
                            <span key={rid} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px]">
                              {rid}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                      {q.prompt}
                    </h4>

                    <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700">
                      <strong className="text-slate-900 block mb-1">Answer Outline / Key Points:</strong>
                      <p className="leading-relaxed whitespace-pre-line">{q.answer_outline}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <button
                      onClick={() => handleTogglePin(q)}
                      title={isPinned ? 'Unpin question' : 'Pin question (preserves during regeneration)'}
                      className={`p-1.5 rounded-lg transition ${
                        isPinned 
                          ? 'text-amber-600 bg-amber-100 hover:bg-amber-200' 
                          : 'hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isPinned ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => startEdit(q)}
                      title="Edit question"
                      className="p-1.5 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteQuestion(q.id)}
                      title="Delete question"
                      className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Question ({editingQuestion.id})</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prompt / Question Text</label>
                <textarea
                  rows={3}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer Outline / High-Yield Points</label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="technical">Technical</option>
                    <option value="system-design">System Design</option>
                    <option value="behavioural">Behavioural</option>
                    <option value="company-fit">Company Fit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Question Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Custom Question</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  required
                  rows={3}
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="e.g. How do you design an idempotency key mechanism for payment APIs?"
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer Outline</label>
                <textarea
                  required
                  rows={3}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Key concepts to evaluate during response..."
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="technical">Technical</option>
                    <option value="system-design">System Design</option>
                    <option value="behavioural">Behavioural</option>
                    <option value="company-fit">Company Fit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty (1 - 5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value)}
                    className="w-full text-sm p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

