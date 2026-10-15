import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Globe2,
  AlertCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { AiOrb, OrbState } from './AiOrb';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopAudioPlayback,
} from '../utils/speech';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  ttsVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
  ttsEngine: 'neural' | 'browser';
  speechRate: number;
  onRecordCallMessage?: (userText: string, aiText: string) => void;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  language,
  onChangeLanguage,
  ttsVoice,
  ttsEngine,
  speechRate,
  onRecordCallMessage,
}) => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [liveUserTranscript, setLiveUserTranscript] = useState('');
  const [liveAiTranscript, setLiveAiTranscript] = useState('');
  const [callHistory, setCallHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const userSpeechAccumulatorRef = useRef('');

  // Call timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Main call lifecycle
  useEffect(() => {
    if (!isOpen) {
      cleanup();
      return;
    }

    startCallSession();

    return () => {
      cleanup();
    };
  }, [isOpen, language]);

  const cleanup = () => {
    stopAudioPlayback();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setOrbState('idle');
    setCallDuration(0);
    setLiveUserTranscript('');
    setLiveAiTranscript('');
    setErrorMessage(null);
  };

  const startCallSession = () => {
    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        'Live speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari for voice calling.'
      );
      return;
    }

    setErrorMessage(null);
    setOrbState('idle');
    startListening();
  };

  const startListening = () => {
    if (isSpeakingRef.current || isMuted) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognizer = createSpeechRecognizer(
      language,
      (result) => {
        setOrbState('listening');
        setLiveUserTranscript(result.transcript);
        userSpeechAccumulatorRef.current = result.transcript;

        // Reset silence timer: user stopped talking for 1.2s -> submit to AI
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (userSpeechAccumulatorRef.current.trim()) {
            handleUserUtterance(userSpeechAccumulatorRef.current.trim());
          }
        }, 1300);
      },
      (error) => {
        console.error('Call recognizer error:', error);
        setErrorMessage(error);
        setOrbState('idle');
      },
      () => {
        // Recognition ended; if not speaking and call still open, restart
        if (!isSpeakingRef.current && isOpen && !isMuted) {
          setTimeout(() => {
            if (isOpen && !isSpeakingRef.current) {
              startListening();
            }
          }, 300);
        }
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
        setOrbState('idle');
      } catch (err) {
        console.warn('Recognition start exception:', err);
      }
    }
  };

  const handleUserUtterance = async (userText: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    userSpeechAccumulatorRef.current = '';

    // Stop recognition while processing and speaking
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setOrbState('thinking');
    setLiveAiTranscript('');
    setCallHistory((prev) => [...prev, { sender: 'user', text: userText }]);

    try {
      // Call Nadir AI chat backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...callHistory.map((h) => ({
              role: h.sender === 'user' ? 'user' : 'assistant',
              content: h.text,
            })),
            { role: 'user', content: userText },
          ],
          systemInstruction: `You are Nadir AI in a live spoken voice call.
Rules:
1. Speak in a friendly, conversational, concise manner (2-4 sentences max).
2. Avoid bullet points, symbols, markdown tables, or emojis that are awkward to speak aloud.
3. If the user spoke in Urdu, Roman Urdu, or Hindi, reply in that same language warmly.
4. Keep the pace upbeat, smart, and helpful.`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get voice response from Nadir AI');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  aiText += data.text;
                  setLiveAiTranscript(aiText);
                }
              } catch {}
            }
          }
        }
      }

      if (!aiText) {
        aiText = "I'm listening. How can I help you today?";
      }

      setCallHistory((prev) => [...prev, { sender: 'ai', text: aiText }]);
      onRecordCallMessage?.(userText, aiText);

      // Now speak the answer out loud
      isSpeakingRef.current = true;
      setOrbState('speaking');

      await speakText(aiText, {
        engine: ttsEngine,
        voice: ttsVoice,
        rate: speechRate,
        language,
        onEnd: () => {
          isSpeakingRef.current = false;
          setOrbState('idle');
          if (isOpen && !isMuted) {
            startListening();
          }
        },
        onError: () => {
          isSpeakingRef.current = false;
          setOrbState('idle');
          if (isOpen && !isMuted) {
            startListening();
          }
        },
      });
    } catch (err: any) {
      console.error('Call generation error:', err);
      setErrorMessage(err.message || 'Call response failed');
      setOrbState('idle');
      isSpeakingRef.current = false;
      if (isOpen && !isMuted) {
        startListening();
      }
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      startListening();
    } else {
      setIsMuted(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      stopAudioPlayback();
      setOrbState('idle');
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white animate-in fade-in duration-300">
      {/* Top Status Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-sm font-bold tracking-tight">Nadir AI Live Call</div>
            <div className="text-xs text-slate-400 tabular-nums">{formatDuration(callDuration)}</div>
          </div>
        </div>

        {/* Language selector in call */}
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-cyan-400" />
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs rounded-xl px-2.5 py-1.5 text-slate-200 outline-hidden focus:border-indigo-500"
          >
            <option value="en">English (US/Global)</option>
            <option value="ur">اردو (Urdu)</option>
            <option value="roman-ur">Roman Urdu</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="ar">العربية (Arabic)</option>
            <option value="es">Español (Spanish)</option>
          </select>
        </div>
      </div>

      {/* Center Stage: The Live AI Orb */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Ambient background rays */}
        <div className="absolute inset-0 bg-radial from-indigo-950/40 via-transparent to-slate-950 pointer-events-none" />

        <AiOrb state={orbState} size="call" />

        {/* Status caption */}
        <div className="mt-8 text-sm font-medium tracking-wide">
          {orbState === 'listening' ? (
            <span className="text-emerald-400 animate-pulse">Listening to your voice...</span>
          ) : orbState === 'thinking' ? (
            <span className="text-amber-300 animate-pulse">Nadir AI is thinking...</span>
          ) : orbState === 'speaking' ? (
            <span className="text-cyan-300">Nadir AI is speaking...</span>
          ) : isMuted ? (
            <span className="text-rose-400">Microphone Muted</span>
          ) : (
            <span className="text-slate-400">Speak naturally to Nadir AI</span>
          )}
        </div>

        {/* Live Transcription Box */}
        <div className="mt-6 w-full max-w-lg min-h-[90px] p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md text-xs leading-relaxed transition-all">
          {errorMessage ? (
            <div className="flex items-center justify-center gap-2 text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : liveUserTranscript ? (
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                You
              </span>
              <p className="text-slate-100 text-sm font-medium">{liveUserTranscript}</p>
            </div>
          ) : liveAiTranscript ? (
            <div className="space-y-1">
              <span className="text-cyan-400 font-semibold uppercase text-[10px] tracking-wider">
                Nadir AI
              </span>
              <p className="text-slate-200 text-sm font-medium">{liveAiTranscript}</p>
            </div>
          ) : (
            <div className="text-slate-500 py-3 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400/60" />
              <span>Say "Hello Nadir", ask a question, or talk in any language...</span>
            </div>
          )}
        </div>
      </div>

      {/* Call Controls Footer */}
      <div className="px-6 py-6 border-t border-slate-900 bg-slate-950 flex items-center justify-center gap-6">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all min-h-[48px] min-w-[48px] ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/30 flex items-center justify-center active:scale-95 transition-all min-h-[48px] min-w-[48px]"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
