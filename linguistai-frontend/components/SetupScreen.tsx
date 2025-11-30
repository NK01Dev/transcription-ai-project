import React from 'react';
import { Language, Difficulty } from '../types';

interface SetupScreenProps {
  onStart: (lang: Language, difficulty: Difficulty) => void;
  onBack: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, onBack }) => {
  const [selectedLang, setSelectedLang] = React.useState<Language>(Language.ENGLISH);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty>(Difficulty.BEGINNER);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 p-6 animate-fade-in">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-8 relative">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </button>

        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Configure Test</h1>
          <p className="text-slate-400">Select parameters</p>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Language</label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.values(Language) as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                    selectedLang === lang
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Current Level Estimate</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.values(Difficulty) as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`p-2 rounded-lg border text-xs font-semibold transition-all ${
                    selectedDifficulty === diff
                      ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 h-4">
              {selectedDifficulty === Difficulty.BEGINNER && "Simple topics, slow pace (A1-A2)"}
              {selectedDifficulty === Difficulty.INTERMEDIATE && "Daily life & opinions, natural pace (B1-B2)"}
              {selectedDifficulty === Difficulty.ADVANCED && "Complex topics, native pace (C1-C2)"}
            </p>
          </div>

          <button
            onClick={() => onStart(selectedLang, selectedDifficulty)}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            Start Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;