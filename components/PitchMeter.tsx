
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface PitchMeterProps {
  currentFreq: number;
  targetFreq: number;
}

const PitchMeter: React.FC<PitchMeterProps> = ({ currentFreq, targetFreq }) => {
  const diff = currentFreq - targetFreq;
  const tolerance = 0.8; // High precision tolerance
  const isTuned = Math.abs(diff) < tolerance;
  
  const range = 25; // Hz range visibility
  const percentage = Math.max(-100, Math.min(100, (diff / range) * 100));
  
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Frecuencia Actual</p>
          <p className="text-3xl font-black text-white font-mono">{currentFreq > 0 ? currentFreq.toFixed(1) : "---"} <span className="text-xs text-slate-600">Hz</span></p>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          {currentFreq > 0 ? (
            <div className={`flex flex-col items-center animate-in zoom-in duration-300`}>
              {isTuned ? (
                <div className="bg-emerald-500 px-6 py-2 rounded-2xl text-slate-950 text-xs font-black italic shadow-[0_0_20px_rgba(16,185,129,0.4)]">¡PERFECTO!</div>
              ) : diff > 0 ? (
                <div className="flex flex-col items-center text-rose-500">
                  <ArrowDownCircle className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Aflojar</span>
                </div>
              ) : (
                <div className="flex flex-col items-center text-amber-500">
                  <ArrowUpCircle className="w-8 h-8 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter">Apretar</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-700 text-[10px] font-black border border-slate-800 px-4 py-2 rounded-xl">ESPERANDO GOLPE...</div>
          )}
        </div>

        <div className="text-right space-y-1">
          <p className="text-[10px] text-teal-500/50 font-black uppercase tracking-widest">Objetivo Pro</p>
          <p className="text-3xl font-black text-teal-400 font-mono">{targetFreq.toFixed(1)} <span className="text-xs text-teal-800">Hz</span></p>
        </div>
      </div>

      <div className="relative h-20 bg-slate-950 rounded-[2rem] border border-slate-800 p-2 overflow-hidden shadow-inner">
        {/* Scale Ticks */}
        <div className="absolute inset-x-8 top-12 flex justify-between px-1 opacity-20">
          {[...Array(11)].map((_, i) => (
            <div key={i} className={`h-2 w-0.5 bg-white ${i === 5 ? 'h-4 w-1 bg-teal-500 opacity-100' : ''}`}></div>
          ))}
        </div>

        {/* Center Zone Glow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-32 -translate-x-1/2 bg-teal-500/5 blur-2xl"></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-teal-400/20 z-10"></div>
        
        {/* Needle */}
        {currentFreq > 0 && (
           <div 
             className="absolute top-0 bottom-0 transition-all duration-300 ease-out z-20 flex flex-col items-center"
             style={{ left: `${50 + percentage / 2}%`, transform: 'translateX(-50%)' }}
           >
             <div className={`h-full w-1 ${isTuned ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,1)]' : 'bg-white shadow-xl'}`}></div>
             <div className={`w-4 h-4 rounded-full -mt-2 ${isTuned ? 'bg-emerald-400' : 'bg-white'} border-4 border-slate-950`}></div>
           </div>
        )}
        
        <div className="absolute bottom-2 inset-x-8 flex justify-between text-[8px] font-black text-slate-700 uppercase tracking-widest">
           <span>-25Hz</span>
           <span className="text-teal-500">Tono Ideal</span>
           <span>+25Hz</span>
        </div>
      </div>
    </div>
  );
};

export default PitchMeter;
