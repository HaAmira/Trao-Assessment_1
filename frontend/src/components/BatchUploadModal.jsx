import React, { useState } from 'react';
import { Upload, X, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function BatchUploadModal({ isOpen, onClose, onSuccess }) {
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonInput(event.target.result);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResults(null);

    let parsedCases = [];
    try {
      parsedCases = JSON.parse(jsonInput);
      if (!Array.isArray(parsedCases)) {
        parsedCases = [parsedCases];
      }
    } catch (err) {
      setError('Invalid JSON syntax. Please verify the input file or text.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.batchUpload(parsedCases);
      setResults(res.results);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Batch upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const sampleTemplate = `[
  {
    "company": "ExampleCorp",
    "company_url": "https://example.com",
    "days_available": 5,
    "job_description": "We are looking for a Senior Software Engineer..."
  }
]`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">Batch Job Applications Upload</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {results ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-sm">Batch processing complete!</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    r.success ? 'bg-white border-slate-200' : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  <span className="font-semibold">{r.company || `Case #${i + 1}`}</span>
                  <span>{r.success ? '✓ Generated successfully' : `✗ Error: ${r.error}`}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <p className="text-xs text-slate-500">
              Upload a JSON file containing multiple job applications, or paste the JSON array below.
            </p>

            <div className="border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="batch-file-upload"
              />
              <label htmlFor="batch-file-upload" className="cursor-pointer block">
                <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                <span className="text-xs font-semibold text-brand-600">Choose .json file</span>
                <span className="text-xs text-slate-400 block">or drag & drop</span>
              </label>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">JSON Payload</label>
                <button
                  type="button"
                  onClick={() => setJsonInput(sampleTemplate)}
                  className="text-[11px] text-brand-600 hover:underline"
                >
                  Insert Sample JSON
                </button>
              </div>
              <textarea
                required
                rows={6}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder={sampleTemplate}
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-lg text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !jsonInput.trim()}
                className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Processing Batch Pipeline...' : 'Generate All Kits'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

