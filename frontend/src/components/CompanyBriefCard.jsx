import React, { useState } from 'react';
import { Building2, Globe, RefreshCw, ExternalLink } from 'lucide-react';

export default function CompanyBriefCard({ brief, source, onRegenerate }) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      await onRegenerate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {source?.company || 'Company Profile'}
            </h3>
            {source?.company_url && (
              <a
                href={source.company_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 mt-0.5"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{source.company_url}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          title="Regenerate company brief"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Researching...' : 'Regenerate'}</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Overview & Mission
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {brief?.summary || 'No summary available.'}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            What They Do
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {brief?.what_they_do || 'Details not available.'}
          </p>
        </div>

        {brief?.sources && brief.sources.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium mr-2">Verified Sources:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {brief.sources.map((src, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono"
                >
                  {src.replace(/^https?:\/\//, '').split('/')[0]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

