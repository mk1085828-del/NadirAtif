// Speech utility for Nadir AI

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function createSpeechRecognizer(
  language: string,
  onResult: (result: SpeechRecognitionResult) => void,
  onError: (error: string) => void,
  onEnd: () => void
) {
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionClass) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;

  // Language mapping
  let langCode = 'en-US';
  if (language === 'ur' || language === 'roman-ur') langCode = 'ur-PK';
  else if (language === 'hi') langCode = 'hi-IN';
  else if (language === 'es') langCode = 'es-ES';
  else if (language === 'ar') langCode = 'ar-SA';
  else if (language === 'fr') langCode = 'fr-FR';
  else if (language === 'de') langCode = 'de-DE';
  else if (language === 'zh') langCode = 'zh-CN';
  else if (language === 'ja') langCode = 'ja-JP';

  recognition.lang = langCode;

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const part = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += part;
      } else {
        interim += part;
      }
    }

    onResult({
      transcript: final || interim,
      isFinal: Boolean(final),
    });
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      onError('Microphone permission denied. Please allow microphone access in your browser settings.');
    } else if (event.error === 'network') {
      onError('Network connection error during voice recognition.');
    } else if (event.error !== 'no-speech') {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}

// Global audio element for neural TTS playback
let currentAudio: HTMLAudioElement | null = null;

export function stopAudioPlayback() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakText(
  text: string,
  options?: {
    engine?: 'neural' | 'browser';
    voice?: string;
    rate?: number;
    language?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  stopAudioPlayback();

  const {
    engine = 'neural',
    voice = 'Zephyr',
    rate = 1.0,
    language = 'en',
    onStart,
    onEnd,
    onError,
  } = options || {};

  // Clean markdown syntax for speech
  const clean = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*#_~[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) {
    onEnd?.();
    return;
  }

  // 1. Try neural TTS via server
  if (engine === 'neural') {
    try {
      onStart?.();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean.slice(0, 700),
          voice,
        }),
      });

      if (!res.ok) {
        throw new Error(`TTS server responded with ${res.status}`);
      }

      const data = await res.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        currentAudio = audio;
        audio.onended = () => {
          currentAudio = null;
          onEnd?.();
        };
        audio.onerror = (e) => {
          console.warn('Audio playback error, falling back to browser speech:', e);
          currentAudio = null;
          speakWithBrowser(clean, rate, language, onStart, onEnd, onError);
        };
        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('Neural TTS failed, using browser speech synthesis:', err);
    }
  }

  // Fallback to browser speech synthesis
  speakWithBrowser(clean, rate, language, onStart, onEnd, onError);
}

function speakWithBrowser(
  text: string,
  rate: number,
  language: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.('Speech synthesis not supported on this device.');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;

  if (language === 'ur' || language === 'roman-ur') utterance.lang = 'ur-PK';
  else if (language === 'hi') utterance.lang = 'hi-IN';
  else if (language === 'es') utterance.lang = 'es-ES';
  else if (language === 'ar') utterance.lang = 'ar-SA';
  else utterance.lang = 'en-US';

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    onError?.(e);
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}
