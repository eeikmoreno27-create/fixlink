
import React, { useState } from 'react';
import { UserPreferences, LANGUAGES, GOALS } from '../types';
import { ArrowLeft, Zap, Award, Calendar, Map, Camera, Check, Target, TrendingUp, Sparkles } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onBack: () => void;
  onLogout: () => void;
  onUpdatePrefs: (newPrefs: Partial<UserPreferences>) => void;
}

const Profile: React.FC<Props> = ({ prefs, onBack, onLogout, onUpdatePrefs }) => {
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const lang = LANGUAGES.find(l => l.code === prefs.targetLanguage);
  const goal = GOALS.find(g => g.id === prefs.goal);

  // Generar 8 avatares premium filtrados por género
  const avatarOptions = Array.from({ length: 8 }).map((_, i) => {
    const seed = prefs.gender === 'male' ? `male_pro_${i}` : `female_pro_${i}`;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
  });

  const handleAvatarSelect = (url: string) => {
    onUpdatePrefs({ avatarUrl: url });
    setIsChangingAvatar(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in duration-700">
      <div className="mb-12 flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Dashboard
        </button>
        <button onClick={onLogout} className="px-6 py-2 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
          Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <div className="glass rounded-[3.5rem] p-10 border-white/5 shadow-2xl text-center relative overflow-hidden group">
            <div className="relative inline-block mb-6">
              <img src={prefs.avatarUrl} className="w-40 h-40 rounded-[2.5rem] mx-auto border-4 border-slate-800 shadow-2xl object-cover" alt="Profile" />
              <button 
                onClick={() => setIsChangingAvatar(true)}
                className="absolute bottom-0 right-0 bg-blue-600 p-3 rounded-xl border-4 border-slate-900 text-white hover:scale-110 transition-all shadow-xl"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-3xl font-black font-heading text-white italic mb-1 tracking-tight">{prefs.name}</h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">{prefs.email}</p>
            
            <div className="flex justify-center gap-2">
              <span className="px-4 py-1.5 bg-blue-500/10 rounded-full text-[9px] font-black uppercase tracking-widest text-blue-400 border border-blue-500/20">{prefs.level}</span>
              <span className="px-4 py-1.5 bg-purple-500/10 rounded-full text-[9px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20">{lang?.name}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass p-8 rounded-[2rem] border-white/5">
              <Zap className="w-8 h-8 text-yellow-400 mb-4" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">XP Ganada</p>
              <p className="text-2xl font-black text-white">{prefs.xp}</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border-white/5">
              <Target className="w-8 h-8 text-blue-500 mb-4" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Nivel</p>
              <p className="text-2xl font-black text-white">{prefs.subLevel}</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border-white/5">
              <Award className="w-8 h-8 text-purple-500 mb-4" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Maestría</p>
              <p className="text-2xl font-black text-white">{prefs.masteryScore}%</p>
            </div>
            <div className="glass p-8 rounded-[2rem] border-white/5">
              <Calendar className="w-8 h-8 text-orange-500 mb-4" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Racha</p>
              <p className="text-2xl font-black text-white">{prefs.streak} Días</p>
            </div>
          </div>

          <div className="glass rounded-[3rem] p-10 border-white/5">
            <h3 className="text-xl font-black font-heading text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" /> Curva de Aprendizaje IA
            </h3>
            <div className="h-4 w-full bg-slate-900/50 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-1000" 
                style={{ width: `${prefs.masteryScore}%` }} 
              />
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Basado en tus últimos ejercicios, tu comprensión del {lang?.name} para {goal?.label} está progresando un 15% más rápido que el promedio.
            </p>
          </div>
        </div>
      </div>

      {isChangingAvatar && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-2xl w-full glass rounded-[3rem] p-10 border-white/10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black font-heading text-white italic tracking-tighter uppercase">Selecciona tu Avatar</h3>
              <button onClick={() => setIsChangingAvatar(false)} className="p-2 text-slate-500 hover:text-white"><ArrowLeft /></button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {avatarOptions.map((url, i) => (
                <button
                  key={i}
                  onClick={() => handleAvatarSelect(url)}
                  className={`group relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all ${
                    prefs.avatarUrl === url ? 'border-blue-500' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt={`Avatar ${i}`} />
                  {prefs.avatarUrl === url && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                       <Check className="w-8 h-8 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
