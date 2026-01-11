export const generateOtp = (): string => {
  if (process.env.static_otp && process.env.static_otp === 'true') {
    return '999999';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * AI Provider types
 */
export enum AIProvider {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  GROQ = 'groq',
}

/**
 * Interface for AI response
 */
export interface AIResponse {
  content: string;
  error?: string;
}

/**
 * Call OpenAI API
 */
export async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string = 'gpt-4o-mini',
  temperature: number = 0.3,
  maxTokens: number = 4000, // Increased default to handle larger JSON responses
): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a product data parser. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData?.error?.message || 'Unknown error'}`,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List available Gemini models
 */
export async function listGeminiModels(apiKey: string): Promise<{
  models?: Array<{
    name: string;
    displayName: string;
    supportedGenerationMethods: string[];
  }>;
  error?: string;
}> {
  if (!apiKey) {
    return { error: 'Gemini API key not configured' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: `Gemini API error: ${errorData?.error?.message || 'Unknown error'}`,
      };
    }

    const data = await response.json();
    return { models: data.models || [] };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Call Google Gemini API
 */
export async function callGemini(
  prompt: string,
  apiKey: string,
  model: string = 'gemini-1.5-flash',
  temperature: number = 0.3,
  maxTokens: number = 4000, // Increased default to handle larger JSON responses
): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a product data parser. Always respond with valid JSON only.\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error?.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(`Gemini API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    // Check for finish reason to detect truncation
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === 'MAX_TOKENS') {
      return {
        content: '',
        error: 'Response was truncated due to max_tokens limit. Try increasing max_tokens.',
      };
    }
    
    if (finishReason === 'SAFETY') {
      return {
        content: '',
        error: 'Response was blocked due to safety filters.',
      };
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      // Check for error in response
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
      }
      throw new Error('No response from Gemini');
    }

    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Call Groq API (OpenAI-compatible)
 */
export async function callGroq(
  prompt: string,
  apiKey: string,
  model: string = 'llama-3.1-70b-versatile',
  temperature: number = 0.3,
  maxTokens: number = 4000,
): Promise<AIResponse> {
  if (!apiKey) {
    throw new Error('Groq API key not configured');
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a product data parser. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData?.error?.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(`Groq API error: ${errorMessage}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      // Check for finish reason
      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === 'length') {
        return {
          content: '',
          error: 'Response was truncated due to max_tokens limit. Try increasing max_tokens.',
        };
      }
      throw new Error('No response from Groq');
    }

    return { content };
  } catch (error) {
    return {
      content: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unified AI call function that routes to the appropriate provider
 */
export async function callAI(
  provider: AIProvider,
  prompt: string,
  apiKey: string,
  model?: string,
  temperature?: number,
  maxTokens?: number,
): Promise<AIResponse> {
  switch (provider) {
    case AIProvider.OPENAI:
      return callOpenAI(prompt, apiKey, model, temperature, maxTokens);
    case AIProvider.GEMINI:
      return callGemini(prompt, apiKey, model, temperature, maxTokens);
    case AIProvider.GROQ:
      return callGroq(prompt, apiKey, model, temperature, maxTokens);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
