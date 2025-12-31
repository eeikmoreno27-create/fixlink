
import React, { useState } from 'react';
import { Globe, Sparkles, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (userData: { name: string, email: string, avatarUrl: string }) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        name: 'Usuario Linguix',
        email: 'estudiante@linguix.ai',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
      });
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/5 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '3s' }} />
      </div>

      <div className="max-w-xl w-full relative z-10">
        <div className="text-center mb-12 space-y-6">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.3)] transform hover:rotate-6 transition-transform duration-500 cursor-pointer">
              <Globe className="w-12 h-12 text-white animate-spin-slow" />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-black font-heading tracking-tighter text-white italic leading-none">
            Linguix
          </h1>
          <p className="text-slate-500 font-bold tracking-[0.4em] text-[10px] uppercase">Plataforma de Inmersión Global</p>
        </div>

        <div className="glass p-8 md:p-14 rounded-[4rem] border-white/5 bg-slate-900/40 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-black text-white italic tracking-tight">Potencia tu Futuro</h2>
            <p className="text-slate-400 text-sm font-medium">Únete a más de 1M de profesionales dominando idiomas con tecnología inmersiva.</p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full group bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-950 font-black uppercase tracking-[0.15em] text-[11px] py-6 rounded-[2rem] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar con Google
                </div>
              )}
            </button>

            <div className="flex gap-4">
              <button className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-slate-400 font-black py-5 rounded-[2rem] text-[9px] uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </button>
              <button className="flex-1 bg-slate-900/80 hover:bg-slate-800 text-slate-400 font-black py-5 rounded-[2rem] text-[9px] uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2">
                Apple ID
              </button>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Seguridad Biométrica y SSL</span>
            </div>
            <p className="text-[9px] text-slate-700 max-w-[280px] text-center leading-relaxed">Al continuar, aceptas nuestros términos de servicio y política de privacidad global.</p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-slate-600 animate-in fade-in slide-in-from-bottom-2 duration-1000">
          <div className="flex items-center gap-4">
             <div className="h-px w-12 bg-slate-900" />
             <Sparkles className="w-5 h-5 text-blue-500/50" />
             <div className="h-px w-12 bg-slate-900" />
          </div>
          <p className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-500">by ERIK ZAVALA</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
