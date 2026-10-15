import React, { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
  MessageSquare,
  Zap,
  Globe2,
  Mic,
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import { AiOrb } from './AiOrb';
import { speakText, stopAudioPlayback } from '../utils/speech';

interface ChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string, attachment?: ChatAttachment) => void;
  onRegenerate: () => void;
  onStartVoiceCall: () => void;
  ttsVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
  ttsEngine: 'neural' | 'browser';
  speechRate: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isStreaming,
  onSendMessage,
  onRegenerate,
  onStartVoiceCall,
  ttsVoice,
  ttsEngine,
  speechRate,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Auto-scroll on new messages or during streaming
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string, id: string) => {
    if (speakingId === id) {
      stopAudioPlayback();
      setSpeakingId(null);
      return;
    }

    setSpeakingId(id);
    speakText(text, {
      engine: ttsEngine,
      voice: ttsVoice,
      rate: speechRate,
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  const isRtl = (text: string) => {
    const rtlChars = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  };

  // Starter prompts
  const starterPrompts = [
    {
      title: 'Multilingual Science',
      prompt: 'اردو میں کوانٹم کمپیوٹنگ کی آسان وضاحت کریں اور بتائیں یہ روایتی کمپیوٹر سے کیسے مختلف ہے۔',
      lang: 'Urdu',
    },
    {
      title: 'Code Generation',
      prompt: 'Write a modern React hook with TypeScript that handles real-time debounced search and localStorage caching.',
      lang: 'Code',
    },
    {
      title: 'Roman Urdu & English',
      prompt: 'Translate into Roman Urdu: "Consistent small efforts compound into extraordinary success over time."',
      lang: 'Translation',
    },
    {
      title: 'Creative Problem Solving',
      prompt: 'Design a comprehensive 30-day curriculum for learning artificial intelligence engineering from scratch.',
      lang: 'Learning',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
      {messages.length === 0 ? (
        <div className="max-w-2xl mx-auto py-8 sm:py-14 text-center space-y-8 animate-in fade-in duration-500">
          {/* Animated Hero Orb */}
          <div className="flex flex-col items-center justify-center">
            <AiOrb size="xl" state="idle" />
            <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
              Welcome to <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Nadir AI</span>
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-400 max-w-lg leading-relaxed">
              Your next-generation conversational companion. Ask complex questions, write code, explore visual concepts, or talk live with voice.
            </p>
          </div>

          {/* Quick Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-750">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>English · اردو · Roman Urdu · Hindi</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-750">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <span>Neural Spoken Voice</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-750">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini 3.8 Flash</span>
            </span>
          </div>

          {/* Starter Suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
            {starterPrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(item.prompt)}
                className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all text-left group shadow-xs active:scale-98"
              >
                <div className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">
                  {item.title}
                </div>
                <div
                  className={`mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed ${
                    isRtl(item.prompt) ? 'text-right' : ''
                  }`}
                  dir={isRtl(item.prompt) ? 'rtl' : 'ltr'}
                >
                  {item.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastMessage = index === messages.length - 1;
            const messageRtl = isRtl(msg.content);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-500/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[78%]`}
                >
                  {/* Attached Image */}
                  {msg.attachment && msg.attachment.type === 'image' && (
                    <div className="mb-2 rounded-2xl overflow-hidden border border-slate-700/80 max-w-sm shadow-md">
                      <img
                        src={msg.attachment.data}
                        alt="Uploaded preview"
                        className="w-full max-h-72 object-cover"
                      />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative rounded-3xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-600/15'
                        : 'bg-slate-900/90 dark:bg-slate-900 text-slate-100 border border-slate-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {isUser ? (
                      <p
                        className={`whitespace-pre-wrap ${messageRtl ? 'text-right font-medium' : ''}`}
                        dir={messageRtl ? 'rtl' : 'ltr'}
                      >
                        {msg.content}
                      </p>
                    ) : (
                      <div
                        className={`markdown-body text-slate-200 ${messageRtl ? 'text-right' : ''}`}
                        dir={messageRtl ? 'rtl' : 'ltr'}
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content || (msg.isStreaming ? 'Thinking...' : '')),
                        }}
                      />
                    )}

                    {msg.isStreaming && !msg.content && (
                      <div className="flex items-center gap-1.5 py-1 text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-xs">Nadir AI is writing...</span>
                      </div>
                    )}
                  </div>

                  {/* Message Action Bar for Assistant */}
                  {!isUser && !msg.isStreaming && (
                    <div className="flex items-center gap-1.5 mt-1.5 px-1 text-slate-400 text-xs">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center gap-1"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        onClick={() => handleSpeak(msg.content, msg.id)}
                        className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                          speakingId === msg.id
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'hover:text-slate-200'
                        }`}
                        title={speakingId === msg.id ? 'Stop audio' : 'Listen to response'}
                      >
                        {speakingId === msg.id ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">
                          {speakingId === msg.id ? 'Stop Voice' : 'Listen'}
                        </span>
                      </button>

                      {isLastMessage && (
                        <button
                          onClick={onRegenerate}
                          className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors flex items-center gap-1"
                          title="Regenerate answer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Regenerate</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
