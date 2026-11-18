import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function StudyScheduleView({ schedule, questions = [] }) {
  if (!schedule || !Array.isArray(schedule.days)) return null;

  const questionMap = new Map(questions.map(q => [q.id, q]));
  const totalMinutes = schedule.days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-bold text-slate-900">Deterministic Study Schedule</h3>
            <span className="bg-brand-50 text-brand-700 font-semibold text-xs px-2.5 py-0.5 rounded-full">
              {schedule.days_available} Days Plan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmically optimized in JavaScript. Difficult and must-have topics scheduled early.
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>{schedule.days.length} Days</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>~{totalHours} hrs total ({totalMinutes} mins)</span>
          </div>
        </div>
      </div>

      {/* Days Grid / Timeline */}
      <div className="space-y-4">
        {schedule.days.map((dayItem) => {
          const dayQuestions = (dayItem.question_ids || [])
            .map(id => questionMap.get(id))
            .filter(Boolean);

          return (
            <div
              key={dayItem.day}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                    D{dayItem.day}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Day {dayItem.day}: {dayItem.focus}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{dayItem.minutes} minutes</span>
                </div>
              </div>

              {/* Questions assigned for this day */}
              <div className="pl-0 sm:pl-11 space-y-2">
                {dayQuestions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Self-study and review concepts.</p>
                ) : (
                  dayQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start space-x-2">
                        <span className="font-mono font-bold text-slate-400 mt-0.5">{q.id}</span>
                        <div>
                          <p className="font-medium text-slate-800 leading-snug">{q.prompt}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {q.category}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          Diff {q.difficulty}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

