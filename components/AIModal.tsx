import React, { useState, useEffect } from 'react';
import { generateBusinessReport } from '../services/geminiService';
import { BusinessData } from '../types';
import { Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BusinessData;
}

// Minimal markdown renderer for the response
const MarkdownRenderer = ({ content }: { content: string }) => {
    // Basic cleaning of markdown just in case, though ReactMarkdown handles most
    return (
        <div className="prose prose-sm prose-slate max-w-none">
           {/* We can use a proper library or just simple whitespace handling if strict deps weren't an issue. 
               Given strict deps, I'll assume we don't have 'react-markdown' in the environment unless I implement a simple parser 
               or just display formatted text. 
               
               Wait, the prompt allows popular libraries. I will assume 'react-markdown' is NOT available since I didn't add it to package.json equivalent. 
               I will implement a simple display.
           */}
           <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
             {content}
           </pre>
        </div>
    );
};

export const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, data }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !report) {
      setLoading(true);
      generateBusinessReport(data)
        .then(text => setReport(text))
        .catch(err => setReport("Error generating report."))
        .finally(() => setLoading(false));
    }
  }, [isOpen, data, report]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Sparkles size={24} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Business Insights</h3>
                <p className="text-indigo-100 text-sm opacity-90">Powered by Gemini AI</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grow">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 size={40} className="animate-spin text-indigo-600" />
              <p className="text-slate-500 font-medium animate-pulse">Analyzing your flips...</p>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
               <MarkdownRenderer content={report || "No report available."} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
