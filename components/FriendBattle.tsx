
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences, Exercise } from '../types';
import { generateExercises } from '../geminiService';
import { Swords, Share2, Copy, Check, Users, ShieldAlert, Trophy, Loader2, ArrowLeft, Zap, Sparkles, Wifi, Globe, Target } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onClose: () => void;
}

type BattlePhase = 'lobby' | 'matching' | 'countdown' | 'battle' | 'results';

const FriendBattle: React.FC<Props> = ({ prefs, onClose }) => {
  const [phase, setPhase] = useState<BattlePhase>('lobby');
  const [roomId, setRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [opponent, setOpponent] = useState<{ name: string, avatar: string, level: string } | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isBot, setIsBot] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room') || `ARENA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setRoomId(room);
    
    if (!params.get('room')) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', room);
      window.history.replaceState({}, '', url);
    }
  }, []);

  const startMatching = () => {
    setPhase('matching');
    // Simulación de búsqueda global profesional
    setTimeout(() => {
      setOpponent({
        name: ['Yuki_Master', 'Jean_Prof', 'Hansi_DE', 'Elena_Poliglota'][Math.floor(Math.random() * 4)],
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
        level: prefs.level
      });
      setIsBot(true);
      setPhase('countdown');
      startCountdown();
    }, 3500);
  };

  const startCountdown = () => {
    let t = 3;
    const int = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t === 0) {
        clearInterval(int);
        fetchBattleExercises();
      }
    }, 1000);
  };

  const fetchBattleExercises = async () => {
    const ex = await generateExercises(prefs);
    setExercises(ex);
    setPhase('battle');
  };

  const handleAnswer = (opt: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(opt);
    const correct = opt === exercises[currentIndex].correctAnswer;
    setIsCorrect(correct);
    if (correct) setPlayerScore(s => s + 15);

    setTimeout(() => {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        // IA Opponent Logic
        if (Math.random() > 0.4) setOpponentScore(s => s + 15);
      } else {
        setPhase('results');
      }
    }, 1200);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (phase === 'lobby') return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_70%)] opacity-40" />
      <div className="absolute top-10 left-10">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Volver al Menú
        </button>
      </div>

      <div className="max-w-xl w-full relative z-10 text-center space-y-8">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
          <Globe className="w-4 h-4" /> Servidores Globales Activos
        </div>
        
        <h1 className="text-6xl font-black font-heading italic text-white tracking-tighter uppercase">
          Arena <span className="text-red-600">Linguix</span>
        </h1>
        <p className="text-slate-400 text-lg">Demuestra tu nivel contra estudiantes de todo el mundo en duelos de tiempo real.</p>

        <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl">
          <div className="flex justify-between items-center mb-10">
            <div className="text-left">
              <img src={prefs.avatarUrl} className="w-16 h-16 rounded-2xl border-2 border-blue-500 mb-3" alt="" />
              <p className="font-bold text-white">{prefs.name}</p>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Tú (Local)</p>
            </div>
            <div className="text-4xl font-black italic text-slate-700">VS</div>
            <div className="text-right flex flex-col items-end">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-slate-700" />
              </div>
              <p className="font-bold text-slate-600">Buscando...</p>
              <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Oponente</p>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={startMatching}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-red-600/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Zap className="w-5 h-5 fill-current" /> Matchmaking Global
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
              <span className="relative bg-[#0b0f1a] px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">O invita a un amigo</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-xs font-mono text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
                {window.location.href}
              </div>
              <button 
                onClick={copyLink}
                className={`p-4 rounded-xl transition-all ${copied ? 'bg-green-600' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (phase === 'matching') return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center text-center">
      <div className="relative">
        <div className="w-48 h-48 border-4 border-red-500/20 rounded-full border-t-red-600 animate-spin" />
        <Globe className="w-16 h-16 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <h2 className="text-3xl font-black font-heading mt-10 text-white italic uppercase tracking-widest">Escaneando Red Global...</h2>
      <p className="text-slate-500 mt-2 uppercase text-[10px] font-black tracking-[0.5em]">Servidores de Linguix: Sincronizando</p>
    </div>
  );

  if (phase === 'countdown') return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center">
      <div className="flex items-center gap-10 mb-20 animate-in zoom-in duration-500">
         <div className="text-center">
            <img src={prefs.avatarUrl} className="w-32 h-32 rounded-[2.5rem] border-4 border-blue-500 shadow-2xl mb-4" alt="" />
            <p className="text-2xl font-black text-white">{prefs.name}</p>
         </div>
         <div className="text-6xl font-black italic text-red-600">VS</div>
         <div className="text-center">
            <img src={opponent?.avatar} className="w-32 h-32 rounded-[2.5rem] border-4 border-red-500 shadow-2xl mb-4" alt="" />
            <p className="text-2xl font-black text-white">{opponent?.name}</p>
         </div>
      </div>
      <h1 className="text-[120px] font-black font-heading text-white animate-ping">{countdown}</h1>
    </div>
  );

  if (phase === 'battle') {
    const current = exercises[currentIndex];
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
        {/* Battle HUD */}
        <div className="px-10 py-8 flex items-center justify-between border-b border-white/5 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <img src={prefs.avatarUrl} className="w-12 h-12 rounded-xl border-2 border-blue-500" alt="" />
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Tu Puntaje</p>
              <p className="text-3xl font-black text-white">{playerScore}</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md mx-10">
             <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 mb-2">
                <span>Ronda {currentIndex + 1} / {exercises.length}</span>
                <span className="text-white flex items-center gap-2"><Wifi className="w-3 h-3 text-green-500" /> Latencia: 42ms</span>
             </div>
             <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(playerScore / (exercises.length * 15)) * 100}%` }} />
                <div className="h-full bg-red-600 transition-all duration-500 opacity-50" style={{ width: `${(opponentScore / (exercises.length * 15)) * 100}%` }} />
             </div>
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{opponent?.name}</p>
              <p className="text-3xl font-black text-white">{opponentScore}</p>
            </div>
            <img src={opponent?.avatar} className="w-12 h-12 rounded-xl border-2 border-red-500" alt="" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="max-w-3xl w-full text-center space-y-12">
             <div className="inline-block px-6 py-2 bg-slate-800 rounded-full border border-white/10 text-slate-400 text-xs font-bold">
               {current?.type.replace('_', ' ').toUpperCase()}
             </div>
             <h2 className="text-5xl md:text-7xl font-black font-heading text-white italic tracking-tighter leading-tight">
               {current?.question}
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {current?.options?.map((opt, i) => (
                 <button
                   key={i}
                   onClick={() => handleAnswer(opt)}
                   disabled={!!selectedAnswer}
                   className={`p-8 rounded-[2rem] border-2 text-xl font-bold transition-all transform active:scale-95 text-left flex items-center justify-between group ${
                     selectedAnswer === opt 
                     ? isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                     : 'border-white/5 bg-slate-900/40 hover:border-slate-700'
                   }`}
                 >
                   {opt}
                   <div className={`w-6 h-6 rounded-full border-2 ${selectedAnswer === opt ? 'bg-white border-white' : 'border-slate-800'}`} />
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const won = playerScore >= opponentScore;
    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xl w-full glass p-16 rounded-[4rem] border-white/5 shadow-2xl relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-b opacity-10 ${won ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />
          
          <Trophy className={`w-24 h-24 mx-auto mb-8 ${won ? 'text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'text-slate-600'}`} />
          <h2 className="text-6xl font-black font-heading italic uppercase mb-4 text-white">
            {won ? '¡Victoria!' : 'Buen Juego'}
          </h2>
          <p className="text-slate-400 mb-12">Has completado el duelo contra <span className="text-white font-bold">{opponent?.name}</span>.</p>

          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-950/50 p-8 rounded-3xl border border-blue-500/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tu Score</p>
              <p className="text-5xl font-black text-blue-500">{playerScore}</p>
            </div>
            <div className="bg-slate-950/50 p-8 rounded-3xl border border-red-500/20">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rival</p>
              <p className="text-5xl font-black text-red-500">{opponentScore}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-white text-slate-950 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all shadow-2xl shadow-white/10"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FriendBattle;
