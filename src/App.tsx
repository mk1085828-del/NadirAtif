/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Conversation,
  ChatMessage,
  ChatAttachment,
  AppSettings,
  GeneratedImage,
  ActiveTab,
} from './types';
import {
  loadConversations,
  saveConversations,
  loadSettings,
  saveSettings,
  loadActiveConversationId,
  saveActiveConversationId,
  loadGeneratedImages,
  saveGeneratedImages,
} from './utils/storage';
import { TopNav } from './components/TopNav';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ChatInput } from './components/ChatInput';
import { VoiceCallModal } from './components/VoiceCallModal';
import { ImageGenWorkspace } from './components/ImageGenWorkspace';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { SettingsModal } from './components/SettingsModal';
import { GuideModal } from './components/GuideModal';
import { speakText } from './utils/speech';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false);

  // Chat Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const loadedConvs = loadConversations();
    setConversations(loadedConvs);

    const savedId = loadActiveConversationId();
    if (savedId && loadedConvs.some((c) => c.id === savedId)) {
      setActiveConversationId(savedId);
    } else if (loadedConvs.length > 0) {
      setActiveConversationId(loadedConvs[0].id);
    }

    setSavedImages(loadGeneratedImages());
  }, []);

  // Save conversations whenever updated
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // Save settings whenever updated
  useEffect(() => {
    saveSettings(settings);
    // Apply theme class to document body
    if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-slate-950', 'text-slate-100');
      document.body.classList.add('bg-slate-50', 'text-slate-900');
    } else {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('bg-slate-50', 'text-slate-900');
      document.body.classList.add('bg-slate-950', 'text-slate-100');
    }
  }, [settings]);

  // Current active conversation
  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = currentConversation ? currentConversation.messages : [];

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    saveActiveConversationId(id);
  };

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    saveActiveConversationId(newConv.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      if (activeConversationId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActiveConversationId(nextId);
        if (nextId) saveActiveConversationId(nextId);
        else localStorage.removeItem('nadir_ai_active_conv_v1');
      }
      return updated;
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  const handleTogglePin = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );
  };

  const handleSendMessage = async (content: string, attachment?: ChatAttachment) => {
    let targetConvId = activeConversationId;
    let updatedConversations = [...conversations];

    // If no active conversation, create one
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      const title = content.slice(0, 36) || (attachment ? 'Analyzed Photo' : 'New Chat');
      const newConv: Conversation = {
        id: Date.now().toString(),
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      updatedConversations = [newConv, ...conversations];
      targetConvId = newConv.id;
      setActiveConversationId(newConv.id);
      saveActiveConversationId(newConv.id);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      attachment,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Update conversation state with user and pending assistant message
    setConversations((prev) => {
      const list = prev.some((c) => c.id === targetConvId) ? prev : updatedConversations;
      return list.map((c) => {
        if (c.id === targetConvId) {
          const isFirstMessage = c.messages.length === 0;
          return {
            ...c,
            title: isFirstMessage ? (content.slice(0, 36) || 'Photo Analysis') : c.title,
            messages: [...c.messages, userMessage, assistantMessage],
            updatedAt: Date.now(),
          };
        }
        return c;
      });
    });

    // Start streaming SSE request to server
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Find current messages for target conversation
      const currentConv = updatedConversations.find((c) => c.id === targetConvId);
      const conversationHistory = currentConv ? currentConv.messages : [];

      const payloadMessages = [
        ...conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
          image: m.attachment ? { data: m.attachment.data, mimeType: m.attachment.mimeType } : undefined,
        })),
        {
          role: 'user',
          content,
          image: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined,
        },
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          systemInstruction: settings.systemPrompt,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) {
                  accumulatedText += parsed.text;

                  // Update assistant message text in state
                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id === targetConvId) {
                        return {
                          ...c,
                          messages: c.messages.map((m) =>
                            m.id === assistantPlaceholderId
                              ? { ...m, content: accumulatedText, isStreaming: true }
                              : m
                          ),
                        };
                      }
                      return c;
                    })
                  );
                } else if (parsed.error) {
                  accumulatedText += `\n\n*(Error: ${parsed.error})*`;
                }
              } catch {}
            }
          }
        }
      }

      // Mark streaming complete
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === targetConvId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantPlaceholderId
                  ? { ...m, content: accumulatedText || 'No response generated.', isStreaming: false }
                  : m
              ),
            };
          }
          return c;
        })
      );

      // Auto-speak if enabled
      if (settings.autoSpeakResponse && accumulatedText) {
        speakText(accumulatedText, {
          engine: settings.ttsEngine,
          voice: settings.ttsVoice,
          rate: settings.speechRate,
          language: settings.language,
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === targetConvId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? {
                        ...m,
                        content: `⚠️ Failed to get response: ${err.message || 'Network error'}`,
                        isStreaming: false,
                        error: true,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    // Mark current streaming message as finished
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          return {
            ...c,
            messages: c.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
          };
        }
        return c;
      })
    );
  };

  const handleRegenerate = () => {
    if (!currentConversation || currentMessages.length === 0) return;
    // Find last user message
    const lastUserMessage = [...currentMessages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last assistant message and resend
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const withoutLastAssistant = c.messages.filter(
            (m, idx) => !(idx === c.messages.length - 1 && m.role === 'assistant')
          );
          return { ...c, messages: withoutLastAssistant };
        }
        return c;
      })
    );

    handleSendMessage(lastUserMessage.content, lastUserMessage.attachment);
  };

  const handleImageGenerated = (image: GeneratedImage) => {
    const updated = [image, ...savedImages];
    setSavedImages(updated);
    saveGeneratedImages(updated);
  };

  const handleDiscussImageInChat = (imageUrl: string, promptText: string) => {
    setActiveTab('chat');
    handleSendMessage(`I generated this image with the prompt: "${promptText}". What are some creative ways to expand on this concept or write a story about it?`, {
      type: 'image',
      mimeType: 'image/png',
      data: imageUrl,
      name: 'Generated Artwork',
    });
  };

  const handleRecordCallMessage = (userText: string, aiText: string) => {
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      const newConv: Conversation = {
        id: Date.now().toString(),
        title: `Live Call: ${userText.slice(0, 24)}...`,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      saveActiveConversationId(newConv.id);
      targetConvId = newConv.id;
    }

    const uMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    const aMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiText,
      timestamp: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? { ...c, messages: [...c.messages, uMsg, aMsg], updatedAt: Date.now() }
          : c
      )
    );
  };

  const handleClearAllConversations = () => {
    setConversations([]);
    setActiveConversationId(null);
    localStorage.removeItem('nadir_ai_conversations_v1');
    localStorage.removeItem('nadir_ai_active_conv_v1');
  };

  const handleExportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      conversations,
      settings,
      savedImages,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nadir-ai-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportData = (imported: any) => {
    if (imported && Array.isArray(imported.conversations)) {
      setConversations(imported.conversations);
      saveConversations(imported.conversations);
      if (imported.conversations.length > 0) {
        setActiveConversationId(imported.conversations[0].id);
        saveActiveConversationId(imported.conversations[0].id);
      }
      if (imported.settings) {
        setSettings(imported.settings);
      }
      if (Array.isArray(imported.savedImages)) {
        setSavedImages(imported.savedImages);
        saveGeneratedImages(imported.savedImages);
      }
      setIsSettingsOpen(false);
      alert('Conversations and data restored successfully!');
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Drawer */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onTogglePinConversation={handleTogglePin}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onSwitchTab={(tab) => setActiveTab(tab)}
        activeTab={activeTab}
        theme={settings.theme}
        onToggleTheme={() =>
          setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
        }
        onExportData={handleExportData}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Bar Contract (Wordmark - Navigation - Primary Action) */}
        <TopNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'voice') {
              setIsVoiceCallOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onStartVoiceCall={() => setIsVoiceCallOpen(true)}
        />

        {/* Dynamic Tab Body */}
        {activeTab === 'chat' && (
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <ChatView
              messages={currentMessages}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onRegenerate={handleRegenerate}
              onStartVoiceCall={() => setIsVoiceCallOpen(true)}
              ttsVoice={settings.ttsVoice}
              ttsEngine={settings.ttsEngine}
              speechRate={settings.speechRate}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              onOpenLiveCall={() => setIsVoiceCallOpen(true)}
              onOpenCamera={() => setIsCameraOpen(true)}
              language={settings.language}
            />
          </main>
        )}

        {activeTab === 'image-gen' && (
          <main className="flex-1 overflow-y-auto">
            <ImageGenWorkspace
              onImageGenerated={handleImageGenerated}
              savedImages={savedImages}
              onDiscussInChat={handleDiscussImageInChat}
            />
          </main>
        )}

        {activeTab === 'guide' && (
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Setup & APK Packaging Guide</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Complete technical instructions for Nadir AI local run, API security, and Android compilation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-2">
                <div className="font-semibold text-slate-200">Production Architecture:</div>
                <p>
                  All Gemini model calls (text streaming, neural TTS, image generation, and camera vision) run through the secure Express server in <code>server.ts</code>. The frontend communicates with proxy endpoints: <code>/api/chat</code>, <code>/api/generate-image</code>, <code>/api/analyze-image</code>, and <code>/api/tts</code>.
                </p>
              </div>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
              >
                Open Full Interactive Developer Modal
              </button>
            </div>
          </main>
        )}
      </div>

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        language={settings.language}
        onChangeLanguage={(lang) => setSettings((prev) => ({ ...prev, language: lang }))}
        ttsVoice={settings.ttsVoice}
        ttsEngine={settings.ttsEngine}
        speechRate={settings.speechRate}
        onRecordCallMessage={handleRecordCallMessage}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          handleSendMessage('Please analyze this photo in detail and explain what you see.', {
            type: 'image',
            mimeType: 'image/jpeg',
            data: dataUrl,
            name: 'Camera Snapshot',
          });
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onClearAllConversations={handleClearAllConversations}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* Guide Modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
