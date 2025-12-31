
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserPreferences, LANGUAGES } from '../types';
import { getGeminiLiveSession, encodeBase64, decodeBase64, decodeAudioData } from '../geminiService';
import Avatar3D from './Avatar3D';
import { Mic, X, ShieldCheck, Sparkles, MessageSquare, Waves } from 'lucide-react';

interface Props {
  prefs: UserPreferences;
  onClose: () => void;
}

const Conversation: React.FC<Props> = ({ prefs, onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [lastTranscription, setLastTranscription] = useState('');
  const [userTranscription, setUserTranscription] = useState('');
  const [status, setStatus] = useState('Iniciando Motor Linguix...');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = useCallback(async () => {
    try {
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = getGeminiLiveSession(prefs, {
        onopen: () => {
          setStatus('Tutor Linguix Online. Puedes hablar.');
          setIsActive(true);
          
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmBlob = {
              data: encodeBase64(new Uint8Array(int16.buffer)),
              mimeType: 'audio/pcm;rate=16000',
            };
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (message: any) => {
          const audioPart = message.serverContent?.modelTurn?.parts?.[0];
          if (audioPart?.inlineData?.data) {
            setIsSpeaking(true);
            const ctx = audioContextRef.current!;
            if (ctx.state === 'suspended') await ctx.resume();
            
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decodeBase64(audioPart.inlineData.data), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            
            source.onended = () => {
              sourcesRef.current.delete(source);
              if (sourcesRef.current.size === 0) setIsSpeaking(false);
            };
            
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }
          
          if (message.serverContent?.outputTranscription) {
             setLastTranscription(prev => prev + message.serverContent.outputTranscription.text);
          } else if (message.serverContent?.inputTranscription) {
             setUserTranscription(prev => prev + message.serverContent.inputTranscription.text);
          }
        },
        onerror: (e: any) => {
          setStatus('Sincronizando sistemas...');
          console.error(e);
        },
        onclose: () => {
          setIsActive(false);
          setStatus('Conversación finalizada.');
        },
      });

    } catch (e) {
      setStatus('Error de conexión. Revisa el micrófono.');
    }
  }, [prefs]);

  useEffect(() => {
    startSession();
    return () => {
      sourcesRef.current.forEach(s => s.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [startSession]);

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_transparent_80%)] opacity-40 pointer-events-none" />
      
      <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-slate-900/80 hover:bg-red-500/20 text-slate-500 hover:text-red-500 rounded-2xl transition-all border border-white/5 z-50 group">
        <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      <div className="w-full max-w-7xl flex flex-col items-center relative z-10">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-black font-heading italic text-white uppercase tracking-tighter">Sesión de <span className="text-blue-500">Inmersión Directa</span></h2>
          </div>
          <div className={`inline-flex items-center gap-3 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] ${isActive ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-ping shadow-[0_0_10px_#3b82f6]' : 'bg-red-400'}`} />
            {status}
          </div>
          <p className="mt-6 text-[12px] text-slate-600 font-black uppercase tracking-[0.6em] italic">by ERIK ZAVALA</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
          <div className="lg:col-span-7 flex flex-col items-center h-[350px] md:h-[650px] relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-[150px] rounded-full animate-pulse-slow" />
            <Avatar3D isSpeaking={isSpeaking} gender={prefs.gender} />
            
            {isActive && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
                 <Waves className={`w-12 h-12 ${isSpeaking ? 'text-blue-500 animate-bounce' : 'text-slate-800'}`} />
                 <Waves className={`w-12 h-12 ${isSpeaking ? 'text-blue-400 animate-bounce' : 'text-slate-800'}`} style={{animationDelay: '0.1s'}} />
                 <Waves className={`w-12 h-12 ${isSpeaking ? 'text-blue-300 animate-bounce' : 'text-slate-800'}`} style={{animationDelay: '0.2s'}} />
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="glass rounded-[3rem] p-10 border-white/5 bg-slate-900/40 shadow-2xl overflow-hidden relative border-l-4 border-l-blue-500">
               <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Transcripción en Tiempo Real</span>
               </div>
               <div className="min-h-[120px] max-h-[250px] overflow-y-auto custom-scrollbar">
                 <p className={`text-xl md:text-3xl font-bold leading-tight tracking-tight ${lastTranscription ? 'text-white' : 'text-slate-700 italic'}`}>
                   {lastTranscription || 'Linguix está escuchando para responder...'}
                 </p>
               </div>
            </div>

            <div className="glass rounded-[3rem] p-10 border-white/5 bg-slate-950/20">
               <div className="flex items-center gap-3 mb-6">
                  <Mic className={`w-5 h-5 ${userTranscription ? 'text-green-500 animate-pulse' : 'text-slate-600'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Captura Fonética</span>
               </div>
               <p className="text-slate-400 font-bold italic text-lg leading-relaxed">
                 {userTranscription || 'Empieza a hablar ahora...'}
               </p>
            </div>

            <div className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-[2.5rem] flex items-center gap-6 group hover:bg-blue-600/10 transition-all">
               <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-white" />
               </div>
               <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Corrección Pedagógica</h4>
                  <p className="text-slate-500 text-[12px] leading-relaxed">Si fallas, Linguix se detendrá para explicarte en español cómo decirlo correctamente.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversation;
