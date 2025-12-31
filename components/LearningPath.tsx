
import React from 'react';
import { LearningNode } from '../types';
import { Check, Lock, Star, Trophy, Swords } from 'lucide-react';

interface Props {
  nodes: LearningNode[];
  onNodeClick: (node: LearningNode) => void;
}

const LearningPath: React.FC<Props> = ({ nodes, onNodeClick }) => {
  return (
    <div className="flex flex-col items-center gap-20 py-10 relative">
      {/* Curved connecting line */}
      <svg className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-48 h-full pointer-events-none -z-10" overflow="visible">
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path 
          d={nodes.map((_, i) => {
            const y = i * 164 + 48; // spacing + initial offset
            const x = Math.sin(i * 1.5) * 80 + 96; // sin movement + center
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          fill="none" 
          stroke="url(#lineGrad)" 
          strokeWidth="6" 
          strokeLinecap="round" 
          strokeDasharray="12 12"
          className="animate-[dash_20s_linear_infinite]"
        />
      </svg>
      
      {nodes.map((node, index) => {
        const isLocked = node.status === 'locked';
        const isCompleted = node.status === 'completed';
        const offset = Math.sin(index * 1.5) * 80;

        return (
          <div 
            key={node.id} 
            className="relative group"
            style={{ transform: `translateX(${offset}px)` }}
          >
            <button
              onClick={() => !isLocked && onNodeClick(node)}
              disabled={isLocked}
              className={`
                relative w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-500
                shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 transform-gpu
                ${isLocked ? 'bg-slate-900 border-slate-800 cursor-not-allowed opacity-60' : 
                  isCompleted ? 'bg-green-500 border-green-400 hover:scale-110' : 
                  'bg-blue-600 border-blue-400 hover:scale-110 animate-pulse-slow'}
              `}
            >
              {isLocked ? <Lock className="w-10 h-10 text-slate-700" /> :
               isCompleted ? <Check className="w-12 h-12 text-white drop-shadow-lg" /> :
               node.type === 'boss' ? <Swords className="w-12 h-12 text-white" /> :
               node.type === 'game' ? <Star className="w-12 h-12 text-white fill-current" /> :
               <Trophy className="w-12 h-12 text-white" />}
              
              {!isLocked && !isCompleted && (
                <div className="absolute -top-4 -right-4 px-4 py-1.5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-xl animate-bounce">
                  <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">AHORA</span>
                </div>
              )}

              {/* Hover highlight effect */}
              {!isLocked && (
                <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
              )}
            </button>

            {/* Label Card */}
            <div className={`absolute top-1/2 ${offset > 0 ? '-left-64' : 'left-32'} -translate-y-1/2 w-60 glass p-6 rounded-[2rem] border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform translate-y-2 group-hover:translate-y-0 shadow-2xl hidden md:block`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-slate-600' : isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} />
                <h4 className="font-bold text-lg text-white leading-tight">{node.title}</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{node.description}</p>
              {isLocked && (
                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                  <Lock className="w-3.5 h-3.5" /> Requisito: Maestría 85%
                </div>
              )}
            </div>
            
            {/* Mobile Title (visible always for current) */}
            <div className="md:hidden mt-4 text-center">
               <p className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-slate-700' : isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                 {node.title}
               </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LearningPath;
