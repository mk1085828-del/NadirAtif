import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Terminal,
  Smartphone,
  ShieldCheck,
  Server,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'env' | 'testing' | 'deploy' | 'apk'>('env');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeSnippet = ({ code, id }: { code: string; id: string }) => (
    <div className="relative mt-2 rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
      <button
        onClick={() => copyToClipboard(code, id)}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        title="Copy snippet"
      >
        {copiedCode === id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="pr-10">{code}</pre>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Nadir AI Developer & Deployment Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('env')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'env'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1. Env & Security</span>
          </button>
          <button
            onClick={() => setActiveSection('testing')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'testing'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>2. Testing Steps</span>
          </button>
          <button
            onClick={() => setActiveSection('deploy')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'deploy'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. Cloud Deployment</span>
          </button>
          <button
            onClick={() => setActiveSection('apk')}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeSection === 'apk'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>4. Android APK Guide</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {activeSection === 'env' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Architecture & Environment Variables</span>
              </h4>
              <p>
                Nadir AI executes all Gemini API requests strictly server-side inside <code>server.ts</code>. Your <code>GEMINI_API_KEY</code> is never bundled or sent to the browser client.
              </p>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="font-semibold text-slate-200">Required Environment Variable:</div>
                <div className="font-mono text-cyan-300">GEMINI_API_KEY="AIzaSy..."</div>
                <p className="text-[11px] text-slate-400">
                  Configure this in your <code>.env</code> file or inject via AI Studio Settings &gt; Secrets panel.
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-200">Gemini Models Used:</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  <li><strong className="text-slate-200">gemini-3.8-flash</strong>: Fast, versatile multimodal model for chat, reasoning, code, Urdu/Roman Urdu, and image understanding. Free tier offers generous RPM/RPD limits.</li>
                  <li><strong className="text-slate-200">gemini-3.1-flash-lite-image</strong>: Native image generation model for high-resolution visual synthesis.</li>
                  <li><strong className="text-slate-200">gemini-3.8-flash-lite-tts</strong>: High-efficiency neural text-to-speech for crystal-clear spoken voices.</li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'testing' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>End-to-End Verification Instructions</span>
              </h4>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-750">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test 1: Multilingual AI Chat</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Type a message in English or Urdu: <em>"اردو میں مجھے کوانٹم کمپیوٹنگ سمجھائیں"</em> or Roman Urdu: <em>"kya haal hai Nadir AI"</em>. Verify streaming text generation, markdown formatting, copy button, and listen button.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-750">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test 2: Full-Screen Live Voice Call</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Click <strong>"Live Call"</strong> in the top navigation. Accept microphone permission. Speak into your microphone and verify that the AI Orb reacts (listening &gt; thinking &gt; speaking) and Nadir speaks back.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-750">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test 3: Camera Vision Understanding</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Click the paperclip button in the chat box, choose <strong>"Take Photo"</strong>, capture an object or whiteboard notes, and ask Nadir AI to explain it.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-750">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Test 4: AI Image Generation Studio</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Switch to <strong>"Image Studio"</strong>, choose an aspect ratio (e.g. 16:9), enter a prompt, and generate. Verify the generated image preview, download button, and discuss in chat.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'deploy' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                <span>Production Deployment (Cloud Run / Node)</span>
              </h4>

              <p>Build and start the full-stack server:</p>
              <CodeSnippet
                id="build"
                code={`# 1. Install dependencies\nnpm install\n\n# 2. Build Vite frontend\nnpm run build\n\n# 3. Start Node production server\nNODE_ENV=production node server.ts`}
              />

              <div className="space-y-2 pt-2">
                <div className="font-semibold text-slate-200">Dockerfile for Container Deployments:</div>
                <CodeSnippet
                  id="dockerfile"
                  code={`FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE 3000\nENV NODE_ENV=production\nCMD ["node", "server.ts"]`}
                />
              </div>
            </div>
          )}

          {activeSection === 'apk' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Android APK Packaging Guide (Capacitor & TWA)</span>
              </h4>

              <p>
                You can package Nadir AI into an installable Android APK using Capacitor in a few simple steps:
              </p>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Step 1: Install Capacitor CLI</span>
                <CodeSnippet
                  id="cap1"
                  code={`npm install @capacitor/core @capacitor/cli @capacitor/android`}
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Step 2: Initialize Capacitor config</span>
                <CodeSnippet
                  id="cap2"
                  code={`npx cap init "Nadir AI" "com.nadir.ai" --web-dir=dist`}
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Step 3: Build web assets & add Android</span>
                <CodeSnippet
                  id="cap3"
                  code={`npm run build\nnpx cap add android`}
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Step 4: Add Permissions to AndroidManifest.xml</span>
                <p className="text-[11px] text-slate-400">
                  Open <code>android/app/src/main/AndroidManifest.xml</code> and add:
                </p>
                <CodeSnippet
                  id="cap4"
                  code={`<uses-permission android:name="android.permission.INTERNET" />\n<uses-permission android:name="android.permission.RECORD_AUDIO" />\n<uses-permission android:name="android.permission.CAMERA" />\n<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />`}
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-slate-200">Step 5: Generate Signed APK</span>
                <CodeSnippet
                  id="cap5"
                  code={`npx cap open android\n# In Android Studio: Build > Generate Signed Bundle / APK > APK`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all min-h-[44px]"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
