
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
// Fixed: Changed decodeBase64Audio to decodeBase64 and decodeRawPcm to decodeAudioData to match geminiService exports
import { generateGameContent, speakText, decodeBase64, decodeAudioData } from '../geminiService';
import { Rocket, Zap, Timer, Trophy, Loader2, RefreshCcw, Volume2 } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onFinish: (xp: number) => void;
}

const VocabularyGame: React.FC<Props> = ({ prefs, onFinish }) => {
  const [pairs, setPairs] = useState<{ word: string, translation: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'playing' | 'ended'>('playing');
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const content = await generateGameContent(prefs);
      setPairs(content);
      setupRound(content, 0);
      setLoading(false);
    };
    fetch();
  }, [prefs]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('ended');
    }
  }, [timeLeft, gameState]);

  const playTTS = async (text: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    try {
      const base64 = await speakText(text, prefs.targetLanguage);
      if (base64) {
        // Fixed: Use decodeBase64 and decodeAudioData with required sampleRate and numChannels
        const raw = decodeBase64(base64);
        const buffer = await decodeAudioData(raw, audioCtxRef.current, 24000, 1);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.start();
      }
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

  const setupRound = (allPairs: any[], index: number) => {
    if (index >= allPairs.length) {
      setGameState('ended');
      return;
    }
    const correct = allPairs[index].translation;
    const others = allPairs
      .filter((_, i) => i !== index)
      .map(p => p.translation)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    setOptions([correct, ...others].sort(() => 0.5 - Math.random()));
  };

  const handleSelect = (selected: string) => {
    const isCorrect = selected === pairs[currentIndex].translation;
    if (isCorrect) {
      setScore(s => s + 10);
      // Pronunciar la palabra original cuando el usuario acierta o selecciona
      playTTS(pairs[currentIndex].word);
    }
    
    const next = currentIndex + 1;
    setCurrentIndex(next);
    if (next < pairs.length) {
      setupRound(pairs, next);
    } else {
      setGameState('ended');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
      <h2 className="text-2xl font-bold font-heading text-white">Preparando Desafío...</h2>
    </div>
  );

  if (gameState === 'ended') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="glass p-12 rounded-[3rem] max-w-lg w-full border-blue-500/30">
        <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        <h2 className="text-4xl font-bold font-heading mb-2">¡Juego Terminado!</h2>
        <p className="text-slate-400 mb-8">Has demostrado un gran dominio del vocabulario base.</p>
        
        <div className="flex gap-4 mb-8">
           <div className="flex-1 glass bg-white/5 p-4 rounded-2xl">
             <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Puntos</p>
             <p className="text-3xl font-bold text-white">{score}</p>
           </div>
           <div className="flex-1 glass bg-white/5 p-4 rounded-2xl">
             <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">XP Ganada</p>
             <p className="text-3xl font-bold text-blue-400">+{score * 2}</p>
           </div>
        </div>

        <button 
          onClick={() => onFinish(score * 2)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
        >
          Continuar <Rocket className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-6 py-20 min-h-screen flex flex-col justify-center">
      <div className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3 px-4 py-2 glass rounded-full">
          <Timer className="w-5 h-5 text-red-400" />
          <span className="font-black text-xl tabular-nums">{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 glass rounded-full">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span className="font-black text-xl">{score}</span>
        </div>
      </div>

      <div className="glass rounded-[3rem] p-12 text-center border-white/5 shadow-2xl relative">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
          ¿Qué significa?
        </div>
        
        <h3 className="text-5xl font-bold mb-12 font-heading tracking-tight">{pairs[currentIndex]?.word}</h3>
        
        <div className="grid grid-cols-1 gap-4">
          {options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className="w-full p-6 bg-slate-900/50 hover:bg-blue-600 border border-slate-800 hover:border-blue-400 rounded-2xl text-xl font-bold transition-all transform active:scale-95 group flex items-center justify-center gap-3"
            >
              {opt}
              <Volume2 className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-center mt-8 text-slate-500 text-sm font-medium">Pregunta {currentIndex + 1} de {pairs.length}</p>
    </div>
  );
};

export default VocabularyGame;
