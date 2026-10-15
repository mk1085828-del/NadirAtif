import { Conversation, AppSettings, GeneratedImage } from '../types';

const CONVERSATIONS_KEY = 'nadir_ai_conversations_v1';
const ACTIVE_CONV_KEY = 'nadir_ai_active_conv_v1';
const SETTINGS_KEY = 'nadir_ai_settings_v1';
const IMAGES_KEY = 'nadir_ai_generated_images_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'auto',
  ttsVoice: 'Zephyr',
  ttsEngine: 'neural',
  speechRate: 1.0,
  systemPrompt: 'You are Nadir AI, a brilliant, friendly, fast, and modern AI assistant.',
  autoSpeakResponse: false,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load conversations:', e);
  }
  return [];
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

export function loadActiveConversationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  } catch {
    return null;
  }
}

export function saveActiveConversationId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_CONV_KEY, id);
  } catch (e) {
    console.error('Failed to save active conversation id:', e);
  }
}

export function loadGeneratedImages(): GeneratedImage[] {
  try {
    const raw = localStorage.getItem(IMAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load generated images:', e);
  }
  return [];
}

export function saveGeneratedImages(images: GeneratedImage[]): void {
  try {
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save generated images:', e);
  }
}
