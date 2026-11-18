import React from 'react';
import { Award, ListChecks } from 'lucide-react';

export default function RoleBreakdownCard({ role }) {
  if (!role) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md">
            {role.seniority || 'Role Seniority'}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">
            {role.title || 'Role Title'}
          </h3>
        </div>
      </div>

      {role.responsibilities && role.responsibilities.length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <ListChecks className="w-4 h-4 text-slate-400" />
            <span>Key Responsibilities</span>
          </h4>
          <ul className="space-y-1.5">
            {role.responsibilities.map((resp, i) => (
              <li key={i} className="text-sm text-slate-700 flex items-start space-x-2">
                <span className="text-brand-500 font-bold">•</span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {role.requirements && role.requirements.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-slate-400" />
            <span>Extracted & Classified Requirements</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {role.requirements.map((req) => {
              const isMust = req.priority === 'must';
              const kindColors = {
                technical: 'bg-blue-50 text-blue-700 border-blue-200',
                behavioural: 'bg-purple-50 text-purple-700 border-purple-200',
                domain: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              };

              return (
                <div
                  key={req.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col justify-between"
                >
                  <p className="text-xs font-medium text-slate-800 leading-relaxed mb-2">
                    {req.text}
                  </p>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="font-mono text-slate-400 font-semibold">{req.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-md border font-medium capitalize ${
                        kindColors[req.kind] || kindColors.technical
                      }`}
                    >
                      {req.kind}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold ${
                        isMust
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isMust ? 'Must-have' : 'Nice-to-have'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

