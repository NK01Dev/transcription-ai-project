import React, { useEffect, useState, useRef } from 'react';
import { AuthService } from '../services/authService';
import { ResultService } from '../services/resultService';
import { TranscriptionService, TranscriptionRecord } from '../services/transcriptionService';
import { ExamResult, User } from '../types';

interface DashboardScreenProps {
  onStartNew: () => void;
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onStartNew, onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'INTERVIEWS' | 'TRANSCRIPTIONS'>('INTERVIEWS');
  
  // Interview States
  const [results, setResults] = useState<ExamResult[]>([]);
  
  // Transcription States
  const [transcriptions, setTranscriptions] = useState<TranscriptionRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = AuthService.getCurrentUser();
        setUser(userData);
        
        // Fetch Interview Results
        let history: ExamResult[] = [];
        if (userData?.role === 'admin') {
           history = await ResultService.getAllResults();
        } else {
           history = await ResultService.getMyResults();
        }
        setResults(history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

        // Fetch Transcriptions (Mocking/API call if backend existed)
        try {
            const transList = await TranscriptionService.getAllTranscriptions();
            setTranscriptions(transList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (e) {
            console.warn("Could not fetch transcriptions - backend might be offline");
        }

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Poll for status updates on processing transcriptions
  useEffect(() => {
     if (activeTab === 'TRANSCRIPTIONS') {
         const interval = setInterval(async () => {
             const processingItems = transcriptions.filter(t => t.status === 'PROCESSING' || t.status === 'QUEUED');
             if (processingItems.length > 0) {
                 const updatedList = [...transcriptions];
                 for (const item of processingItems) {
                     try {
                         const updated = await TranscriptionService.checkStatus(item._id);
                         const index = updatedList.findIndex(t => t._id === item._id);
                         if (index !== -1) updatedList[index] = updated;
                     } catch (e) { console.error("Poll error", e); }
                 }
                 setTranscriptions(updatedList);
             }
         }, 5000); // Check every 5 seconds
         return () => clearInterval(interval);
     }
  }, [activeTab, transcriptions]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      setUploading(true);
      try {
          const newRecord = await TranscriptionService.uploadAudio(file);
          setTranscriptions(prev => [newRecord, ...prev]);
      } catch (e: any) {
          alert(`Upload failed: ${e.message}`);
      } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
         <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-white">
                {isAdmin ? 'Admin Dashboard' : `Welcome, ${user?.name}`}
              </h1>
              {isAdmin && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold uppercase rounded border border-purple-500/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-slate-400 mt-1">
              LinguistAI Platform
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            Sign Out
          </button>
        </header>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8">
            <button 
                onClick={() => setActiveTab('INTERVIEWS')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'INTERVIEWS' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                Live Interviews
            </button>
            <button 
                onClick={() => setActiveTab('TRANSCRIPTIONS')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${activeTab === 'TRANSCRIPTIONS' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
                AWS Transcriptions
            </button>
        </div>

        {activeTab === 'INTERVIEWS' && (
            <div className="animate-fade-in">
                {/* Start Interview Card */}
                {!isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="md:col-span-2 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all"></div>
                        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Real-time Assessment</h2>
                        <p className="text-indigo-200 mb-6 max-w-md relative z-10">
                        Take a live AI interview to evaluate your CEFR level, fluency, and vocabulary using Gemini Live.
                        </p>
                        <button
                        onClick={onStartNew}
                        className="relative z-10 px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                        >
                        Start New Interview
                        </button>
                    </div>
                    
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col justify-center items-center">
                        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Tests Taken</span>
                        <span className="text-5xl font-bold text-white">{results.length}</span>
                    </div>
                </div>
                )}

                {/* Results Table */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">History</h3>
                    </div>
                    {results.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                        <p>No results yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                    {isAdmin && <th className="p-4 font-medium">Student</th>}
                                    <th className="p-4 font-medium">Date</th>
                                    <th className="p-4 font-medium">Score</th>
                                    <th className="p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {results.map((result) => (
                                    <tr key={result._id} className="hover:bg-slate-700/50 transition-colors">
                                        {isAdmin && <td className="p-4">{result.user?.name}</td>}
                                        <td className="p-4 text-slate-300">
                                        {new Date(result.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                        <span className={`font-bold ${result.score >= 80 ? 'text-emerald-400' : 'text-white'}`}>{result.score}</span>
                                        </td>
                                        <td className="p-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                                            {result.status || 'COMPLETED'}
                                        </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'TRANSCRIPTIONS' && (
             <div className="animate-fade-in">
                {/* Upload Section */}
                <div className="mb-10 bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center hover:border-indigo-500/50 transition-colors">
                    <div className="w-16 h-16 bg-slate-700/50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                         </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Audio for Transcription</h3>
                    <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                        Upload MP3, WAV, or M4A files to be processed by AWS Transcribe. Large files will be processed asynchronously.
                    </p>
                    <input 
                        type="file" 
                        accept="audio/*" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="audio-upload"
                    />
                    <label 
                        htmlFor="audio-upload"
                        className={`cursor-pointer px-8 py-3 rounded-xl font-bold transition-all inline-block ${
                            uploading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                    >
                        {uploading ? 'Uploading to S3...' : 'Select Audio File'}
                    </label>
                </div>

                {/* Transcription List */}
                <div className="space-y-4">
                    {transcriptions.map(item => (
                        <div key={item._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-lg text-white mb-1">{item.fileName}</h4>
                                    <span className="text-xs text-slate-500">ID: {item._id} • {new Date(item.createdAt).toLocaleString()}</span>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center
                                    ${item.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400' : 
                                      item.status === 'PROCESSING' || item.status === 'QUEUED' ? 'bg-indigo-500/10 text-indigo-400' : 
                                      'bg-red-500/10 text-red-400'}`}>
                                    {item.status === 'PROCESSING' && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse mr-2"></div>}
                                    {item.status}
                                </div>
                            </div>
                            
                            {item.status === 'COMPLETED' && item.text && (
                                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-slate-300 text-sm leading-relaxed max-h-60 overflow-y-auto">
                                    {item.text}
                                </div>
                            )}
                            {item.status === 'FAILED' && (
                                <p className="text-red-400 text-sm">Transcription failed. Please check the audio format.</p>
                            )}
                        </div>
                    ))}
                    {transcriptions.length === 0 && (
                        <div className="text-center text-slate-500 py-8">
                            No transcriptions found. Upload a file to get started.
                        </div>
                    )}
                </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default DashboardScreen;