/**
 * Second API Client
 *
 * Unified API client for calling external AI services (OpenAI-compatible APIs)
 * for tasks like danmaku generation, image tag generation, shop item generation,
 * riddle generation, system personality chat, and board game event generation.
 */

import { useVNStore } from '../../store';

export interface SecondApiConfig {
  /** Base URL of the API endpoint */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Model identifier */
  model: string;
  /** Temperature for generation (0-2) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Top P sampling parameter */
  topP?: number;
  /** Top K sampling parameter */
  topK?: number;
}

export interface SecondApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type SecondApiTask =
  | 'danmaku'
  | 'imageTag'
  | 'shop'
  | 'riddle'
  | 'comms'
  | 'boardGameEvent'
  | 'dispatchStory';

export interface SecondApiPayload {
  contentText?: string;
  keyword?: string;
  lastMessage?: string;
  chatHistory?: string;
  ordered_prompts?: SecondApiMessage[];
  injects?: Array<{
    depth: number;
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

export interface SecondApiResponse {
  /** Whether the request was successful */
  success: boolean;
  /** The generated content */
  content?: string;
  /** Error message if failed */
  error?: string;
  /** Tokens used (if available) */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

const SECOND_API_TIMEOUT_MS = 30000;
const SECOND_API_RETRY_COUNT = 2;

/**
 * Get API configuration from store settings
 */
export function getSecondApiConfig(): SecondApiConfig | null {
  const store = useVNStore();
  const settings = store.settings;

  if (!settings.secondApiUrl || !settings.secondApiKey || !settings.secondApiModel) {
    return null;
  }

  return {
    baseUrl: settings.secondApiUrl,
    apiKey: settings.secondApiKey,
    model: settings.secondApiModel,
    temperature:
      settings.secondApiTemperature === 'unset' ? undefined : (settings.secondApiTemperature as number),
    maxTokens:
      settings.secondApiMaxTokens === 'unset' ? undefined : (settings.secondApiMaxTokens as number),
    topP: settings.secondApiTopP === 'unset' ? undefined : (settings.secondApiTopP as number),
    topK: settings.secondApiTopK === 'unset' ? undefined : (settings.secondApiTopK as number),
  };
}

/**
 * Build headers for the API request
 */
function buildHeaders(config: SecondApiConfig): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key as Bearer token (common pattern)
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  // Add custom headers for specific API providers
  if (config.baseUrl.includes('openai.com')) {
    // OpenAI format
    headers['api-key'] = config.apiKey;
  } else if (config.baseUrl.includes('anthropic')) {
    // Anthropic format
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  return headers;
}

/**
 * Build the request body for OpenAI-compatible API
 */
function buildRequestBody(
  config: SecondApiConfig,
  systemPrompt: string,
  userMessage: string
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    stream: false,
  };

  if (config.temperature !== undefined) {
    body.temperature = config.temperature;
  }

  if (config.maxTokens !== undefined) {
    body.max_tokens = config.maxTokens;
  }

  if (config.topP !== undefined) {
    body.top_p = config.topP;
  }

  if (config.topK !== undefined) {
    body.top_k = config.topK;
  }

  return body;
}

/**
 * Parse response content from API
 */
function parseResponseContent(data: Record<string, unknown>): string | null {
  // OpenAI format
  if (data.choices && Array.isArray(data.choices) && data.choices.length > 0) {
    const choice = data.choices[0] as Record<string, unknown>;
    if (choice.message && typeof choice.message === 'object') {
      const message = choice.message as Record<string, unknown>;
      if (typeof message.content === 'string') {
        return message.content;
      }
    }
  }

  // Anthropic format
  if (data.content && Array.isArray(data.content) && data.content.length > 0) {
    const content = data.content[0] as Record<string, unknown>;
    if (content.type === 'text' && typeof content.text === 'string') {
      return content.text;
    }
  }

  return null;
}

/**
 * Call the second API with retry logic
 *
 * @param task - The task type for logging
 * @param systemPrompt - System prompt to guide the AI
 * @param userMessage - User message content
 * @param retries - Number of retry attempts
 * @returns API response
 *
 * @example
 * ```typescript
 * const response = await callSecondApi('danmaku', danmakuSystemPrompt, userContent);
 * if (response.success && response.content) {
 *   console.log('Generated danmaku:', response.content);
 * }
 * ```
 */
export async function callSecondApi(
  task: SecondApiTask,
  systemPrompt: string,
  userMessage: string,
  retries: number = SECOND_API_RETRY_COUNT
): Promise<SecondApiResponse> {
  const config = getSecondApiConfig();

  if (!config) {
    return {
      success: false,
      error: 'Second API not configured. Please set URL, API Key, and Model in settings.',
    };
  }

  console.info(`[SecondAPI] Calling ${task} API...`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SECOND_API_TIMEOUT_MS);

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(buildRequestBody(config, systemPrompt, userMessage)),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const content = parseResponseContent(data);

      if (content === null) {
        throw new Error('Failed to parse API response');
      }

      console.info(`[SecondAPI] ${task} generated successfully`);

      return {
        success: true,
        content: content.trim(),
        usage: data.usage as SecondApiResponse['usage'],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(`[SecondAPI] ${task} attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < retries && !(error instanceof Error && error.name === 'AbortError')) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message ?? 'Unknown error occurred',
  };
}

/**
 * Call second API with ordered prompts (for multi-turn conversations)
 *
 * @param task - The task type for logging
 * @param orderedPrompts - Array of messages in order
 * @param systemPrompt - Optional system prompt
 * @param retries - Number of retry attempts
 * @returns API response
 *
 * @example
 * ```typescript
 * const response = await callSecondApiWithHistory('shop', [
 *   { role: 'system', content: 'You are a shop keeper...' },
 *   { role: 'user', content: 'Show me your wares' },
 *   { role: 'assistant', content: 'I have several items...' }
 * ]);
 * ```
 */
export async function callSecondApiWithHistory(
  task: SecondApiTask,
  orderedPrompts: SecondApiMessage[],
  systemPrompt?: string,
  retries: number = SECOND_API_RETRY_COUNT
): Promise<SecondApiResponse> {
  const config = getSecondApiConfig();

  if (!config) {
    return {
      success: false,
      error: 'Second API not configured. Please set URL, API Key, and Model in settings.',
    };
  }

  console.info(`[SecondAPI] Calling ${task} API with history...`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SECOND_API_TIMEOUT_MS);

      const messages: SecondApiMessage[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push(...orderedPrompts);

      const body: Record<string, unknown> = {
        model: config.model,
        messages,
        stream: false,
      };

      if (config.temperature !== undefined) body.temperature = config.temperature;
      if (config.maxTokens !== undefined) body.max_tokens = config.maxTokens;
      if (config.topP !== undefined) body.top_p = config.topP;
      if (config.topK !== undefined) body.top_k = config.topK;

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: buildHeaders(config),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const content = parseResponseContent(data);

      if (content === null) {
        throw new Error('Failed to parse API response');
      }

      console.info(`[SecondAPI] ${task} with history generated successfully`);

      return {
        success: true,
        content: content.trim(),
        usage: data.usage as SecondApiResponse['usage'],
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      console.warn(`[SecondAPI] ${task} with history attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < retries && !(error instanceof Error && error.name === 'AbortError')) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message ?? 'Unknown error occurred',
  };
}

/**
 * Check if second API is configured and available
 */
export function isSecondApiAvailable(): boolean {
  return getSecondApiConfig() !== null;
}
