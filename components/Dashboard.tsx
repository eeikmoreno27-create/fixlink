
import React, { useMemo } from 'react';
import { UserPreferences, AppState, LANGUAGES, LearningNode } from '../types';
import { Play, Mic, Zap, Map, ChevronRight, Trophy, Star, TrendingUp, Sparkles, Layout, Globe } from 'lucide-react';
import LearningPath from './LearningPath';

interface Props {
  prefs: UserPreferences;
  onNavigate: (state: AppState) => void;
}

const Dashboard: React.FC<Props> = ({ prefs, onNavigate }) => {
  const langInfo = LANGUAGES.find(l => l.code === prefs.targetLanguage);

  const dynamicNodes = useMemo(() => {
    const current = prefs.subLevel;
    const nodes: LearningNode[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(1000, current + 5);

    for (let i = start; i <= end; i++) {
      let type: LearningNode['type'] = 'lesson';
      if (i % 10 === 0) type = 'boss';
      else if (i % 5 === 0) type = 'game';
      else if (i % 3 === 0) type = 'conversation';

      nodes.push({
        id: `lvl-${i}`,
        levelIndex: i,
        title: `Nivel ${i}`,
        type,
        status: i < current ? 'completed' : i === current ? 'available' : 'locked',
        description: `Dominio del idioma en rango ${i < 200 ? 'Iniciación' : i < 600 ? 'Productivo' : 'Maestría'}.`
      });
    }
    return nodes;
  }, [prefs.subLevel]);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-20 animate-in fade-in duration-1000">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
        <div>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping shadow-[0_0_15px_#3b82f6]" />
             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Sistema Linguix v3.0 Online</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black font-heading mb-6 tracking-tighter leading-none italic">
            Hola, <span className="gradient-text">{prefs.name.split(' ')[0]}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3 glass px-6 py-3 rounded-2xl border-white/10 bg-slate-900/40">
              <span className="text-2xl">{langInfo?.flag}</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Práctica de {langInfo?.name}</span>
            </div>
            <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-4">
              <Zap className="w-5 h-5 text-blue-400 fill-current" />
              <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Nivel {prefs.subLevel} / 1000</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          <div className="glass p-8 rounded-[3rem] flex items-center gap-5 min-w-[220px] border-white/10 bg-slate-900/40 shadow-2xl group hover:border-blue-500/30 transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">Maestría</p>
              <p className="text-3xl font-black font-heading text-white">{prefs.masteryScore}%</p>
            </div>
          </div>
          <div className="glass p-8 rounded-[3rem] flex items-center gap-5 min-w-[220px] border-white/10 bg-slate-900/40 shadow-2xl">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Star className="w-7 h-7 text-white fill-current" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1 tracking-widest">XP Total</p>
              <p className="text-3xl font-black font-heading text-white">{prefs.xp}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 order-2 lg:order-1">
          <div className="glass rounded-[4.5rem] p-12 md:p-20 border-white/5 bg-slate-950/40 overflow-hidden relative shadow-2xl border-t-4 border-t-blue-500/30">
             <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <Globe className="w-96 h-96 text-white" />
             </div>
             
             <div className="relative z-10 mb-16 flex justify-between items-center">
                <div>
                  <h2 className="text-4xl font-black font-heading text-white italic tracking-tighter uppercase mb-3">Ruta de Carrera</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60">Tu camino hacia la fluidez nativa</p>
                </div>
                <div className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center bg-slate-900/50">
                  <Layout className="w-6 h-6 text-slate-500" />
                </div>
             </div>
             
             <div className="relative z-10 py-12">
                <LearningPath 
                  nodes={dynamicNodes} 
                  onNodeClick={(node) => {
                    if (node.type === 'game') onNavigate(AppState.GAMES);
                    else if (node.type === 'conversation') onNavigate(AppState.CONVERSATION);
                    else onNavigate(AppState.EXERCISES);
                  }} 
                />
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10 order-1 lg:order-2">
          <div className="space-y-6">
             <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-700 ml-6">Módulos Premium</p>
             
             <button 
                onClick={() => onNavigate(AppState.CONVERSATION)}
                className="w-full group bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 rounded-[4rem] text-left border border-white/10 shadow-2xl transition-all hover:translate-y-[-8px] relative overflow-hidden"
              >
                <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                   <Mic className="w-48 h-48 text-white" />
                </div>
                <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center mb-10 border border-white/20 shadow-inner">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase italic leading-none">Inmersión<br/>Vocal</h3>
                <p className="text-blue-100/60 text-[12px] leading-relaxed mb-12 font-bold uppercase tracking-wider">Charla real con corrección fonética en español.</p>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 group-hover:translate-x-3 transition-transform">
                  Iniciar sesión <Play className="w-4 h-4 fill-current" />
                </div>
             </button>

             <button 
                onClick={() => onNavigate(AppState.SCENARIOS)}
                className="w-full group bg-slate-900/40 p-12 rounded-[4rem] text-left border border-white/5 hover:border-blue-500/20 transition-all shadow-xl hover:bg-slate-900/60"
              >
                <div className="w-16 h-16 rounded-[2rem] bg-slate-800 flex items-center justify-center mb-10 border border-white/5 shadow-2xl">
                  <Map className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase italic leading-none">Misiones de<br/>Campo</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed mb-12 font-bold uppercase tracking-wider">Simula aeropuertos, negocios y vida real.</p>
                <div className="text-blue-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                  Explorar Mapa <ChevronRight className="w-4 h-4" />
                </div>
             </button>
          </div>

          <div className="glass p-10 rounded-[3.5rem] border-white/5 bg-blue-600/5 text-center">
             <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
             <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider">Tu constancia es la llave del éxito internacional.</p>
             <p className="text-[12px] font-black text-white uppercase tracking-[0.6em] italic">by ERIK ZAVALA</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
