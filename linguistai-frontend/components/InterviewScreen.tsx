import React, { useEffect, useState, useRef } from 'react';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { Language, Difficulty, Message } from '../types';

interface InterviewScreenProps {
  language: Language;
  difficulty: Difficulty;
  onFinish: (messages: Message[]) => void;
}

const InterviewScreen: React.FC<InterviewScreenProps> = ({ language, difficulty, onFinish }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  // Use a map to track partial updates for smoother UI
  const [partialTranscript, setPartialTranscript] = useState<{user: string, model: string}>({ user: '', model: '' });
  
  const [hasStarted, setHasStarted] = useState(false);
  // Timer
  const [seconds, setSeconds] = useState(0);

  const handleTranscriptUpdate = (text: string, isUser: boolean, isFinal: boolean) => {
    if (isFinal) {
      setMessages(prev => [...prev, {
        role: isUser ? 'user' : 'model',
        text: text,
        timestamp: Date.now()
      }]);
      // Clear partial
      setPartialTranscript(prev => ({ ...prev, [isUser ? 'user' : 'model']: '' }));
    } else {
      setPartialTranscript(prev => ({ ...prev, [isUser ? 'user' : 'model']: text }));
    }
  };

  const { connect, disconnect, isConnected, isSpeaking, error } = useGeminiLive({
    language,
    difficulty,
    onTranscriptUpdate: handleTranscriptUpdate
  });

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (isConnected) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleStartInterview = () => {
    setHasStarted(true);
    connect();
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partialTranscript]);

  if (error) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
         <div className="text-red-400 text-xl mb-4 text-center px-4">⚠️ {error}</div>
         <p className="text-slate-400 mb-6 text-center max-w-md">
           Please ensure you have granted microphone permissions and are using a supported browser.
         </p>
         <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
         >
           Retry
         </button>
       </div>
     )
  }

  // Pre-start screen to capture user gesture
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6 animate-fade-in">
         <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready for your Interview?</h2>
            <p className="text-slate-400 mb-8">
              The AI examiner will now ask for access to your microphone. 
              Please speak clearly and ensure you are in a quiet environment.
            </p>
            <div className="inline-block bg-slate-700/50 rounded-lg px-4 py-2 mb-6 text-sm text-slate-300">
               Selected Level: <span className="text-indigo-400 font-semibold">{difficulty}</span>
            </div>
            <button
              onClick={handleStartInterview}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all active:scale-[0.98]"
            >
              Start Microphone & Begin
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="font-mono text-slate-400">{formatTime(seconds)}</span>
        </div>
        <div className="text-sm font-semibold text-slate-300 flex flex-col items-center">
          <span>{language} Assessment</span>
          <span className="text-[10px] text-indigo-400 uppercase tracking-wider">{difficulty}</span>
        </div>
        <button 
          onClick={() => { disconnect(); onFinish(messages); }}
          className="px-4 py-1.5 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors"
        >
          End Test
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Visualizer / Avatar Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-800 relative">
           {/* Connection Status Overlay */}
           {!isConnected && !error && (
             <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-indigo-300 font-medium">Connecting to Examiner...</p>
                </div>
             </div>
           )}

           {/* Dynamic AI Avatar - Neural Orb */}
           <div className="relative w-80 h-80 flex items-center justify-center mb-10">
              {/* Outer Glow / Aura */}
              <div className={`absolute inset-0 bg-indigo-500/30 rounded-full blur-3xl transition-all duration-700 ease-in-out ${isSpeaking ? 'scale-125 opacity-70' : 'scale-90 opacity-20'}`}></div>
              
              {/* Rotating Rings */}
              <div className="absolute inset-0 border border-indigo-500/20 rounded-full animate-[spin_12s_linear_infinite]"></div>
              <div className="absolute inset-6 border border-purple-500/20 rounded-full animate-[spin_16s_linear_infinite_reverse]"></div>

              {/* Core Morphing Blob */}
              <div className={`relative z-10 w-48 h-48 flex items-center justify-center transition-all duration-500 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full animate-blob opacity-90 shadow-2xl"></div>
                 
                 {/* Inner Content (Visualizer vs Icon) */}
                 <div className="relative z-20 flex items-center justify-center h-full w-full">
                    {isSpeaking ? (
                       // Speaking: Waveform
                       <div className="flex items-center space-x-1.5">
                          {[...Array(5)].map((_, i) => (
                             <div 
                                key={i} 
                                className="w-2 bg-white/90 rounded-full animate-sound-wave shadow-[0_0_10px_white]" 
                                style={{ 
                                  animationDelay: `${i * 0.1}s`,
                                  animationDuration: '0.6s'
                                }} 
                             />
                          ))}
                       </div>
                    ) : (
                       // Listening: Microphone Icon
                       <div className="text-white/90 animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 drop-shadow-lg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                          </svg>
                       </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="text-center max-w-lg z-10">
              <p className={`text-sm uppercase tracking-widest font-bold mb-4 transition-colors duration-300 ${isSpeaking ? 'text-indigo-400' : 'text-slate-500'}`}>
                 {isSpeaking ? "Examiner Speaking" : "Listening..."}
              </p>
              
              <div className="min-h-[6rem] flex items-center justify-center px-4">
                 <p className="text-xl md:text-3xl font-light text-slate-100 leading-relaxed text-center">
                   {isSpeaking ? partialTranscript.model : partialTranscript.user}
                   <span className="inline-block w-2 h-6 ml-1 bg-indigo-500/50 animate-pulse align-middle rounded-full"></span>
                 </p>
              </div>
           </div>
        </div>

        {/* Transcript Sidebar */}
        <div className="hidden md:flex w-96 flex-col border-l border-slate-800 bg-slate-900 shadow-2xl z-20">
           <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 sticky top-0 flex items-center">
             <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
             <h3 className="font-semibold text-slate-300 tracking-wide">Live Transcript</h3>
           </div>
           
           <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollRef}>
             {messages.map((msg, idx) => (
               <div 
                  key={idx} 
                  className={`p-5 border-b border-slate-800/80 transition-colors ${
                    msg.role === 'user' ? 'bg-slate-800/40' : 'bg-transparent'
                  }`}
               >
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-xs font-bold uppercase tracking-wider flex items-center ${
                        msg.role === 'user' ? 'text-indigo-400' : 'text-violet-400'
                     }`}>
                       {msg.role === 'user' ? (
                         <>YOU</>
                       ) : (
                         <>EXAMINER</>
                       )}
                     </span>
                     <span className="text-[10px] text-slate-600 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-light">
                    {msg.text}
                  </p>
               </div>
             ))}

             {/* Live Partials */}
             {(partialTranscript.user || partialTranscript.model) && (
               <div className={`p-5 border-b border-slate-800/80 animate-pulse ${
                 partialTranscript.user ? 'bg-slate-800/40' : 'bg-transparent'
               }`}>
                  <div className="flex items-center justify-between mb-2">
                     <span className={`text-xs font-bold uppercase tracking-wider ${
                        partialTranscript.user ? 'text-indigo-400' : 'text-violet-400'
                     }`}>
                       {partialTranscript.user ? 'YOU' : 'EXAMINER'}
                     </span>
                     <span className="text-[10px] text-slate-500 italic">
                       {partialTranscript.user ? 'Listening...' : 'Speaking...'}
                     </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-light">
                    {partialTranscript.user || partialTranscript.model}
                  </p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewScreen;