import React from 'react';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface AiOrbProps {
  state?: OrbState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'call';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export const AiOrb: React.FC<AiOrbProps> = ({
  state = 'idle',
  size = 'md',
  className = '',
  onClick,
  interactive = false,
}) => {
  // Dimension mapping
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    call: 'w-56 h-56 sm:w-72 sm:h-72',
  };

  // State-based dynamic styling
  const getGlowColor = () => {
    switch (state) {
      case 'listening':
        return 'from-emerald-400 via-teal-500 to-cyan-500 shadow-emerald-500/40';
      case 'thinking':
        return 'from-amber-400 via-purple-500 to-indigo-600 shadow-purple-500/40';
      case 'speaking':
        return 'from-violet-400 via-fuchsia-500 to-indigo-500 shadow-fuchsia-500/50';
      case 'idle':
      default:
        return 'from-cyan-400 via-indigo-500 to-purple-600 shadow-indigo-500/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center select-none ${interactive ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Outer ambient glow */}
      <div
        className={`absolute rounded-full transition-all duration-700 pointer-events-none ${sizeMap[size]} ${
          state === 'speaking'
            ? 'scale-150 opacity-80 animate-orb-pulse'
            : state === 'listening'
            ? 'scale-125 opacity-70 animate-pulse'
            : state === 'thinking'
            ? 'scale-135 opacity-75'
            : 'scale-110 opacity-50'
        } bg-gradient-to-tr ${getGlowColor()} blur-2xl`}
      />

      {/* Ripple rings in listening / speaking states */}
      {(state === 'listening' || state === 'speaking') && (
        <>
          <div
            className={`absolute rounded-full border border-indigo-400/40 animate-ripple ${sizeMap[size]}`}
            style={{ animationDelay: '0s' }}
          />
          <div
            className={`absolute rounded-full border border-teal-400/30 animate-ripple ${sizeMap[size]}`}
            style={{ animationDelay: '0.8s' }}
          />
          <div
            className={`absolute rounded-full border border-purple-400/20 animate-ripple ${sizeMap[size]}`}
            style={{ animationDelay: '1.4s' }}
          />
        </>
      )}

      {/* Rotating outer orbit gradient */}
      <div
        className={`absolute rounded-full transition-all duration-500 ${sizeMap[size]} ${
          state === 'thinking'
            ? 'animate-spin-slow'
            : state === 'speaking'
            ? 'animate-spin-slow-reverse'
            : 'animate-orb-float'
        } p-[2px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-80`}
      >
        <div className="w-full h-full rounded-full bg-slate-950/60 backdrop-blur-xs" />
      </div>

      {/* Main Core Orb */}
      <div
        className={`relative rounded-full transition-transform duration-500 flex items-center justify-center overflow-hidden shadow-2xl ${sizeMap[size]} ${
          state === 'speaking'
            ? 'scale-105'
            : state === 'listening'
            ? 'scale-102'
            : 'hover:scale-105'
        }`}
        style={{
          background:
            state === 'listening'
              ? 'radial-gradient(circle at 35% 35%, #34d399 0%, #06b6d4 45%, #0f172a 90%)'
              : state === 'thinking'
              ? 'radial-gradient(circle at 35% 35%, #fbbf24 0%, #8b5cf6 50%, #0f172a 95%)'
              : state === 'speaking'
              ? 'radial-gradient(circle at 35% 35%, #c084fc 0%, #6366f1 50%, #090d16 95%)'
              : 'radial-gradient(circle at 35% 35%, #38bdf8 0%, #6366f1 50%, #090d16 90%)',
        }}
      >
        {/* Plasma swirling inner light */}
        <div
          className={`absolute inset-0 rounded-full opacity-70 mix-blend-screen transition-opacity ${
            state === 'thinking' ? 'animate-spin' : 'animate-spin-slow'
          }`}
          style={{
            background:
              'radial-gradient(circle at 60% 60%, rgba(244,114,182,0.6) 0%, transparent 60%)',
          }}
        />

        {/* Specular glass highlight reflection */}
        <div className="absolute -top-1 left-3 right-3 h-1/2 rounded-full bg-gradient-to-b from-white/35 to-transparent blur-[1px] pointer-events-none" />

        {/* Audio frequency waves inside the orb when speaking / listening */}
        {state === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-85 z-10">
            <span className="w-1 h-8 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
            <span className="w-1.5 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.25s' }} />
            <span className="w-1 h-14 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            <span className="w-1.5 h-10 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-6 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '0.35s' }} />
          </div>
        )}

        {state === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-4 h-4 rounded-full bg-emerald-300 animate-ping opacity-75" />
          </div>
        )}

        {state === 'thinking' && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-amber-300 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};
