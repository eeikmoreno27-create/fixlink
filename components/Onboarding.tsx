
import React, { useState } from 'react';
import { UserPreferences, LANGUAGES, GOALS, Level, Gender } from '../types';
import { ChevronRight, Target, User, Zap, ChevronLeft } from 'lucide-react';

interface Props {
  onComplete: (prefs: Partial<UserPreferences>) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    nativeLanguage: 'es',
    targetLanguage: 'en',
    level: 'beginner',
    goal: 'travel',
    gender: 'male'
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => Math.max(1, s - 1));

  const handleFinish = () => {
    // Asignar avatar base profesional según género
    const baseAvatar = prefs.gender === 'male' 
      ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=male_pro_0'
      : 'https://api.dicebear.com/7.x/avataaars/svg?seed=female_pro_0';
    
    onComplete({ ...prefs, avatarUrl: baseAvatar });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-xl w-full glass rounded-[3rem] p-10 border-white/5 relative shadow-2xl">
        {step > 1 && (
          <button onClick={back} className="absolute top-8 left-8 p-2 text-slate-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Zap className="w-12 h-12 text-blue-500 mb-6" />
            <h1 className="text-4xl font-black font-heading mb-4 italic tracking-tighter">Bienvenido a <span className="text-blue-500">Linguix</span></h1>
            <p className="text-slate-400 mb-8">Antes de empezar tu viaje de 1000 niveles, necesitamos conocerte.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tu Nombre</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-6 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: Erik Zavala"
                  value={prefs.name || ''}
                  onChange={e => setPrefs({...prefs, name: e.target.value})}
                />
              </div>
              <button 
                onClick={next}
                disabled={!prefs.name}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-blue-600/20"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black font-heading mb-8 uppercase italic tracking-tighter">¿Cómo te identificas?</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {(['male', 'female'] as Gender[]).map(g => (
                <button
                  key={g}
                  onClick={() => setPrefs({...prefs, gender: g})}
                  className={`p-10 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all ${
                    prefs.gender === g ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <span className="text-4xl">{g === 'male' ? '👨' : '👩'}</span>
                  <span className="font-black text-[10px] uppercase tracking-widest">{g === 'male' ? 'Hombre' : 'Mujer'}</span>
                </button>
              ))}
            </div>
            <button onClick={next} className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl">Siguiente</button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-3xl font-black font-heading mb-4 italic tracking-tighter">¿Cuál es tu meta?</h2>
            <div className="grid grid-cols-1 gap-3 mb-8">
              {GOALS.map(g => (
                <button
                  key={g.id}
                  onClick={() => setPrefs({...prefs, goal: g.id as any})}
                  className={`p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    prefs.goal === g.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <span className="text-2xl">{g.icon}</span>
                  <span className="font-bold">{g.label}</span>
                </button>
              ))}
            </div>
            <button onClick={handleFinish} className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl shadow-blue-600/30">
              Comenzar Mi Aprendizaje
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
