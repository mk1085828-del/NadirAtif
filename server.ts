import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side GoogleGenAI initialization with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Nadir AI',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    models: {
      chat: 'gemini-flash-lite-latest / gemini-3.8-flash',
      vision: 'gemini-flash-lite-latest',
      imageGeneration: 'gemini-3.1-flash-lite-image / vector studio',
      tts: 'gemini-3.8-flash-lite-tts',
    },
  });
});

// API: Smart Multilingual Text & Vision Chat (Streaming SSE)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, temperature = 0.7 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please add it to your environment variables or Secrets panel.',
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    // Format contents for @google/genai
    const contents = messages.map((m: any) => {
      const parts: any[] = [];
      if (m.image) {
        const cleanBase64 = m.image.data.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: m.image.mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      if (m.content) {
        parts.push({ text: m.content });
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: parts.length > 0 ? parts : [{ text: '' }],
      };
    });

    const defaultSystemPrompt = `You are Nadir AI, a world-class, exceptionally intelligent, friendly, and modern AI assistant.
Your capabilities:
1. Multilingual fluency: You are fluent in English, Urdu (اردو), Roman Urdu (e.g., "aap kaise hain", "yeh samjhayein"), Hindi, Arabic, Spanish, French, German, Chinese, Japanese, and more. Always respond in the language or script the user greets or asks you in, unless instructed otherwise.
2. Structure and clarity: Use elegant Markdown, bullet points, headers, and clear explanations.
3. Code and Math: Format code blocks with language identifiers. Explain code cleanly. Show step-by-step logic for math, science, and reasoning.
4. Voice & Conversation: When users ask short questions or engage in voice mode, keep answers concise, punchy, conversational, and articulate without unpronounceable symbols.
5. Empathy & Tone: Always remain helpful, encouraging, courteous, and polite. Never output placeholder or fabricated data.`;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-flash-lite-latest',
        contents,
        config: {
          systemInstruction: systemInstruction || defaultSystemPrompt,
          temperature: Number(temperature) || 0.7,
        },
      });
    } catch (err: any) {
      console.warn('Primary model error, falling back to gemini-3.8-flash:', err.message);
      responseStream = await ai.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: systemInstruction || defaultSystemPrompt,
          temperature: Number(temperature) || 0.7,
        },
      });
    }

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Chat generation error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Error occurred during generation' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Streaming failed' })}\n\n`);
      res.end();
    }
  }
});

// API: Image Understanding & Analysis
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = 'Please describe this image in detail and answer any relevant questions about it.' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze image' });
  }
});

// API: AI Image Generation
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1' } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Image prompt is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    let imageUrl = '';
    let explanation = '';

    // 1. Try native raster image generation
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: prompt.trim() }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            explanation += part.text;
          }
        }
      }
    } catch (err: any) {
      console.warn('Native image generation model notice:', err.message);
    }

    // 2. High-fidelity vector artwork synthesis fallback
    if (!imageUrl) {
      const aspectDims: Record<string, { w: number; h: number }> = {
        '1:1': { w: 800, h: 800 },
        '16:9': { w: 1280, h: 720 },
        '9:16': { w: 720, h: 1280 },
        '4:3': { w: 1024, h: 768 },
        '3:4': { w: 768, h: 1024 },
      };
      const dims = aspectDims[aspectRatio] || { w: 800, h: 800 };

      const vectorRes = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: `You are an elite vector artist and UI designer. Create an exceptional, ultra-rich, modern SVG illustration for the prompt: "${prompt.trim()}".
Dimensions: viewBox="0 0 ${dims.w} ${dims.h}" width="${dims.w}" height="${dims.h}".
Include rich gradient definitions (<defs><linearGradient> and <radialGradient>), glowing filter effects, elegant layered geometry, subtle background gradients, and clean styling.
Output ONLY valid SVG code. No explanations, no markdown tags.`,
      });

      let svgCode = vectorRes.text?.trim() || '';
      svgCode = svgCode.replace(/```(?:xml|svg)?/g, '').replace(/```/g, '').trim();
      const match = svgCode.match(/<svg[\s\S]*<\/svg>/);
      if (match) {
        svgCode = match[0];
      }
      if (svgCode.startsWith('<svg')) {
        const base64Svg = Buffer.from(svgCode).toString('base64');
        imageUrl = `data:image/svg+xml;base64,${base64Svg}`;
        explanation = 'Artwork generated via Nadir AI Studio vector engine.';
      }
    }

    if (!imageUrl) {
      return res.status(422).json({
        error: 'Failed to synthesize image output.',
        detail: explanation || 'Please refine your prompt with more descriptive visual details.',
      });
    }

    res.json({
      imageUrl,
      prompt,
      aspectRatio,
      explanation,
    });
  } catch (error: any) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate image',
      statusCode: error.status || 500,
    });
  }
});

// API: Neural Text-To-Speech
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Zephyr', style = 'Warm, friendly, clear conversational tone' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const cleanText = text.replace(/[*#`_~[\]()]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000);

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Zephyr';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio returned from speech synthesis.' });
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (error: any) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
  }
});

// Mount Vite in dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Nadir AI Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
