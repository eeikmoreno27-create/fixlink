
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, UserPreferences } from './types';
// Fixed: Changed decodeBase64Audio to decodeBase64 and decodeRawPcm to decodeAudioData to match geminiService exports
import { generateExercises, speakText, decodeBase64, decodeAudioData } from './geminiService';
import Avatar3D from './components/Avatar3D';
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, Volume2, Mic, Sparkles, Wand2 } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onFinish: (performanceScore: number, failedTopics: string[]) => void;
}

const ExerciseSession: React.FC<Props> = ({ prefs, onFinish }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const ex = await generateExercises(prefs);
      setExercises(ex);
      setLoading(false);
    };
    fetch();
  }, [prefs]);

  const playTTS = async (text: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    setIsSpeaking(true);
    try {
      const base64 = await speakText(text, prefs.targetLanguage);
      if (base64) {
        // Fixed: Use decodeBase64 and decodeAudioData with required sampleRate and numChannels
        const raw = decodeBase64(base64);
        const buffer = await decodeAudioData(raw, audioCtxRef.current, 24000, 1);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error("TTS Playback Error:", e);
      setIsSpeaking(false);
    }
  };

  const handleSelection = (opt: string) => {
    if (isCorrect !== null) return;
    setSelectedAnswer(opt);
    playTTS(opt);
  };

  const handleCheck = () => {
    const current = exercises[currentIndex];
    if (selectedAnswer === current.correctAnswer) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
      setTotalErrors(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (isCorrect === false) {
      setIsCorrect(null);
      setSelectedAnswer(null);
    } else {
      if (currentIndex < exercises.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        const score = Math.max(0, 100 - (totalErrors * 10));
        // Fixed: signature changed to match App.tsx expectation
        onFinish(score, []);
      }
    }
  };

  const startVoiceCapture = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const current = exercises[currentIndex];
      setSelectedAnswer(current.correctAnswer);
      setIsCorrect(true);
      playTTS("Very well pronounced!");
    }, 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-950">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-white font-heading">Generando Lección Personalizada...</h2>
      <p className="text-slate-500 mt-2">Adaptando contenido a tu nivel: {prefs.level.toUpperCase()}</p>
    </div>
  );

  const current = exercises[currentIndex];
  const progress = ((currentIndex + (isCorrect === true ? 1 : 0)) / exercises.length) * 100;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen flex flex-col lg:flex-row gap-12 items-center">
      <div className="lg:w-1/3 w-full flex flex-col items-center">
        <div className="w-full h-[400px] relative">
          <Avatar3D isSpeaking={isSpeaking} intensity={isSpeaking ? 0.5 : 0.05} />
        </div>
        <div className="mt-4 px-6 py-3 glass rounded-2xl text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tutor Linguix</p>
          <p className="text-slate-300 text-sm">"Escucha con atención y repite"</p>
        </div>
      </div>

      <div className="lg:w-2/3 w-full space-y-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Progreso de Lección
            </span>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass rounded-[3rem] p-10 md:p-14 border-white/5 relative">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
               <span className="px-5 py-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                {current.type === 'pronunciation' ? 'Desafío de Voz' : 'Lección Interactiva'}
              </span>
              <button onClick={() => playTTS(current.question)} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-400 transition-all hover:scale-110 active:scale-95 shadow-lg">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white leading-tight tracking-tight">
              {current.question}
            </h2>
          </div>

          {current.type === 'pronunciation' ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-900/40 rounded-[2.5rem] border border-white/5 mb-8">
              <button 
                onClick={startVoiceCapture}
                disabled={isRecording}
                className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-500 border-8 ${isRecording ? 'bg-red-500 border-red-400/30 animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.4)]' : 'bg-blue-600 border-blue-500/30 hover:scale-105 shadow-2xl shadow-blue-500/20'}`}
              >
                <Mic className="w-14 h-14 text-white" />
              </button>
              <p className="mt-8 text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">
                {isRecording ? 'Escuchando tu pronunciación...' : 'Presiona para hablar'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 mb-10">
              {current.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelection(opt)}
                  className={`p-6 md:p-8 rounded-[2rem] border-2 text-left transition-all flex items-center justify-between group transform ${
                    selectedAnswer === opt 
                    ? isCorrect === null 
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.02]' 
                      : isCorrect ? 'border-green-500 bg-green-500/10 scale-[1.02]' : 'border-red-500 bg-red-500/10'
                    : 'border-white/5 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span className={`text-xl font-bold transition-colors ${selectedAnswer === opt ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{opt}</span>
                  <div className={`p-3 rounded-xl transition-all ${selectedAnswer === opt ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-600'}`}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {isCorrect !== null && (
            <div className={`p-10 rounded-[2.5rem] mb-10 border-2 animate-in slide-in-from-top-4 duration-500 ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                  {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <div>
                  <p className={`font-black uppercase tracking-[0.2em] text-xs mb-3 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                    {isCorrect ? '¡Excelente trabajo!' : 'No te rindas, ¡intenta de nuevo!'}
                  </p>
                  <p className="text-slate-300 text-lg leading-relaxed">{current.explanation}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {isCorrect === null ? (
              <button
                onClick={handleCheck}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black uppercase tracking-[0.4em] text-xs py-7 rounded-[2rem] transition-all shadow-2xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <Wand2 className="w-5 h-5" /> Comprobar Respuesta
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`w-full font-black uppercase tracking-[0.4em] text-xs py-7 rounded-[2rem] transition-all flex items-center justify-center gap-3 active:scale-95 ${isCorrect ? 'bg-white text-slate-950 shadow-2xl shadow-white/10' : 'bg-slate-800 text-white border border-slate-700'}`}
              >
                {isCorrect ? (currentIndex === exercises.length - 1 ? 'Finalizar Lección' : 'Siguiente Ejercicio') : 'Intentar de Nuevo'}
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSession;
