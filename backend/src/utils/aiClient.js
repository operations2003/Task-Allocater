import { config } from '../config/index.js';

/**
 * TaskNera Multi-Model AI Service Client (OpenAI & Gemini)
 * Uses native fetch with cascading fallback and zero runtime dependencies.
 */
export const aiClient = {
  /**
   * Generate text using OpenAI
   */
  async generateWithOpenAI(prompt, systemPrompt = 'You are the TaskNera Executive AI Task Allocation Engine.') {
    const apiKey = config.ai.openaiApiKey;
    if (!apiKey) throw new Error('OpenAI API key not configured.');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${res.status}): ${errData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim();
  },

  /**
   * Generate text using Gemini
   */
  async generateWithGemini(prompt, systemInstruction = 'You are the TaskNera Executive AI Task Allocation Engine.') {
    const apiKey = config.ai.geminiApiKey;
    if (!apiKey) throw new Error('Gemini API key not configured.');

    const models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-pro-latest'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: `${systemInstruction}\n\nTask: ${prompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 500,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) return text;
        }
      } catch {
        // Continue to next model in loop
      }
    }

    throw new Error('All configured Gemini models are currently busy or unavailable.');
  },

  /**
   * Unified AI completion with cascading fallback: OpenAI -> Gemini -> Heuristic Engine
   */
  async generateCompletion(prompt, systemPrompt) {
    // 1. Try OpenAI if key is present
    if (config.ai.openaiApiKey) {
      try {
        const text = await this.generateWithOpenAI(prompt, systemPrompt);
        if (text) return { text, provider: 'OpenAI' };
      } catch (err) {
        console.warn('⚠️ OpenAI invocation note:', err.message);
      }
    }

    // 2. Fallback to Gemini if key is present
    if (config.ai.geminiApiKey) {
      try {
        const text = await this.generateWithGemini(prompt, systemPrompt);
        if (text) return { text, provider: 'Gemini' };
      } catch (err) {
        console.warn('⚠️ Gemini invocation note:', err.message);
      }
    }

    return null;
  },
};
