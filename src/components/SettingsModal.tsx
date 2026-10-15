import React, { useRef } from 'react';
import {
  X,
  Settings,
  Volume2,
  Globe2,
  Shield,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { AppSettings, AppTheme } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearAllConversations: () => void;
  onExportData: () => void;
  onImportData: (importedData: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllConversations,
  onExportData,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportData(parsed);
      } catch (err) {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Preferences & Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
          {/* Appearance / Theme */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Theme Appearance</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
              >
                <span>Dark Theme</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  settings.theme === 'light'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-750 text-slate-400 hover:text-white'
                }`}
              >
                <span>Light Theme</span>
              </button>
            </div>
          </div>

          {/* Voice & TTS */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Voice & Speech Synthesis</span>
            </div>

            {/* Voice persona choice */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">Neural Voice Persona</label>
              <select
                value={settings.ttsVoice}
                onChange={(e) => onUpdateSettings({ ttsVoice: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-hidden focus:border-indigo-500"
              >
                <option value="Zephyr">Zephyr (Warm & Conversational)</option>
                <option value="Kore">Kore (Clear & Articulate)</option>
                <option value="Puck">Puck (Friendly & Bright)</option>
                <option value="Charon">Charon (Deep & Resonant)</option>
                <option value="Fenrir">Fenrir (Authoritative & Crisp)</option>
              </select>
            </div>

            {/* Speech rate slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Speech Rate</span>
                <span className="font-semibold text-indigo-400 tabular-nums">{settings.speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* System Instruction / Persona */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Personality / System Prompt</span>
            </div>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => onUpdateSettings({ systemPrompt: e.target.value })}
              rows={3}
              placeholder="Custom instructions for Nadir AI (e.g., 'Be ultra-concise', 'Always answer in Urdu', etc.)"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-500 outline-hidden focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Privacy & Data Storage */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Privacy & Local Storage</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your conversations and generated art are saved locally in your browser storage. Your Gemini API key remains securely on the server.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onExportData}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export JSON Backup</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                <span>Import JSON Backup</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all saved conversations? This cannot be undone.')) {
                    onClearAllConversations();
                  }
                }}
                className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Chats</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all min-h-[44px]"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
