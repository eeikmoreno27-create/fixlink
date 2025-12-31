
import React, { useState, useEffect, useCallback } from 'react';
import { UserPreferences, AppState, LANGUAGES } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ExerciseSession from './components/ExerciseSession';
import Conversation from './components/Conversation';
import VocabularyGame from './components/VocabularyGame';
import ScenarioSimulator from './components/ScenarioSimulator';
import Profile from './components/Profile';
import { LayoutDashboard, Mic, Map, BookOpen, User, LogOut } from 'lucide-react';

const STORAGE_KEY = 'linguix_v3_final_erik';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setUserPrefs(prefs);
        if (prefs.isLoggedIn) setAppState(AppState.DASHBOARD);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (userPrefs) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPrefs));
    }
  }, [userPrefs]);

  const handleLogin = (userData: { name: string, email: string, avatarUrl: string }) => {
    const newUser: UserPreferences = {
      id: `USR-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatarUrl: userData.avatarUrl,
      isLoggedIn: true,
      xp: 0,
      streak: 1,
      unlockedLevels: 1,
      subLevel: 1,
      masteryScore: 0,
      errorLog: [],
      targetLanguage: 'en',
      nativeLanguage: 'es',
      level: 'beginner',
      goal: 'travel',
      gender: 'male',
      lastLogin: new Date().toISOString(),
      stats: {
        wordsLearned: 0,
        hoursPracticed: 0,
        scenariosCompleted: 0,
        perfectLessons: 0
      }
    };
    setUserPrefs(newUser);
    setAppState(AppState.ONBOARDING);
  };

  const updateProgress = useCallback((xpToAdd: number, performance: number = 100) => {
    setUserPrefs(prev => {
      if (!prev) return null;
      const nextSubLevel = performance >= 80 ? Math.min(1000, prev.subLevel + 1) : prev.subLevel;
      return {
        ...prev,
        xp: prev.xp + xpToAdd,
        masteryScore: Math.round((prev.masteryScore * 0.7) + (performance * 0.3)),
        subLevel: nextSubLevel,
      };
    });
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUserPrefs(null);
    setAppState(AppState.AUTH);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent animate-spin rounded-full mb-6" />
      <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Iniciando Linguix...</p>
    </div>
  );

  const renderContent = () => {
    if (!userPrefs && appState !== AppState.AUTH) return <Login onLogin={handleLogin} />;

    switch (appState) {
      case AppState.AUTH: return <Login onLogin={handleLogin} />;
      case AppState.ONBOARDING: return <Onboarding onComplete={(p) => { setUserPrefs(v => v ? {...v, ...p} : null); setAppState(AppState.DASHBOARD); }} />;
      case AppState.DASHBOARD: return <Dashboard prefs={userPrefs!} onNavigate={setAppState} />;
      case AppState.EXERCISES: return <ExerciseSession prefs={userPrefs!} onFinish={(s) => { updateProgress(500, s); setAppState(AppState.DASHBOARD); }} onBack={() => setAppState(AppState.DASHBOARD)} />;
      case AppState.CONVERSATION: return <Conversation prefs={userPrefs!} onClose={() => setAppState(AppState.DASHBOARD)} />;
      case AppState.SCENARIOS: return <ScenarioSimulator prefs={userPrefs!} onFinish={(s) => { updateProgress(1000, s); setAppState(AppState.DASHBOARD); }} />;
      case AppState.GAMES: return <VocabularyGame prefs={userPrefs!} onFinish={(xp) => { updateProgress(xp, 100); setAppState(AppState.DASHBOARD); }} />;
      case AppState.PROFILE: return <Profile prefs={userPrefs!} onBack={() => setAppState(AppState.DASHBOARD)} onLogout={logout} onUpdatePrefs={p => setUserPrefs(v => v ? {...v, ...p} : null)} />;
      default: return <Dashboard prefs={userPrefs!} onNavigate={setAppState} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans">
      {appState !== AppState.AUTH && appState !== AppState.ONBOARDING && (
        <nav className="border-b border-white/5 bg-slate-950/90 backdrop-blur-3xl sticky top-0 z-[100] px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setAppState(AppState.DASHBOARD)}>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black font-heading italic tracking-tighter uppercase">Linguix</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-3 bg-slate-900/40 p-1 rounded-2xl border border-white/5">
                {[
                  { id: AppState.DASHBOARD, label: 'Inicio', icon: LayoutDashboard },
                  { id: AppState.EXERCISES, label: 'Niveles', icon: BookOpen },
                  { id: AppState.CONVERSATION, label: 'Voz', icon: Mic },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setAppState(item.id)}
                    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      appState === item.id ? 'bg-white text-slate-950' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
              
              <div onClick={() => setAppState(AppState.PROFILE)} className="flex items-center gap-4 glass px-4 py-2 rounded-2xl border-white/10 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black uppercase text-white">{userPrefs?.name.split(' ')[0]}</p>
                  <p className="text-[8px] text-blue-500 font-bold uppercase tracking-widest">Nivel {userPrefs?.subLevel}</p>
                </div>
                <img src={userPrefs?.avatarUrl} className="w-9 h-9 rounded-xl border border-blue-500/30 group-hover:scale-105 transition-transform" alt="Avatar" />
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="w-full relative">{renderContent()}</main>
    </div>
  );
};

export default App;
