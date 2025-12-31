
import React, { useState, useEffect, useRef } from 'react';
import { Exercise, UserPreferences } from '../types';
import { generateExercises, speakText, decodeBase64, decodeAudioData } from '../geminiService';
import Avatar3D from './Avatar3D';
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, Volume2, Mic, Sparkles, Wand2, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onFinish: (performanceScore: number, failedTopics: string[]) => void;
  onBack: () => void;
}

const ExerciseSession: React.FC<Props> = ({ prefs, onFinish, onBack }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ex = await generateExercises(prefs);
      if (ex && ex.length > 0) {
        setExercises(ex);
      } else {
        setError("No pudimos generar los ejercicios. Revisa tu conexión o API Key.");
      }
    } catch (e) {
      setError("Error crítico al conectar con el servidor Linguix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [prefs]);

  const playTTS = async (text: string, lang?: string) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

    setIsSpeaking(true);
    try {
      const targetLang = lang || prefs.targetLanguage;
      const base64 = await speakText(text, targetLang);
      if (base64) {
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
      playTTS("¡Muy bien!", 'es');
    } else {
      setIsCorrect(false);
      setTotalErrors(prev => prev + 1);
      playTTS(current.explanation, 'es');
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
        onFinish(score, []);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] text-center">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-white font-heading uppercase italic tracking-tighter">Sincronizando Linguix...</h2>
      <p className="text-slate-500 mt-2 font-black uppercase tracking-widest text-[10px]">Cargando nivel {prefs.subLevel}</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
      <h2 className="text-3xl font-bold text-white mb-4 italic">Error de Conexión</h2>
      <p className="text-slate-400 max-w-md mb-8">{error}</p>
      <div className="flex gap-4">
        <button onClick={onBack} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <button onClick={fetchData} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Reintentar
        </button>
      </div>
    </div>
  );

  const current = exercises[currentIndex];
  const progress = ((currentIndex + (isCorrect === true ? 1 : 0)) / exercises.length) * 100;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen flex flex-col lg:flex-row gap-12 items-center">
      <div className="lg:w-1/3 w-full flex flex-col items-center">
        <div className="w-full h-[450px] relative">
          <Avatar3D isSpeaking={isSpeaking} gender={prefs.gender} />
        </div>
        <div className="mt-6 px-8 py-4 glass rounded-[2rem] text-center border-white/5 bg-slate-900/40 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Tutor Linguix</p>
          <p className="text-slate-300 text-sm italic">Analizando tu desempeño...</p>
        </div>
      </div>

      <div className="lg:w-2/3 w-full space-y-8">
        <div className="animate-in fade-in slide-in-from-right-6 duration-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-blue-500" /> Progreso del Nivel
            </span>
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_20px_#3b82f6]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass rounded-[3.5rem] p-10 md:p-14 border-white/5 relative shadow-2xl bg-slate-900/10">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
               <span className="px-6 py-2.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                {current.type === 'pronunciation' ? 'Módulo Fonético' : 'Lección Adaptativa'}
              </span>
              <button onClick={() => playTTS(current.question)} className="p-4 bg-slate-800 rounded-2xl text-slate-400 hover:text-blue-400 transition-all shadow-xl active:scale-90">
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white leading-tight tracking-tighter italic">
              {current.question}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 mb-12">
            {current.options?.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelection(opt)}
                className={`p-6 md:p-8 rounded-[2.5rem] border-2 text-left transition-all flex items-center justify-between group ${
                  selectedAnswer === opt 
                  ? isCorrect === null 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                  : 'border-white/5 bg-slate-900/50 hover:bg-slate-800'
                }`}
              >
                <span className={`text-xl font-bold ${selectedAnswer === opt ? 'text-white' : 'text-slate-400'}`}>{opt}</span>
                <Volume2 className="w-5 h-5 text-slate-600" />
              </button>
            ))}
          </div>

          {isCorrect !== null && (
            <div className={`p-8 rounded-[2.5rem] mb-12 border-2 ${isCorrect ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <div className="flex gap-6 items-start">
                {isCorrect ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <AlertCircle className="w-8 h-8 text-red-500" />}
                <p className="text-slate-200 text-lg italic">{current.explanation}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {isCorrect === null ? (
              <button
                onClick={handleCheck}
                disabled={!selectedAnswer}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black uppercase tracking-[0.4em] text-xs py-7 rounded-[2.5rem] transition-all shadow-2xl active:scale-95"
              >
                Comprobar Respuesta
              </button>
            ) : (
              <button
                onClick={handleNext}
                className={`w-full font-black uppercase tracking-[0.4em] text-xs py-7 rounded-[2.5rem] transition-all flex items-center justify-center gap-4 ${isCorrect ? 'bg-white text-slate-950 shadow-xl' : 'bg-slate-800 text-white'}`}
              >
                {isCorrect ? 'Siguiente' : 'Reintentar'}
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
