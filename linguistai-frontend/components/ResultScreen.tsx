import React, { useEffect, useState, useRef } from 'react';
import { GradingResult, Message } from '../types';
import { gradeSession } from '../services/gradingService';
import { ResultService } from '../services/resultService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultScreenProps {
  messages: Message[];
  language: string;
  onRestart: () => void;
}

const ResultScreen: React.FC<ResultScreenProps> = ({ messages, language, onRestart }) => {
  const [result, setResult] = useState<GradingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const analyze = async () => {
      if (messages.length === 0) {
          const emptyResult = {
              cefrLevel: "N/A",
              score: 0,
              strengths: [],
              weaknesses: [],
              feedback: "No conversation detected."
          };
          setResult(emptyResult);
          setLoading(false);
          return;
      }

      try {
        const data = await gradeSession(messages, language);
        setResult(data);
        setLoading(false);

        // Submit to backend
        if (!submittedRef.current && data.score > 0) {
           setSaveStatus('saving');
           try {
             await ResultService.submitResult(data.score, { 
               feedback: data.feedback,
               cefrLevel: data.cefrLevel,
               strengths: data.strengths,
               weaknesses: data.weaknesses
             });
             setSaveStatus('saved');
             submittedRef.current = true;
           } catch (e) {
             console.error("Failed to save result", e);
             setSaveStatus('error');
           }
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white animate-fade-in">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-light">Analyzing your performance...</h2>
        <p className="text-slate-400 mt-2">Checking grammar, vocabulary, and fluency.</p>
      </div>
    );
  }

  if (!result) return null;

  const scoreData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-12 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Save Status Indicator */}
        {saveStatus && (
          <div className={`flex items-center justify-center p-2 rounded-lg text-sm font-medium ${
            saveStatus === 'saved' ? 'bg-emerald-500/10 text-emerald-400' :
            saveStatus === 'error' ? 'bg-red-500/10 text-red-400' :
            'bg-indigo-500/10 text-indigo-400 animate-pulse'
          }`}>
             {saveStatus === 'saved' && "✓ Result saved to dashboard"}
             {saveStatus === 'error' && "⚠ Could not save result to server"}
             {saveStatus === 'saving' && "Syncing result..."}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-xl">
          <div>
            <h2 className="text-lg text-slate-400 font-medium uppercase tracking-widest">Proficiency Level</h2>
            <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mt-2">
              {result.cefrLevel}
            </h1>
          </div>
          <div className="flex items-center mt-6 md:mt-0">
             <div className="w-32 h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                         data={scoreData}
                         innerRadius={40}
                         outerRadius={60}
                         startAngle={90}
                         endAngle={-270}
                         dataKey="value"
                      >
                         <Cell fill="#10b981" />
                         <Cell fill="#334155" />
                      </Pie>
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-2xl font-bold text-white">{result.score}</span>
                   <span className="text-[10px] text-slate-400">SCORE</span>
                </div>
             </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-emerald-400 font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Strengths
            </h3>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start text-sm text-slate-300">
                  <span className="mr-2">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
            <h3 className="text-orange-400 font-semibold mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Areas for Improvement
            </h3>
             <ul className="space-y-2">
              {result.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start text-sm text-slate-300">
                  <span className="mr-2">•</span> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-lg">
           <h3 className="text-indigo-400 font-semibold mb-4">Detailed Feedback</h3>
           <p className="text-slate-300 leading-relaxed">
             {result.feedback}
           </p>
        </div>

        <div className="text-center pt-8">
          <button 
            onClick={onRestart}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all transform hover:scale-105"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;