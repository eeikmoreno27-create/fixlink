
import React from 'react';

interface DrumVisualizerProps {
  lugCount: number;
  activeLug: number;
  onSelectLug: (id: number) => void;
  lugStatus: Record<number, 'tuned' | 'flat' | 'sharp' | 'pending'>;
}

const DrumVisualizer: React.FC<DrumVisualizerProps> = ({ lugCount, activeLug, onSelectLug, lugStatus }) => {
  const lugs = Array.from({ length: lugCount }, (_, i) => i);
  // Reducido ligeramente para dar aire en móviles pequeños
  const radius = 115;
  const centerX = 160;
  const centerY = 160;

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-[340px] mx-auto aspect-square flex items-center justify-center">
      <svg viewBox="0 0 320 320" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <defs>
          <radialGradient id="drumGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>
        
        {/* Aro Exterior Metálico */}
        <circle cx={centerX} cy={centerY} r={radius + 15} className="fill-slate-900 stroke-slate-800 stroke-[5]" />
        
        {/* Casco y Parche */}
        <circle 
          cx={centerX} cy={centerY} r={radius} 
          fill="url(#drumGrad)"
          className="stroke-teal-500/10 stroke-[10]" 
        />
        
        {/* Tensores (Lugs) */}
        {lugs.map((lugId) => {
          const angle = (lugId * 360) / lugCount - 90;
          const radian = (angle * Math.PI) / 180;
          const lx = centerX + radius * Math.cos(radian);
          const ly = centerY + radius * Math.sin(radian);
          
          const status = lugStatus[lugId] || 'pending';
          let color = "fill-slate-700";
          let glow = "";
          if (status === 'tuned') { color = "fill-emerald-400"; glow = "drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]"; }
          if (status === 'flat') { color = "fill-amber-500"; glow = "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"; }
          if (status === 'sharp') { color = "fill-rose-500"; glow = "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"; }
          
          const isActive = activeLug === lugId;

          return (
            <g key={lugId} onClick={() => onSelectLug(lugId)} className="cursor-pointer group">
              {/* Línea indicadora de patrón de estrella */}
              {isActive && (
                 <line 
                   x1={centerX} y1={centerY} x2={lx} y2={ly} 
                   className="stroke-teal-400 stroke-[2] stroke-dasharray-[6] animate-[dash_0.8s_linear_infinite]"
                 />
              )}
              
              {/* Base del tensor */}
              <circle 
                cx={lx} cy={ly} r={isActive ? 20 : 16} 
                className={`${color} ${glow} transition-all duration-300 ${isActive ? 'stroke-white stroke-[4] scale-110' : 'stroke-slate-950 stroke-[3] group-hover:fill-slate-500'}`}
              />
              <text 
                x={lx} y={ly + 5} 
                textAnchor="middle" 
                className={`text-[9px] font-black pointer-events-none select-none ${isActive ? 'fill-slate-950' : 'fill-white'}`}
              >
                {lugId + 1}
              </text>
            </g>
          );
        })}
      </svg>
      
      {/* Display Central */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-[#070b14]/90 p-6 rounded-full w-28 h-28 sm:w-36 sm:h-36 flex flex-col items-center justify-center border border-white/5 shadow-2xl backdrop-blur-md">
          <p className="text-teal-500 text-[8px] font-black uppercase tracking-[0.3em] mb-1">Tensor</p>
          <p className="text-4xl sm:text-6xl font-black text-white italic leading-none">{activeLug + 1}</p>
        </div>
      </div>
    </div>
  );
};

export default DrumVisualizer;
