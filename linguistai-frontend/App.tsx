import React, { useState, useEffect } from 'react';
import { AppState, Language, Difficulty, Message } from './types';
import SetupScreen from './components/SetupScreen';
import InterviewScreen from './components/InterviewScreen';
import ResultScreen from './components/ResultScreen';
import AuthScreen from './components/AuthScreen';
import DashboardScreen from './components/DashboardScreen';
import { AuthService } from './services/authService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [config, setConfig] = useState<{ lang: Language; difficulty: Difficulty }>({ 
    lang: Language.ENGLISH,
    difficulty: Difficulty.BEGINNER
  });
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Check for existing session
    const user = AuthService.getCurrentUser();
    if (user) {
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  const handleAuthSuccess = () => {
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    AuthService.logout();
    setAppState(AppState.AUTH);
  };

  const handleStartSetup = () => {
    setAppState(AppState.SETUP);
  };

  const handleStartInterview = (lang: Language, difficulty: Difficulty) => {
    setConfig({ lang, difficulty });
    setAppState(AppState.INTERVIEW);
  };

  const handleFinishInterview = (msgs: Message[]) => {
    setMessages(msgs);
    setAppState(AppState.RESULTS);
  };

  const handleBackToDashboard = () => {
    setMessages([]);
    setAppState(AppState.DASHBOARD);
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans">
      
      {appState === AppState.AUTH && (
        <AuthScreen onSuccess={handleAuthSuccess} />
      )}

      {appState === AppState.DASHBOARD && (
        <DashboardScreen 
          onStartNew={handleStartSetup} 
          onLogout={handleLogout}
        />
      )}

      {appState === AppState.SETUP && (
        <SetupScreen 
          onStart={handleStartInterview} 
          onBack={handleBackToDashboard} 
        />
      )}
      
      {appState === AppState.INTERVIEW && (
        <InterviewScreen 
          language={config.lang} 
          difficulty={config.difficulty}
          onFinish={handleFinishInterview} 
        />
      )}

      {appState === AppState.RESULTS && (
        <ResultScreen 
          messages={messages} 
          language={config.lang} 
          onRestart={handleBackToDashboard} 
        />
      )}
    </div>
  );
};

export default App;