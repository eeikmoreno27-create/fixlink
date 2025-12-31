
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DrumSpecs, TuningSide, MusicalGenre, TuningStrategy } from './types';
import { AudioProcessor } from './services/audioProcessor';
import { getTuningExpertAdvice } from './services/geminiService';
import DrumVisualizer from './components/DrumVisualizer';
import PitchMeter from './components/PitchMeter';
import { 
  Music, Settings2, Mic, CheckCircle2, RefreshCcw, Sparkles, 
  CircleDot, Layers, Guitar, Drum, Radio, Save, Trash2, Volume2, Globe, Laptop, User, Smartphone
} from 'lucide-react';

const BRANDS = ["Mapex", "Ludwig", "Tama", "Pearl", "Yamaha", "DW Drums", "Gretsch", "Sonor", "PDP", "Canopus"];
const STRATEGIES: {id: TuningStrategy, label: string}[] = [
  {id: 'UNISON', label: 'Unísono (Cantarino)'},
  {id: 'RESO_HIGHER', label: 'Reso + Agudo (Control)'},
  {id: 'BATTER_HIGHER', label: 'Golpe + Agudo (Punch)'}
];
const GENRES: {id: MusicalGenre, label: string, icon: any}[] = [
  {id: 'NORTENO', label: 'Norteño', icon: Music},
  {id: 'CUMBIA', label: 'Cumbia', icon: Guitar},
  {id: 'VERSATILE', label: 'Versátil', icon: Radio},
  {id: 'HUAPANGO', label: 'Huapango', icon: Drum},
  {id: 'ZAPATEADO', label: 'Zapateado', icon: Drum},
  {id: 'ROCK_POP', label: 'Rock/Pop', icon: Music},
  {id: 'METAL', label: 'Metal', icon: Music},
  {id: 'JAZZ', label: 'Jazz', icon: Music}
];

const DIAMETERS = { 
  'SNARE': [10, 12, 13, 14, 15], 
  'TOM': [8, 10, 12, 13, 14, 15], 
  'FLOOR_TOM': [14, 16, 18], 
  'KICK': [18, 20, 22, 24, 26] 
};

const App: React.FC = () => {
  const [step, setStep] = useState<'SETUP' | 'AI_ADVICE' | 'TUNING' | 'DONE'>('SETUP');
  const [activeSide, setActiveSide] = useState<TuningSide>('BATTER');
  const [presets, setPresets] = useState<DrumSpecs[]>([]);
  const [specs, setSpecs] = useState<DrumSpecs>({
    brand: 'Mapex',
    model: 'M Series',
    material: 'WOOD',
    diameter: 14,
    depth: 5.5,
    lugs: 10,
    type: 'SNARE',
    genre: 'NORTENO',
    strategy: 'RESO_HIGHER',
    batterBrand: 'Remo',
    batterModel: 'Ambassador Coated',
    resonantBrand: 'Remo',
    resonantModel: 'Ambassador Hazy',
    targetPitchBatter: 180,
    targetPitchReso: 360,
  });
  
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [activeLug, setActiveLug] = useState(0);
  const [currentFreq, setCurrentFreq] = useState(0);
  const [lugStatus, setLugStatus] = useState<Record<string, 'tuned' | 'flat' | 'sharp' | 'pending'>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const audioRef = useRef<AudioProcessor | null>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const saved = localStorage.getItem('drummaster_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading presets", e);
      }
    }
    audioRef.current = new AudioProcessor();
  }, []);

  const savePreset = () => {
    const newPreset = { ...specs, id: Date.now().toString(), name: `${specs.brand} ${specs.model} ${specs.diameter}"` };
    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('drummaster_presets', JSON.stringify(updated));
  };

  const deletePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    localStorage.setItem('drummaster_presets', JSON.stringify(updated));
  };

  const currentTarget = activeSide === 'BATTER' ? specs.targetPitchBatter : specs.targetPitchReso;

  const analyze = useCallback(() => {
    if (audioRef.current && isListening) {
      const freq = audioRef.current.getFrequency();
      if (freq > 0) {
        setCurrentFreq(freq);
        const diff = freq - currentTarget;
        const statusKey = `${activeSide}_${activeLug}`;
        if (Math.abs(diff) < 0.8) setLugStatus(prev => ({ ...prev, [statusKey]: 'tuned' }));
        else if (diff > 0) setLugStatus(prev => ({ ...prev, [statusKey]: 'sharp' }));
        else setLugStatus(prev => ({ ...prev, [statusKey]: 'flat' }));
      }
    }
    requestRef.current = requestAnimationFrame(analyze);
  }, [isListening, currentTarget, activeLug, activeSide]);

  useEffect(() => {
    if (isListening) requestRef.current = requestAnimationFrame(analyze);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isListening, analyze]);

  const toggleListening = async () => {
    if (isListening) { 
      audioRef.current?.stop(); 
      setIsListening(false); 
    } else {
      if (!audioRef.current) audioRef.current = new AudioProcessor();
      const success = await audioRef.current.init();
      if (success) setIsListening(true);
      else alert("No se pudo activar el micrófono. Por favor, revisa los permisos.");
    }
  };

  const playReference = async () => {
    if (!audioRef.current) audioRef.current = new AudioProcessor();
    await audioRef.current.init();
    audioRef.current.playReferenceTone(currentTarget);
  };

  const handleStartAdvice = async () => {
    setIsLoading(true);
    try {
      const advice = await getTuningExpertAdvice(specs);
      if (advice) {
        setAiAdvice(advice);
        setSpecs(prev => ({ 
          ...prev, 
          targetPitchBatter: advice.recommendedHzBatter, 
          targetPitchReso: advice.recommendedHzReso, 
          targetNote: advice.noteName 
        }));
        setStep('AI_ADVICE');
      }
    } catch (e) {
      console.error("Error fetching AI advice", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 flex flex-col items-center p-4 sm:p-10 pb-24 overflow-x-hidden selection:bg-teal-500/30">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col items-center mb-10 mt-4 text-center">
        <div className="inline-flex items-center gap-4 mb-4 bg-white/5 p-2 pr-6 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="p-3 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-full shadow-lg shadow-teal-500/20">
            <Drum className="w-6 h-6 text-slate-950" />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl sm:text-2xl font-black italic tracking-tighter text-white leading-none">
              DRUMMASTER <span className="text-teal-400">PRO</span>
            </h1>
            <p className="text-[8px] font-black uppercase text-teal-500/40 tracking-[0.3em] mt-1">Universal Calibrator</p>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 xl:grid-cols-12 gap-8 px-2 sm:px-0">
        
        {/* Presets Sidebar */}
        <aside className="xl:col-span-3 space-y-6 order-2 xl:order-1">
          <div className="glass p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Mis Kits</h3>
              <button onClick={savePreset} className="p-2 hover:bg-white/10 rounded-xl transition-all text-teal-400">
                <Save className="w-4 h-4" />
              </button>
            </div>
            {presets.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                <p className="text-[9px] font-bold uppercase italic">Preset Vacío</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {presets.map(p => (
                  <div key={p.id} className="group relative bg-slate-900/50 hover:bg-teal-500/10 p-4 rounded-2xl transition-all border border-white/5 hover:border-teal-500/30">
                    <button onClick={() => { setSpecs(p); setStep('SETUP'); }} className="w-full text-left">
                      <p className="text-xs font-black text-white truncate pr-4">{p.name}</p>
                      <p className="text-[8px] text-slate-500 uppercase mt-1">{p.genre} • {p.diameter}"</p>
                    </button>
                    <button onClick={() => deletePreset(p.id!)} className="absolute top-4 right-4 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-emerald-500/5 p-6 rounded-[2.5rem] border border-emerald-500/10 space-y-4">
             <div className="flex items-center gap-2 text-emerald-400">
                <Smartphone className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Mobile Optimized</span>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
               Algoritmos de precisión por <span className="text-white font-black">Erik Zavala</span> para resultados de estudio.
             </p>
          </div>
        </aside>

        {/* Main Interface */}
        <div className="xl:col-span-9 glass rounded-[3rem] sm:rounded-[4rem] border border-white/10 p-6 sm:p-14 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px] order-1 xl:order-2">
          
          {step === 'SETUP' && (
            <section className="space-y-10 page-transition">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-teal-500/10 rounded-3xl text-teal-400 shadow-inner"><Settings2 className="w-7 h-7" /></div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">CONFIGURACIÓN</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Calibrando {specs.brand} {specs.model}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Casco</label>
                      <div className="grid grid-cols-2 gap-4">
                        <select className="bg-slate-950/80 p-5 rounded-3xl text-sm font-bold border-white/5 border focus:border-teal-500/50 outline-none transition-all appearance-none" value={specs.brand} onChange={e => setSpecs({...specs, brand: e.target.value})}>
                          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <select className="bg-slate-950/80 p-5 rounded-3xl text-sm font-bold border-white/5 border outline-none appearance-none" value={specs.type} onChange={e => setSpecs({...specs, type: e.target.value as any})}>
                          <option value="SNARE">Tarola</option>
                          <option value="TOM">Tom</option>
                          <option value="FLOOR_TOM">Tom Piso</option>
                          <option value="KICK">Bombo</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <select className="bg-slate-950/80 p-5 rounded-3xl text-xs font-bold border-white/5 border outline-none appearance-none" value={specs.diameter} onChange={e => setSpecs({...specs, diameter: +e.target.value})}>
                          {DIAMETERS[specs.type].map(d => <option key={d} value={d}>{d}"</option>)}
                        </select>
                        <select className="bg-slate-950/80 p-5 rounded-3xl text-xs font-bold border-white/5 border outline-none appearance-none" value={specs.lugs} onChange={e => setSpecs({...specs, lugs: +e.target.value})}>
                          {[4, 6, 8, 10, 12].map(l => <option key={l} value={l}>{l} Lugs</option>)}
                        </select>
                        <input className="bg-slate-950/80 p-5 rounded-3xl text-xs font-bold border-white/5 border focus:border-teal-500/50 outline-none" placeholder="Modelo" value={specs.model} onChange={e => setSpecs({...specs, model: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Relación Tonal</label>
                      <div className="space-y-3">
                        {STRATEGIES.map(s => (
                          <button key={s.id} onClick={() => setSpecs({...specs, strategy: s.id})} className={`w-full p-5 rounded-[2rem] text-left text-xs font-black border transition-all flex items-center justify-between ${specs.strategy === s.id ? 'bg-teal-500 border-teal-500 text-slate-950 shadow-xl scale-[1.02]' : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/20'}`}>
                            {s.label}
                            {specs.strategy === s.id && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Género</label>
                      <div className="grid grid-cols-2 gap-3">
                        {GENRES.map(g => (
                          <button key={g.id} onClick={() => setSpecs({...specs, genre: g.id})} className={`flex items-center gap-3 p-4 rounded-2xl border text-[10px] uppercase font-black transition-all ${specs.genre === g.id ? 'bg-white text-slate-950 border-white shadow-xl' : 'bg-slate-950/40 border-white/5 text-slate-600 hover:border-white/10'}`}>
                            <g.icon className="w-3 h-3"/> {g.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 p-7 rounded-[3rem] border border-white/5 space-y-6">
                       <h4 className="text-[9px] font-black text-teal-400 uppercase tracking-[0.3em] flex items-center gap-2 px-1"><Layers className="w-3 h-3"/> Parches</h4>
                       <div className="space-y-5">
                          <input className="w-full bg-slate-950 p-4 rounded-2xl text-[10px] border border-white/5" placeholder="Marca/Modelo Golpe" value={specs.batterModel} onChange={e => setSpecs({...specs, batterModel: e.target.value})} />
                          <input className="w-full bg-slate-950 p-4 rounded-2xl text-[10px] border border-white/5" placeholder="Marca/Modelo Reso" value={specs.resonantModel} onChange={e => setSpecs({...specs, resonantModel: e.target.value})} />
                       </div>
                    </div>
                  </div>
               </div>

               <button 
                  onClick={handleStartAdvice}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 font-black py-8 rounded-[2.5rem] flex items-center justify-center gap-4 transition-all transform active:scale-95 shadow-2xl shadow-teal-500/20 uppercase tracking-[0.3em] text-xs sm:text-sm mt-4"
                >
                  {isLoading ? <RefreshCcw className="animate-spin" /> : <><Sparkles className="w-6 h-6" /> ANALIZAR CON IA</>}
               </button>
            </section>
          )}

          {step === 'AI_ADVICE' && aiAdvice && (
            <section className="space-y-12 page-transition flex flex-col items-center justify-center flex-1">
               <div className="text-center space-y-3">
                  <h2 className="text-4xl sm:text-6xl font-black italic text-white tracking-tighter uppercase leading-tight">ANÁLISIS<br/>EXPERTOS</h2>
                  <p className="text-[10px] text-teal-500 font-black uppercase tracking-[0.5em]">Optimizado para {specs.model}</p>
               </div>

               <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-950/80 p-12 rounded-[3.5rem] border border-white/10 flex flex-col justify-center items-center text-center shadow-2xl group">
                   <p className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest relative z-10">Tono Fundamental</p>
                   <p className="text-8xl sm:text-9xl font-black text-white italic tracking-tighter text-glow relative z-10">{aiAdvice.noteName}</p>
                 </div>
                 <div className="grid grid-rows-2 gap-6">
                    <div className="bg-white/5 p-8 rounded-[3rem] flex justify-between items-center border border-white/5 shadow-inner">
                       <div>
                         <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Batter Head</p>
                         <p className="text-5xl font-black text-white">{aiAdvice.recommendedHzBatter}<span className="text-lg text-teal-500/40 ml-1">Hz</span></p>
                       </div>
                       <div className="p-4 bg-teal-500/10 rounded-full"><CircleDot className="text-teal-400 w-8 h-8" /></div>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[3rem] flex justify-between items-center border border-white/5 shadow-inner">
                       <div>
                         <p className="text-[10px] font-black uppercase text-slate-500 mb-2">Reso Head</p>
                         <p className="text-5xl font-black text-white">{aiAdvice.recommendedHzReso}<span className="text-lg text-teal-500/40 ml-1">Hz</span></p>
                       </div>
                       <div className="p-4 bg-teal-500/10 rounded-full"><Layers className="text-teal-400 w-8 h-8" /></div>
                    </div>
                 </div>
               </div>

               <div className="w-full max-w-2xl bg-teal-500/5 p-8 rounded-[2.5rem] border border-teal-500/10 italic text-slate-300 text-sm leading-relaxed text-center relative shadow-2xl">
                 "{aiAdvice.explanation}"
               </div>

               <div className="w-full flex gap-6">
                 <button onClick={() => setStep('SETUP')} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-7 rounded-[2rem] transition-all uppercase tracking-widest text-xs border border-white/5">Reajustar</button>
                 <button onClick={() => setStep('TUNING')} className="flex-[2] bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-7 rounded-[2rem] shadow-2xl shadow-teal-500/30 uppercase tracking-[0.2em] text-xs sm:text-sm">Iniciar Afinación</button>
               </div>
            </section>
          )}

          {step === 'TUNING' && (
            <section className="space-y-8 page-transition flex-1 flex flex-col">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="inline-flex gap-2 p-1.5 bg-slate-950 rounded-[2rem] border border-white/5 shadow-2xl">
                    <button onClick={() => { setActiveSide('BATTER'); setActiveLug(0); setCurrentFreq(0); }} className={`px-8 py-3 rounded-3xl text-xs font-black transition-all ${activeSide === 'BATTER' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-600'}`}>BATTER</button>
                    <button onClick={() => { setActiveSide('RESONANT'); setActiveLug(0); setCurrentFreq(0); }} className={`px-8 py-3 rounded-3xl text-xs font-black transition-all ${activeSide === 'RESONANT' ? 'bg-teal-500 text-slate-950 shadow-lg' : 'text-slate-600'}`}>RESO</button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={playReference} className="p-5 bg-white/5 hover:bg-white/10 rounded-[2rem] text-white transition-all border border-white/5 shadow-lg active:scale-90">
                      <Volume2 className="w-6 h-6"/>
                    </button>
                    <button onClick={toggleListening} className={`p-5 rounded-[2rem] transition-all shadow-2xl active:scale-90 border border-white/10 ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-teal-500 text-slate-950 shadow-teal-500/20'}`}>
                      <Mic className="w-6 h-6"/>
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center flex-1 py-4">
                  <div className="relative group flex items-center justify-center">
                    <div className="absolute inset-0 bg-teal-500/5 blur-[120px] rounded-full group-hover:bg-teal-500/10 transition-all"></div>
                    <DrumVisualizer 
                      lugCount={specs.lugs} 
                      activeLug={activeLug} 
                      onSelectLug={setActiveLug} 
                      lugStatus={Object.keys(lugStatus).filter(k => k.startsWith(activeSide)).reduce((acc, k) => ({...acc, [+k.split('_')[1]]: lugStatus[k]}), {})}
                    />
                  </div>
                  
                  <div className="space-y-8">
                    <div className="text-center lg:text-left space-y-2">
                       <h3 className="text-teal-400 font-black text-5xl sm:text-6xl italic tracking-tighter uppercase leading-none">{activeSide}</h3>
                       <div className="flex items-center justify-center lg:justify-start gap-2">
                         <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(45,212,191,1)]"></div>
                         <p className="text-slate-500 text-[9px] font-black tracking-[0.4em] uppercase">Control Lug {activeLug + 1}</p>
                       </div>
                    </div>

                    <PitchMeter currentFreq={currentFreq} targetFreq={currentTarget} />

                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => {
                        const seq = Array.from({length: specs.lugs}, (_, i) => i);
                        const idx = seq.indexOf(activeLug);
                        setActiveLug(seq[(idx + 1) % specs.lugs]);
                        setCurrentFreq(0);
                      }} className="bg-white/5 hover:bg-white/10 text-white font-black py-7 rounded-[2rem] border border-white/5 shadow-lg transition-all text-xs uppercase tracking-widest">
                        Sig. Tensor
                      </button>
                      <button onClick={() => activeSide === 'BATTER' ? setActiveSide('RESONANT') : setStep('DONE')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-7 rounded-[2rem] shadow-2xl transition-all uppercase tracking-widest text-xs">
                        {activeSide === 'BATTER' ? 'A Reso' : 'Terminar'}
                      </button>
                    </div>
                  </div>
               </div>
            </section>
          )}

          {step === 'DONE' && (
            <section className="text-center space-y-12 py-16 page-transition flex-1 flex flex-col justify-center items-center">
               <div className="relative">
                 <div className="absolute inset-0 bg-emerald-500 blur-[120px] opacity-10"></div>
                 <div className="p-16 bg-emerald-500/10 rounded-full border border-emerald-500/20 relative shadow-inner">
                    <CheckCircle2 className="w-40 h-40 text-emerald-400" />
                 </div>
               </div>
               <div className="space-y-4">
                 <h2 className="text-6xl sm:text-7xl font-black text-white italic tracking-tighter uppercase leading-tight">PERFECTO</h2>
                 <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px]">Drum Calibration Completed</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-5 w-full max-w-md">
                 <button onClick={savePreset} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-3 border border-white/10 transition-all uppercase tracking-widest text-[10px]">
                   <Save className="w-4 h-4"/> Guardar
                 </button>
                 <button onClick={() => setStep('SETUP')} className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-[10px]">
                   <RefreshCcw className="w-4 h-4"/> Nuevo
                 </button>
               </div>
            </section>
          )}

          {/* AI Status */}
          <div className="absolute bottom-8 right-10 flex items-center gap-3 px-4 py-2 bg-slate-950/60 backdrop-blur-md rounded-full border border-white/5">
             <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(45,212,191,1)]"></div>
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Gemini 3 Engine</span>
          </div>

        </div>
      </main>

      <footer className="mt-20 text-center w-full max-w-6xl">
        <div className="flex flex-wrap justify-center items-center gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 mb-8">
           <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5"><Laptop className="w-3 h-3" /> Universal App</span>
           <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5"><Globe className="w-3 h-3" /> Cloud Ready</span>
           <span className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5"><Sparkles className="w-3 h-3" /> AI Precision</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-8"></div>
        
        <div className="flex flex-col items-center gap-4">
           <div className="group relative flex items-center gap-3 px-8 py-3 bg-teal-500/5 hover:bg-teal-500/10 rounded-[2rem] border border-teal-500/20 transition-all cursor-default">
              <User className="w-4 h-4 text-teal-400" />
              <p className="text-xs font-black text-teal-400 uppercase tracking-[0.3em]">
                by <span className="text-white text-glow">Erik Zavala</span>
              </p>
           </div>
           <p className="text-[8px] opacity-20 uppercase font-black tracking-[0.5em] text-white">Professional Drum Calibration Engine • 2024</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
