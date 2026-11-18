import React, { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, RefreshCw, Plus, Edit2, Trash2, Pin, 
  List, Play
} from 'lucide-react';

export default function FlashcardPractice({
  kitId,
  flashcards = [],
  practiceState = { completedCardIds: [], confidenceMap: {} },
  onRecordPractice,
  onUpdateFlashcard,
  onAddFlashcard,
  onDeleteFlashcard,
  onRegenerateSection
}) {
  const [viewMode, setViewMode] = useState('practice'); // 'practice' | 'list'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [prioritizeLowConfidence, setPrioritizeLowConfidence] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Form states
  const [formFront, setFormFront] = useState('');
  const [formBack, setFormBack] = useState('');

  // Confidence map
  const confidenceMap = practiceState?.confidenceMap || {};
  const completedIds = new Set(practiceState?.completedCardIds || []);

  // Ordered cards based on prioritization
  const orderedCards = useMemo(() => {
    if (!flashcards || flashcards.length === 0) return [];
    const list = [...flashcards];

    if (prioritizeLowConfidence) {
      list.sort((a, b) => {
        const confA = confidenceMap[a.id] || 'pending';
        const confB = confidenceMap[b.id] || 'pending';

        const rank = { 'low': 1, 'pending': 2, 'medium': 3, 'high': 4 };
        return (rank[confA] || 2) - (rank[confB] || 2);
      });
    }

    return list;
  }, [flashcards, prioritizeLowConfidence, confidenceMap]);

  const activeCard = orderedCards[currentIndex] || null;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleConfidence = async (level) => {
    if (!activeCard) return;
    await onRecordPractice(activeCard.id, level);
    
    // Automatically advance to next card
    setIsFlipped(false);
    if (currentIndex < orderedCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < orderedCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleTogglePin = async (card) => {
    const newState = card.state === 'pinned' ? 'generated' : 'pinned';
    await onUpdateFlashcard(card.id, { state: newState });
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    await onUpdateFlashcard(editingCard.id, {
      front: formFront,
      back: formBack
    });
    setEditingCard(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await onAddFlashcard({
      front: formFront,
      back: formBack
    });
    setIsAdding(false);
    setFormFront('');
    setFormBack('');
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await onRegenerateSection('flashcards');
    } finally {
      setRegenerating(false);
    }
  };

  const completedCount = flashcards.filter(c => completedIds.has(c.id)).length;
  const progressPercent = flashcards.length > 0 ? Math.round((completedCount / flashcards.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-slate-900">Flashcard Practice Mode</h3>
            <span className="bg-brand-50 text-brand-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              {flashcards.length} cards
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Active recall practice. Reveal answers, record confidence, and prioritize challenging topics.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle View Mode */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center space-x-1">
            <button
              onClick={() => setViewMode('practice')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center space-x-1 ${
                viewMode === 'practice' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center space-x-1 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3 h-3" />
              <span>Card List</span>
            </button>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            title="Regenerate unpinned flashcards"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin text-brand-600' : ''}`} />
            <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Prioritization Bar */}
      <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 max-w-md">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>Progress: {completedCount} of {flashcards.length} completed</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={prioritizeLowConfidence}
              onChange={(e) => {
                setPrioritizeLowConfidence(e.target.checked);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Prioritize Low Confidence</span>
          </label>
        </div>
      </div>

      {/* Interactive Mode */}
      {viewMode === 'practice' && (
        <div>
          {orderedCards.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-500">No flashcards available in this kit.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              {/* Card Header Info */}
              <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                <span className="font-semibold">
                  Card {currentIndex + 1} of {orderedCards.length}
                </span>

                <div className="flex items-center space-x-2">
                  {confidenceMap[activeCard.id] && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      confidenceMap[activeCard.id] === 'high'
                        ? 'bg-emerald-100 text-emerald-800'
                        : confidenceMap[activeCard.id] === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {confidenceMap[activeCard.id]} Confidence
                    </span>
                  )}

                  <button
                    onClick={() => handleTogglePin(activeCard)}
                    title={activeCard.state === 'pinned' ? 'Unpin' : 'Pin card'}
                    className={`p-1 rounded ${activeCard.state === 'pinned' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Pin className={`w-3.5 h-3.5 ${activeCard.state === 'pinned' ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* The Flip Card */}
              <div
                onClick={handleFlip}
                className="relative min-h-[260px] bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 hover:border-brand-300 rounded-2xl p-8 cursor-pointer shadow-sm hover:shadow-md transition-all flex flex-col justify-between select-none"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  <span>{isFlipped ? 'Answer / Explanation (Back)' : 'Question / Concept (Front)'}</span>
                  <span className="text-slate-400 flex items-center space-x-1">
                    {isFlipped ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Click card to {isFlipped ? 'hide' : 'reveal'} answer</span>
                  </span>
                </div>

                <div className="my-auto py-4">
                  <p className="text-lg md:text-xl font-semibold text-slate-900 leading-relaxed text-center">
                    {isFlipped ? activeCard.back : activeCard.front}
                  </p>
                </div>

                <div className="text-center text-xs text-slate-400 font-mono">
                  {activeCard.id} {activeCard.requirement_ids ? `• [${activeCard.requirement_ids.join(', ')}]` : ''}
                </div>
              </div>

              {/* Record Confidence Buttons */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === orderedCards.length - 1}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <span className="text-xs font-medium text-slate-500 mr-1 hidden sm:inline">Confidence:</span>
                  <button
                    onClick={() => handleConfidence('low')}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                  >
                    Low
                  </button>
                  <button
                    onClick={() => handleConfidence('medium')}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleConfidence('high')}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                  >
                    High
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List Mode */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setIsAdding(true);
                setFormFront('');
                setFormBack('');
              }}
              className="inline-flex items-center space-x-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-lg shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Flashcard</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map((card) => {
              const isPinned = card.state === 'pinned';
              const conf = confidenceMap[card.id];

              return (
                <div
                  key={card.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-400">{card.id}</span>
                        {conf && (
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            conf === 'high' ? 'bg-emerald-100 text-emerald-800' : conf === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {conf}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTogglePin(card)}
                          title={isPinned ? 'Unpin' : 'Pin card'}
                          className={`p-1 rounded ${isPinned ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCard(card);
                            setFormFront(card.front);
                            setFormBack(card.back);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFlashcard(card.id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 mb-2">
                      <span className="text-slate-400 mr-1.5 font-normal">Front:</span>
                      {card.front}
                    </p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-400 mr-1.5 font-normal">Back:</span>
                      {card.back}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Flashcard ({editingCard.id})</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Front (Prompt / Concept)</label>
                <textarea
                  rows={2}
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Back (Answer / Explanation)</label>
                <textarea
                  rows={3}
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingCard(null)}
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

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add Flashcard</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Front (Question or Concept)</label>
                <textarea
                  required
                  rows={2}
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  placeholder="e.g. Explain how event-driven architecture handles backpressure."
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Back (Explanation)</label>
                <textarea
                  required
                  rows={3}
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  placeholder="Key answer points..."
                  className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
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
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

