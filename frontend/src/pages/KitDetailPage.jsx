import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CompanyBriefCard from '../components/CompanyBriefCard';
import RoleBreakdownCard from '../components/RoleBreakdownCard';
import QuestionBank from '../components/QuestionBank';
import FlashcardPractice from '../components/FlashcardPractice';
import StudyScheduleView from '../components/StudyScheduleView';
import { api } from '../services/api';
import { 
  Building2, Briefcase, HelpCircle, CreditCard, Calendar, 
  CheckCircle2, ArrowLeft, Loader2, Code, Download
} from 'lucide-react';

export default function KitDetailPage() {
  const navigate = useNavigate();
  const { id: kitId } = useParams();

  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('questions'); // 'overview' | 'questions' | 'practice' | 'schedule' | 'json'

  useEffect(() => {
    fetchKitData();
  }, [kitId]);

  const fetchKitData = async () => {
    try {
      const res = await api.getKit(kitId);
      setKit(res.kit);
    } catch (err) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // Question Handlers
  const handleUpdateQuestion = async (qId, updates) => {
    const res = await api.updateQuestion(kitId, qId, updates);
    setKit(res.kit);
  };

  const handleAddQuestion = async (questionData) => {
    const res = await api.addQuestion(kitId, questionData);
    setKit(res.kit);
  };

  const handleDeleteQuestion = async (qId) => {
    const res = await api.deleteQuestion(kitId, qId);
    setKit(res.kit);
  };

  // Flashcard Handlers
  const handleUpdateFlashcard = async (fId, updates) => {
    const res = await api.updateFlashcard(kitId, fId, updates);
    setKit(res.kit);
  };

  const handleAddFlashcard = async (cardData) => {
    const res = await api.addFlashcard(kitId, cardData);
    setKit(res.kit);
  };

  const handleDeleteFlashcard = async (fId) => {
    const res = await api.deleteFlashcard(kitId, fId);
    setKit(res.kit);
  };

  const handleRecordPractice = async (cardId, confidence) => {
    const res = await api.recordPractice(kitId, cardId, confidence);
    setKit(prev => ({ ...prev, practiceState: res.practiceState }));
  };

  // Section Regeneration Handlers
  const handleRegenerateSection = async (sectionName) => {
    const res = await api.regenerateSection(kitId, sectionName);
    setKit(res.kit);
  };

  if (loading || !kit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const uncoveredCount = kit.coverage?.uncovered_requirement_ids?.length || 0;
  const isFullyCovered = uncoveredCount === 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          {/* Coverage Status Badge */}
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1 rounded-full border ${
                isFullyCovered
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {isFullyCovered ? '100% Requirement Coverage' : `${uncoveredCount} Uncovered Requirements`}
              </span>
            </span>

            <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
              Passes: {kit.coverage?.passes || 2}
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md w-fit mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>{kit.source?.company || 'Company'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {kit.role?.title || 'Target Role'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {kit.role?.seniority ? `${kit.role.seniority} • ` : ''}
              {kit.source?.location || 'Remote'} • Researched {new Date(kit.source?.researched_at || kit.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Questions</span>
              <span className="text-lg font-bold text-slate-800">{kit.questions?.length || 0}</span>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Flashcards</span>
              <span className="text-lg font-bold text-slate-800">{kit.flashcards?.length || 0}</span>
            </div>
            <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Schedule</span>
              <span className="text-lg font-bold text-brand-600">{kit.schedule?.days_available || 5} Days</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2">
          {[
            { id: 'questions', label: 'Question Bank', icon: HelpCircle, count: kit.questions?.length },
            { id: 'practice', label: 'Flashcard Practice', icon: CreditCard, count: kit.flashcards?.length },
            { id: 'schedule', label: 'Study Schedule', icon: Calendar, count: `${kit.schedule?.days_available}d` },
            { id: 'overview', label: 'Company & Role Overview', icon: Briefcase },
            { id: 'json', label: 'Appendix A JSON', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'questions' && (
          <QuestionBank
            kitId={kitId}
            questions={kit.questions}
            requirements={kit.role?.requirements}
            onUpdateQuestion={handleUpdateQuestion}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onRegenerateSection={handleRegenerateSection}
          />
        )}

        {activeTab === 'practice' && (
          <FlashcardPractice
            kitId={kitId}
            flashcards={kit.flashcards}
            practiceState={kit.practiceState}
            onRecordPractice={handleRecordPractice}
            onUpdateFlashcard={handleUpdateFlashcard}
            onAddFlashcard={handleAddFlashcard}
            onDeleteFlashcard={handleDeleteFlashcard}
            onRegenerateSection={handleRegenerateSection}
          />
        )}

        {activeTab === 'schedule' && (
          <StudyScheduleView
            schedule={kit.schedule}
            questions={kit.questions}
          />
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompanyBriefCard
              brief={kit.company_brief}
              source={kit.source}
              onRegenerate={() => handleRegenerateSection('company_brief')}
            />
            <RoleBreakdownCard role={kit.role} />
          </div>
        )}

        {activeTab === 'json' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Appendix A Conforming JSON</h3>
                <p className="text-xs text-slate-500">Strict schema structure required by Section 4 & Appendix A.</p>
              </div>

              <button
                onClick={() => {
                  const appendixAData = {
                    source: kit.source,
                    company_brief: kit.company_brief,
                    role: kit.role,
                    questions: kit.questions?.map(q => ({
                      id: q.id,
                      requirement_ids: q.requirement_ids,
                      category: q.category,
                      prompt: q.prompt,
                      answer_outline: q.answer_outline,
                      difficulty: q.difficulty
                    })),
                    flashcards: kit.flashcards?.map(f => ({
                      id: f.id,
                      front: f.front,
                      back: f.back,
                      requirement_ids: f.requirement_ids
                    })),
                    schedule: kit.schedule,
                    coverage: kit.coverage
                  };

                  const blob = new Blob([JSON.stringify(appendixAData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `kit_${kit.source?.company || 'interview'}.json`;
                  a.click();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Appendix A JSON</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[600px] leading-relaxed">
              {JSON.stringify({
                source: kit.source,
                company_brief: kit.company_brief,
                role: kit.role,
                questions: kit.questions?.map(q => ({
                  id: q.id,
                  requirement_ids: q.requirement_ids,
                  category: q.category,
                  prompt: q.prompt,
                  answer_outline: q.answer_outline,
                  difficulty: q.difficulty
                })),
                flashcards: kit.flashcards?.map(f => ({
                  id: f.id,
                  front: f.front,
                  back: f.back,
                  requirement_ids: f.requirement_ids
                })),
                schedule: kit.schedule,
                coverage: kit.coverage
              }, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}

