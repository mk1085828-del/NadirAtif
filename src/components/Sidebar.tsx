import React, { useState } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Pin,
  Check,
  X,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  Sparkles,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { Conversation, AppTheme, ActiveTab } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onTogglePinConversation: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onSwitchTab: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  theme: AppTheme;
  onToggleTheme: () => void;
  onExportData: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  isOpen,
  onClose,
  onOpenSettings,
  onOpenGuide,
  onSwitchTab,
  activeTab,
  theme,
  onToggleTheme,
  onExportData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filtered.filter((c) => c.pinned);
  const regularConversations = filtered.filter((c) => !c.pinned);

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 flex flex-col bg-slate-900/95 dark:bg-slate-950 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header: New Chat & Mobile Close */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => {
              onNewChat();
              onSwitchTab('chat');
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 py-2.5 px-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Mode Switcher for Mobile */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 md:hidden">
          <button
            onClick={() => {
              onSwitchTab('chat');
              onClose();
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => {
              onSwitchTab('image-gen');
              onClose();
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeTab === 'image-gen'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/70 border border-slate-750 focus:border-indigo-500 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30 text-indigo-400" />
              <p className="text-xs">No conversations yet.</p>
              <p className="text-[11px] text-slate-600 mt-1">Start chatting with Nadir AI!</p>
            </div>
          ) : null}

          {/* Pinned section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pin className="w-3 h-3 text-indigo-400" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1 mt-1">
                {pinnedConversations.map((c) => renderItem(c))}
              </div>
            </div>
          )}

          {/* Recent list */}
          {regularConversations.length > 0 && (
            <div>
              {pinnedConversations.length > 0 && (
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recent
                </div>
              )}
              <div className="space-y-1 mt-1">
                {regularConversations.map((c) => renderItem(c))}
              </div>
            </div>
          )}

          {filtered.length === 0 && searchQuery && (
            <div className="text-center py-6 text-xs text-slate-500">
              No chats matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Bottom Utility Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 dark:bg-slate-950/60 flex flex-col gap-1">
          <div className="flex items-center justify-between px-1 py-1">
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-2 min-h-[40px] transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              <span className="capitalize">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onExportData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg text-xs flex items-center gap-1.5 min-h-[40px] transition-colors"
              title="Export conversations as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onOpenSettings();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex-1 px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs flex items-center gap-2 min-h-[42px] transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                onOpenGuide();
                if (window.innerWidth < 768) onClose();
              }}
              className="px-2.5 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl text-xs flex items-center gap-1.5 min-h-[42px] transition-colors"
              title="Setup & Deployment Guide"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Guide</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  function renderItem(c: Conversation) {
    const isActive = c.id === activeConversationId;
    const isEditing = editingId === c.id;

    if (isEditing) {
      return (
        <form
          key={c.id}
          onSubmit={(e) => handleSaveRename(c.id, e)}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-800 rounded-xl border border-indigo-500/50"
        >
          <input
            type="text"
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white outline-hidden px-1"
          />
          <button
            type="submit"
            className="p-1 text-emerald-400 hover:text-emerald-300"
            title="Save Title"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setEditingId(null)}
            className="p-1 text-slate-400 hover:text-slate-300"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      );
    }

    return (
      <div
        key={c.id}
        onClick={() => {
          onSelectConversation(c.id);
          onSwitchTab('chat');
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all min-h-[44px] ${
          isActive
            ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-1">
          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
          <span className="truncate">{c.title || 'New Conversation'}</span>
        </div>

        {/* Actions hover cluster */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePinConversation(c.id);
            }}
            className={`p-1.5 rounded-md hover:bg-slate-700/60 ${c.pinned ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'}`}
            title={c.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => handleStartRename(c, e)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 rounded-md"
            title="Rename"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(c.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-md"
            title="Delete Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
};
