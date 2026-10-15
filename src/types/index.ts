export type Role = 'user' | 'assistant' | 'system';

export interface ChatAttachment {
  type: 'image';
  mimeType: string;
  data: string; // Base64 data URL
  name?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachment?: ChatAttachment;
  isStreaming?: boolean;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export type ActiveTab = 'chat' | 'voice' | 'image-gen' | 'guide';

export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  theme: AppTheme;
  language: string; // 'auto' | 'en' | 'ur' | 'hi' | 'es' | 'ar' etc.
  ttsVoice: 'Zephyr' | 'Kore' | 'Puck' | 'Charon' | 'Fenrir';
  ttsEngine: 'neural' | 'browser';
  speechRate: number; // 0.8 - 1.5
  systemPrompt: string;
  autoSpeakResponse: boolean;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: number;
}
