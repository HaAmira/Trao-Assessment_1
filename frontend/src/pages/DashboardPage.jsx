import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import BatchUploadModal from '../components/BatchUploadModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Upload, Calendar, ArrowRight, Trash2, 
  Sparkles, Loader2 
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const res = await api.listKits();
      setKits(res.kits || []);
    } catch (err) {
      console.error('Failed to load kits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKit = async (e, kitId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this interview prep kit?')) return;

    try {
      await api.deleteKit(kitId);
      setKits(kits.filter(k => (k._id || k.id) !== kitId));
    } catch (err) {
      alert(err.message || 'Failed to delete kit');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-200 bg-white/10 px-3 py-1 rounded-full">
              Full-Stack AI Interview Assistant
            </span>
            <h1 className="text-3xl font-extrabold mt-2 tracking-tight">
              Hello, {user?.name || 'Engineer'}!
            </h1>
            <p className="text-brand-100 text-sm mt-1 max-w-xl">
              Research companies, master must-have interview requirements, and practice high-yield concepts with deterministic schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/new"
              className="bg-white hover:bg-slate-100 text-brand-700 text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Kit</span>
            </Link>

            <button
              onClick={() => setIsBatchOpen(true)}
              className="bg-white/15 hover:bg-white/20 text-white text-sm font-semibold px-4 py-3 rounded-2xl border border-white/20 transition flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Batch Upload</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Kits</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kits.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Requirement Coverage</span>
            <p className="text-2xl font-bold text-emerald-600 mt-1">100%</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Passes</span>
            <p className="text-2xl font-bold text-indigo-600 mt-1">2 Passes</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schedule Engine</span>
            <p className="text-2xl font-bold text-brand-600 mt-1">Deterministic JS</p>
          </div>
        </div>

        {/* Kits Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Interview Preparation Kits</h2>
          <span className="text-xs text-slate-500">{kits.length} kits generated</span>
        </div>

        {/* Kits Grid */}
        {kits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="inline-flex p-4 rounded-2xl bg-brand-50 text-brand-600 mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Interview Kits Yet</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              Paste a job description and company URL to generate your first comprehensive prep kit with questions, flashcards, and schedule.
            </p>
            <Link
              to="/new"
              className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold px-5 py-3 rounded-2xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Kit</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((kit) => {
              const kitId = kit._id || kit.id;
              const company = kit.source?.company || 'Target Company';
              const roleTitle = kit.role?.title || kit.source?.role || 'Software Engineer';
              const days = kit.schedule?.days_available || kit.schedule?.days?.length || 5;

              return (
                <Link
                  key={kitId}
                  to={`/kit/${kitId}`}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-brand-400 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                          {company}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1.5 group-hover:text-brand-600 transition leading-snug">
                          {roleTitle}
                        </h3>
                      </div>

                      <button
                        onClick={(e) => handleDeleteKit(e, kitId)}
                        title="Delete kit"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                      {kit.role?.seniority ? `${kit.role.seniority} • ` : ''}
                      {kit.source?.location || 'Remote / Unspecified'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-brand-600" />
                      <span>{days} Days Plan</span>
                    </div>

                    <div className="flex items-center space-x-1 text-brand-600 font-semibold group-hover:translate-x-1 transition">
                      <span>Open Kit</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BatchUploadModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSuccess={fetchKits}
      />
    </div>
  );
}

