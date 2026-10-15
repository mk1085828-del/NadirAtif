import React from 'react';
import { Menu, Sparkles, PhoneCall } from 'lucide-react';
import { ActiveTab } from '../types';

interface TopNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onToggleSidebar: () => void;
  onStartVoiceCall: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleSidebar,
  onStartVoiceCall,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 h-14 md:h-16 bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand wordmark & mobile drawer trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Toggle History Sidebar"
          aria-label="Toggle History Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('chat');
          }}
          className="flex items-center gap-2.5 text-slate-100 font-bold tracking-tight text-lg hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span>Nadir AI</span>
        </a>
      </div>

      {/* Zone 2: Single-line navigation links (Top Bar Contract Zone 2) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => onSelectTab('chat')}
          className={`whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
            activeTab === 'chat'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Smart Chat
        </button>
        <button
          onClick={() => onSelectTab('image-gen')}
          className={`whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
            activeTab === 'image-gen'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Image Studio
        </button>
        <button
          onClick={() => onSelectTab('guide')}
          className={`whitespace-nowrap transition-colors min-h-[44px] flex items-center ${
            activeTab === 'guide'
              ? 'text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Setup & APK Guide
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action (Top Bar Contract Zone 3) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onStartVoiceCall}
          className="px-3.5 py-2 text-xs md:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Live Call</span>
        </button>
      </div>
    </header>
  );
};
