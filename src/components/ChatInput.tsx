import React, { useRef, useState, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { ChatAttachment } from '../types';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '../utils/speech';

interface ChatInputProps {
  onSendMessage: (content: string, attachment?: ChatAttachment) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  onOpenLiveCall: () => void;
  onOpenCamera: () => void;
  language: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  onOpenCamera,
  language,
}) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (isStreaming) {
      onStopStreaming();
      return;
    }

    if (!text.trim() && !attachment) return;

    onSendMessage(text.trim(), attachment || undefined);
    setText('');
    setAttachment(null);
    setShowAttachMenu(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAttachment({
        type: 'image',
        mimeType: file.type || 'image/jpeg',
        data: dataUrl,
        name: file.name,
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleVoiceDictation = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognizer = createSpeechRecognizer(
      language,
      (result) => {
        setText((prev) => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + result.transcript;
        });
      },
      (errorMsg) => {
        console.error('Dictation error:', errorMsg);
        setIsRecording(false);
      },
      () => {
        setIsRecording(false);
      }
    );

    if (recognizer) {
      recognitionRef.current = recognizer;
      try {
        recognizer.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Could not start recognition:', err);
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5">
      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl w-fit shadow-md animate-in fade-in slide-in-from-bottom-2">
          <img
            src={attachment.data}
            alt="Preview"
            className="w-10 h-10 object-cover rounded-lg border border-slate-600"
          />
          <div className="text-xs text-slate-300 max-w-[180px] truncate">
            {attachment.name || 'Captured Photo'}
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"
            title="Remove Attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attach Popup Menu */}
      {showAttachMenu && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowAttachMenu(false)}
          />
          <div className="absolute left-4 bottom-20 z-30 bg-slate-900 border border-slate-750 rounded-2xl shadow-xl p-2 w-52 space-y-1 animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachMenu(false);
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 text-left text-xs text-slate-200 flex items-center gap-2.5 transition-colors min-h-[44px]"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Upload Image</div>
                <div className="text-[10px] text-slate-400">PNG, JPG, WebP</div>
              </div>
            </button>

            <button
              onClick={() => {
                setShowAttachMenu(false);
                onOpenCamera();
              }}
              className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-800 text-left text-xs text-slate-200 flex items-center gap-2.5 transition-colors min-h-[44px]"
            >
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">Take Photo</div>
                <div className="text-[10px] text-slate-400">Use device camera</div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Input Outer Box */}
      <div
        className={`relative flex items-end gap-1.5 p-2 bg-slate-900/90 dark:bg-slate-950/90 border ${
          isRecording
            ? 'border-emerald-500/60 ring-2 ring-emerald-500/20'
            : 'border-slate-800/90 focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/10'
        } rounded-3xl shadow-xl backdrop-blur-md transition-all`}
      >
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachMenu((prev) => !prev)}
          className={`p-2.5 rounded-2xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center ${
            attachment || showAttachMenu
              ? 'text-indigo-400 bg-indigo-500/15'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Attach Image or Photo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={
            isRecording
              ? 'Listening... speak clearly in English, Urdu, Hindi, etc.'
              : 'Ask Nadir AI anything (English, اردو, Roman Urdu)...'
          }
          className="flex-1 py-3 px-2 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-hidden resize-none max-h-40 leading-relaxed"
        />

        {/* Microphone / Dictation Toggle */}
        <button
          type="button"
          onClick={toggleVoiceDictation}
          className={`p-2.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title={isRecording ? 'Stop Recording' : 'Voice Input (Speech-to-Text)'}
        >
          {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Send or Stop Button */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="p-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-md shadow-rose-500/20 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Stop generation"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && !attachment}
            className={`p-2.5 rounded-2xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
              text.trim() || attachment
                ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 text-white shadow-md shadow-indigo-500/25 active:scale-95'
                : 'text-slate-600 bg-slate-800/50 cursor-not-allowed opacity-50'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
