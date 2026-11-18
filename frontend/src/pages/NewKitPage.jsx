import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BatchUploadModal from '../components/BatchUploadModal';
import { api } from '../services/api';
import { 
  Sparkles, Globe, Calendar, Briefcase, MapPin, 
  ArrowRight, AlertCircle, CheckCircle2, Loader2, Upload
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'extract', label: 'Extracting role, seniority, and responsibilities' },
  { id: 'classify', label: 'Classifying requirements (technical, behavioural, domain)' },
  { id: 'prioritize', label: 'Tagging must-have vs nice-to-have priorities' },
  { id: 'crawl', label: 'Crawling and cleaning company website pages' },
  { id: 'research', label: 'Researching publicly available interview topics' },
  { id: 'questions', label: 'Generating questions across all 4 categories' },
  { id: 'flashcards', label: 'Synthesizing active recall flashcards' },
  { id: 'coverage1', label: 'Running deterministic JS coverage check (Pass 1)' },
  { id: 'pass2', label: 'Generating missing questions & verifying (Pass 2)' },
  { id: 'schedule', label: 'Calculating deterministic study schedule in JavaScript' },
];

export default function NewKitPage() {
  const navigate = useNavigate();

  // Form inputs
  const [jobDescription, setJobDescription] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [location, setLocation] = useState('');
  const [daysAvailable, setDaysAvailable] = useState(5);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [error, setError] = useState(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description.');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setCurrentStageIdx(0);

    // Simulate realistic visual progress through the 10 sequential pipeline stages
    const progressInterval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev < PIPELINE_STAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await api.createKit({
        jobDescription,
        companyUrl,
        companyName,
        location,
        daysAvailable: Number(daysAvailable) || 5,
      });

      clearInterval(progressInterval);
      setCurrentStageIdx(PIPELINE_STAGES.length - 1);

      // Brief pause to show completion before navigation
      setTimeout(() => {
        navigate(`/kit/${res.kit._id || res.kit.id}`);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setError(err.message || 'Generation failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Interview Prep Kit</h1>
            <p className="text-sm text-slate-500 mt-1">
              Enter the target job details to trigger the 10-stage research & generation pipeline.
            </p>
          </div>

          <button
            onClick={() => setIsBatchOpen(true)}
            className="inline-flex items-center space-x-2 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-xl shadow-xs transition"
          >
            <Upload className="w-4 h-4 text-brand-600" />
            <span>Batch Upload (.json)</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 rounded-2xl text-xs flex items-center space-x-2 border border-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isGenerating ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl max-w-xl mx-auto my-12 text-center">
            <div className="inline-flex p-4 rounded-2xl bg-brand-50 text-brand-600 mb-4 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Generating Personalized Prep Kit
            </h3>
            <p className="text-xs text-slate-500 mb-8">
              Running 10-stage sequential AI and deterministic processing pipeline...
            </p>

            {/* Stages List */}
            <div className="space-y-3 text-left">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isDone = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;

                return (
                  <div
                    key={stage.id}
                    className={`flex items-center space-x-3 p-2.5 rounded-xl transition ${
                      isCurrent
                        ? 'bg-brand-50 border border-brand-200 font-semibold text-brand-900'
                        : isDone
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-200 shrink-0" />
                    )}
                    <span className="text-xs">{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Description Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Job Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={9}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting text here. Include role title, responsibilities, requirements, and tech stack..."
                  className="w-full text-sm p-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition leading-relaxed font-sans"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Minimum 50 characters recommended for high accuracy.</span>
                  <span>{jobDescription.length} characters</span>
                </div>
              </div>

              {/* Company Website URL & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Company Website URL</span>
                  </label>
                  <input
                    type="url"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Crawlable site for company brief and public hiring culture.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Company Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Stripe, Airbnb, Acme"
                    className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Auto-extracted if left blank.
                  </span>
                </div>
              </div>

              {/* Days Before Interview & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Interview Preparation Days <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={daysAvailable}
                    onChange={(e) => setDaysAvailable(e.target.value)}
                    className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Exactly {daysAvailable || 0} days will be scheduled deterministically.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Location (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className="w-full text-sm px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-2xl shadow-md transition flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Interview Prep Kit</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <BatchUploadModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={() => navigate('/')}
      />
    </div>
  );
}

