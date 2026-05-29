/**
 * Danmaku Generation API
 *
 * Handles generation of danmaku (弹幕) - scrolling comments
 * that simulate audience reactions during visual novel playback.
 */

import { callSecondApi, type SecondApiMessage } from './secondApiClient';
import { PROMPT_DANMAKU } from '../../allPrompts';

export interface DanmakuGenerationOptions {
  /** Scene context for generating relevant danmaku */
  sceneContext?: string;
  /** Character name if applicable */
  characterName?: string;
  /** Dialogue text if applicable */
  dialogueText?: string;
  /** Number of danmaku to generate (default: 3-5) */
  count?: number;
  /** Whether to include character name references */
  includeCharacterRefs?: boolean;
}

export interface DanmakuGenerationResult {
  success: boolean;
  /** Array of generated danmaku strings */
  danmaku: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Parse generated text into individual danmaku items
 */
function parseDanmakuText(text: string): string[] {
  // Split by newlines and filter empty lines
  const lines = text
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Remove common prefixes like "1.", "2.", "-", "•", etc.
  const cleaned = lines.map(line => {
    // Remove numbered list format: "1. xxx" or "1) xxx"
    return line.replace(/^[0-9]+[.)]\s*/, '').trim();
  });

  return cleaned.filter(line => line.length > 0 && line.length <= 30);
}

/**
 * Generate danmaku based on scene content
 *
 * @param options - Generation options
 * @returns Array of generated danmaku strings
 *
 * @example
 * ```typescript
 * const result = await generateDanmaku({
 *   sceneContext: 'A romantic sunset scene where the main character confesses their love',
 *   characterName: 'Alice',
 *   dialogueText: 'I have always loved you...',
 *   count: 4
 * });
 *
 * if (result.success) {
 *   result.danmaku.forEach(dm => store.addDanmaku(dm));
 * }
 * ```
 */
export async function generateDanmaku(
  options: DanmakuGenerationOptions = {}
): Promise<DanmakuGenerationResult> {
  const {
    sceneContext = '',
    characterName,
    dialogueText,
    count = 4,
  } = options;

  // Build user message with context
  let userMessage = '';
  if (sceneContext) {
    userMessage += `Scene: ${sceneContext}\n`;
  }
  if (characterName) {
    userMessage += `Character: ${characterName}\n`;
  }
  if (dialogueText) {
    userMessage += `Dialogue: "${dialogueText}"\n`;
  }
  userMessage += `\nGenerate ${count} short danmaku comments (弹幕), one per line.`;

  const response = await callSecondApi('danmaku', PROMPT_DANMAKU, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      danmaku: [],
      error: response.error ?? 'Failed to generate danmaku',
    };
  }

  const danmaku = parseDanmakuText(response.content);

  return {
    success: true,
    danmaku,
  };
}

/**
 * Generate danmaku from chat history context
 *
 * @param chatHistory - Recent chat messages for context
 * @param options - Additional generation options
 * @returns Array of generated danmaku strings
 *
 * @example
 * ```typescript
 * const result = await generateDanmakuFromHistory([
 *   { role: 'assistant', content: 'Alice: I have loved you since we first met...' },
 *   { role: 'user', content: 'Player: Really? I had no idea!' }
 * ]);
 * ```
 */
export async function generateDanmakuFromHistory(
  chatHistory: SecondApiMessage[],
  options: DanmakuGenerationOptions = {}
): Promise<DanmakuGenerationResult> {
  const { count = 4 } = options;

  // Format chat history for the prompt
  const historyText = chatHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const userMessage = `Recent dialogue:\n${historyText}\n\nGenerate ${count} short danmaku comments (弹幕) that viewers might type in response to this scene, one per line.`;

  const response = await callSecondApi('danmaku', PROMPT_DANMAKU, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      danmaku: [],
      error: response.error ?? 'Failed to generate danmaku',
    };
  }

  const danmaku = parseDanmakuText(response.content);

  return {
    success: true,
    danmaku,
  };
}

/**
 * Generate themed danmaku (e.g., all excited, all funny)
 *
 * @param theme - Theme for the danmaku
 * @param context - Scene context
 * @returns Array of generated danmaku strings
 */
export async function generateThemedDanmaku(
  theme: 'excited' | 'funny' | 'emotional' | 'meta' | 'spoilery',
  context: string
): Promise<DanmakuGenerationResult> {
  const themePrompts = {
    excited: 'Focus on generating very enthusiastic, excited reactions.',
    funny: 'Focus on generating humorous, meme-like comments.',
    emotional: 'Focus on generating emotional, touching reactions.',
    meta: 'Focus on generating meta-commentary about the storytelling.',
    spoilery: 'Focus on generating spoiler-type reactions (without actual spoilers).',
  };

  const themeSystemPrompt = `${PROMPT_DANMAKU}\n\n${themePrompts[theme]}`;

  const userMessage = `Scene: ${context}\n\nGenerate 4 short danmaku comments with a ${theme} tone, one per line.`;

  const response = await callSecondApi('danmaku', themeSystemPrompt, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      danmaku: [],
      error: response.error ?? 'Failed to generate themed danmaku',
    };
  }

  const danmaku = parseDanmakuText(response.content);

  return {
    success: true,
    danmaku,
  };
}
