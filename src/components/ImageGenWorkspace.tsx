import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Maximize2,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Layers,
  MessageSquare,
  X,
} from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageGenWorkspaceProps {
  onImageGenerated: (image: GeneratedImage) => void;
  savedImages: GeneratedImage[];
  onDiscussInChat?: (imageUrl: string, prompt: string) => void;
}

export const ImageGenWorkspace: React.FC<ImageGenWorkspaceProps> = ({
  onImageGenerated,
  savedImages,
  onDiscussInChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<GeneratedImage | null>(
    savedImages.length > 0 ? savedImages[0] : null
  );
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const aspectRatios = [
    { label: '1:1 Square', value: '1:1', icon: '■' },
    { label: '16:9 Landscape', value: '16:9', icon: '▬' },
    { label: '9:16 Story / Mobile', value: '9:16', icon: '❚' },
    { label: '4:3 Standard', value: '4:3', icon: '▭' },
    { label: '3:4 Portrait', value: '3:4', icon: '▯' },
  ];

  const promptIdeas = [
    'A majestic crystal phoenix rising from iridescent volcanic embers, cinematic lighting, 8k',
    'Futuristic eco-architecture skyscraper covered in hanging vertical rainforest gardens in golden hour',
    'Retro cyberpunk tea house in Kyoto with neon holograms and gentle rain reflections',
    'A hyper-detailed mechanical watch movement with luminous sapphire gears and intricate brass tourbillon',
  ];

  const handleGenerate = async (targetPrompt?: string) => {
    const finalPrompt = targetPrompt || prompt;
    if (!finalPrompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setErrorDetail(null);

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt.trim(),
          aspectRatio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      if (!data.imageUrl) {
        throw new Error(data.detail || 'No image was returned from the model.');
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        prompt: finalPrompt.trim(),
        aspectRatio,
        imageUrl: data.imageUrl,
        createdAt: Date.now(),
      };

      setCurrentResult(newImage);
      onImageGenerated(newImage);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Image generation failed.');
      if (err.message?.includes('API key') || err.message?.includes('paid')) {
        setErrorDetail('The selected image generation model requires an active Gemini API key with image capabilities.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, promptText: string) => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `nadir-ai-${promptText.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
              AI Image Studio
            </h1>
          </div>
          <p className="mt-1 text-xs md:text-sm text-slate-400">
            Generate high-fidelity imagery using Gemini's native image synthesis engine.
          </p>
        </div>
      </div>

      {/* Generation Workspace Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Prompting & Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Prompt Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Image Description / Prompt
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create with details on subject, atmosphere, lighting, and style..."
                rows={4}
                className="w-full p-3.5 bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl text-sm text-slate-100 placeholder:text-slate-500 outline-hidden transition-all resize-none"
              />
            </div>
          </div>

          {/* Prompt Inspiration Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-400">Prompt Ideas:</span>
            <div className="flex flex-wrap gap-1.5">
              {promptIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(idea);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-[11px] border border-slate-700/60 hover:border-indigo-500/40 transition-colors text-left truncate max-w-full"
                >
                  {idea.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Aspect Ratio
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {aspectRatios.map((ar) => (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => setAspectRatio(ar.value)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                    aspectRatio === ar.value
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <span className="text-base leading-none">{ar.icon}</span>
                  <span className="text-[10px] whitespace-nowrap">{ar.value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-indigo-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 min-h-[48px]"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Image with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Artwork</span>
              </>
            )}
          </button>

          {/* Error display */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Generation Error</span>
              </div>
              <p>{error}</p>
              {errorDetail && <p className="text-[11px] text-rose-400/80">{errorDetail}</p>}
            </div>
          )}
        </div>

        {/* Right Column: Canvas Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-4">
            {isGenerating ? (
              <div className="text-center space-y-4 p-8 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20 animate-spin-slow">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-slate-100 text-sm">Synthesizing Pixels...</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Gemini model is rendering your concept with {aspectRatio} proportions.
                  </p>
                </div>
              </div>
            ) : currentResult ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img
                  src={currentResult.imageUrl}
                  alt={currentResult.prompt}
                  className="max-h-[460px] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                />

                {/* Floating overlay actions */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
                  <button
                    onClick={() => handleDownload(currentResult.imageUrl, currentResult.prompt)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => setFullscreenImage(currentResult.imageUrl)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    <Maximize2 className="w-4 h-4 text-purple-400" />
                    <span>Expand</span>
                  </button>

                  <button
                    onClick={() => handleCopyPrompt(currentResult.prompt)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[40px]"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
                  </button>

                  {onDiscussInChat && (
                    <button
                      onClick={() => onDiscussInChat(currentResult.imageUrl, currentResult.prompt)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[40px]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Discuss in Chat</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500 space-y-3">
                <Layers className="w-12 h-12 mx-auto opacity-30 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-300">Ready to Create</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter a prompt and select an aspect ratio to generate your first image.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session History Gallery */}
      {savedImages.length > 0 && (
        <div className="pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recent Creations</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {savedImages.map((img) => (
              <div
                key={img.id}
                onClick={() => setCurrentResult(img)}
                className={`group relative rounded-2xl overflow-hidden aspect-square border cursor-pointer transition-all ${
                  currentResult?.id === img.id
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={img.imageUrl}
                  alt={img.prompt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                  <p className="text-[10px] text-white line-clamp-2 leading-tight">
                    {img.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Expanded artwork"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
