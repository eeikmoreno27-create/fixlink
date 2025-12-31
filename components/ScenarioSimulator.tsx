
import React, { useState, useEffect, useRef } from 'react';
import { UserPreferences } from '../types';
import { generateScenario, speakText, decodeBase64, decodeAudioData, getScenarioResponse } from '../geminiService';
import Avatar3D from './Avatar3D';
import { X, Send, MapPin, Target, Sparkles, Loader2, MessageCircle } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onFinish: (score: number) => void;
}

const ScenarioSimulator: React.FC<Props> = ({ prefs, onFinish }) => {
  const [scenario, setScenario] = useState<any>(null);
  const [messages, setMessages] = useState<{ role: 'model' | 'user', text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const s = await generateScenario(prefs);
        setScenario(s);
        setMessages([{ role: 'model', text: s.initialAI }]);
        setLoading(false);
      } catch (e) {
        console.error("Error cargando escenario:", e);
      }
    };
    fetch();
  }, [prefs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playResponse = async (text: string) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
      
      setIsSpeaking(true);
      const base64 = await speakText(text, prefs.targetLanguage);
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
      console.error("Audio Error:", e);
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || processing) return;
    
    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setProcessing(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userMsg }] });

      const aiText = await getScenarioResponse(history, prefs);
      if (aiText) {
        setMessages(prev => [...prev, { role: 'model', text: aiText }]);
        await playResponse(aiText);
      }
    } catch (e) {
      console.error("Communication Error:", e);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#020617] text-center">
      <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
      <h2 className="text-2xl font-bold text-white font-heading italic uppercase tracking-tighter">Cargando Simulación Inmersiva...</h2>
      <p className="text-slate-600 mt-2 font-black uppercase tracking-widest text-[10px]">by ERIK ZAVALA BRANDON DURAN</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col lg:flex-row">
      <div className="lg:w-1/2 relative bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_100%)] flex flex-col items-center justify-center p-8">
        <button onClick={() => onFinish(80)} className="absolute top-8 left-8 p-4 text-slate-500 hover:text-white transition-all uppercase text-[10px] font-black tracking-widest flex items-center gap-2">
          <X className="w-4 h-4" /> Abandonar Misión
        </button>

        <div className="w-full h-[350px] md:h-[500px] mb-8">
           <Avatar3D isSpeaking={isSpeaking} gender={prefs.gender} />
        </div>

        <div className="max-w-md w-full glass p-8 rounded-[3rem] border-white/5 bg-slate-900/40">
           <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-black font-heading text-white italic uppercase tracking-tighter">{scenario.title}</h3>
           </div>
           <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium italic">"{scenario.context}"</p>
           <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Objetivo: {scenario.goal}</span>
           </div>
           <p className="text-center mt-6 text-[9px] font-black uppercase tracking-[0.4em] text-slate-700">by ERIK ZAVALA BRANDON DURAN</p>
        </div>
      </div>

      <div className="lg:w-1/2 flex flex-col bg-slate-950 border-l border-white/5 relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
               <div className={`max-w-[85%] p-6 rounded-[2rem] shadow-xl ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-900 text-slate-200 border border-white/5 rounded-tl-none'}`}>
                  <p className="text-base md:text-lg font-medium leading-relaxed">{m.text}</p>
               </div>
             </div>
           ))}
           {processing && (
             <div className="flex justify-start">
               <div className="bg-slate-900 p-4 rounded-2xl animate-pulse flex gap-2">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animationDelay: '0.2s' }} />
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animationDelay: '0.4s' }} />
               </div>
             </div>
           )}
           <div ref={chatEndRef} />
        </div>

        <div className="p-8 bg-slate-950 border-t border-white/5">
           <div className="relative group">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu respuesta aquí..."
                className="w-full bg-slate-900 border border-white/5 rounded-[2rem] py-6 pl-8 pr-20 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-lg shadow-2xl"
              />
              <button 
                onClick={handleSend}
                disabled={!inputText.trim() || processing}
                className="absolute right-3 top-3 bottom-3 w-14 rounded-2xl bg-white text-slate-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-xl"
              >
                <Send className="w-5 h-5" />
              </button>
           </div>
           <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-800">Sistema Linguix Core • Sincronización Activa</p>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
