/**
 * Image Generation API
 *
 * Handles generation of image prompts/tags for background images
 * and CG (Computer Graphics) scenes in the visual novel.
 *
 * Note: This module generates PROMPTS for image generation,
 * not the actual images. The actual image generation is handled
 * by the ImageDeck component through the Tavern Helper API.
 */

import { callSecondApi, type SecondApiMessage } from './secondApiClient';
import { PROMPT_IMAGE_TAG } from '../../allPrompts';

/**
 * Image type for generation
 */
export type ImageType = 'background' | 'cg';

/**
 * Style presets for image generation
 */
export type ImageStyle =
  | 'realistic'
  | 'anime'
  | 'oil_painting'
  | 'watercolor'
  | 'sketch'
  | 'pixel_art'
  | 'illustration';

export interface ImageTagGenerationOptions {
  /** Scene title/description */
  title: string;
  /** Scene type */
  type: ImageType;
  /** Desired art style */
  style?: ImageStyle;
  /** Additional context or mood description */
  mood?: string;
  /** Characters involved (for CG) */
  characters?: string[];
  /** Whether to include specific lighting suggestions */
  includeLighting?: boolean;
  /** Whether to include quality modifiers */
  includeQualityModifiers?: boolean;
}

export interface ImageTagGenerationResult {
  success: boolean;
  /** Generated image prompt */
  prompt: string;
  /** Parsed prompt segments (for potential modification) */
  segments?: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Generate image prompt based on scene description
 *
 * @param options - Generation options
 * @returns Generated image prompt
 *
 * @example
 * ```typescript
 * const result = await generateImagePrompt({
 *   title: '教室黄昏',
 *   type: 'background',
 *   style: 'anime',
 *   mood: 'romantic and nostalgic'
 * });
 *
 * if (result.success) {
 *   console.log('Generated prompt:', result.prompt);
 * }
 * ```
 */
export async function generateImagePrompt(
  options: ImageTagGenerationOptions
): Promise<ImageTagGenerationResult> {
  const {
    title,
    type,
    style = 'anime',
    mood,
    characters,
    includeLighting = true,
    includeQualityModifiers = true,
  } = options;

  const systemPrompt = type === 'background' ? PROMPT_IMAGE_TAG : PROMPT_IMAGE_TAG;

  // Build user message
  let userMessage = `Scene Title: "${title}"\n`;
  userMessage += `Type: ${type === 'background' ? 'Background Scene' : 'CG (Special Scene)'}\n`;
  userMessage += `Requested Style: ${style}\n`;

  if (mood) {
    userMessage += `Mood/Atmosphere: ${mood}\n`;
  }

  if (characters && characters.length > 0) {
    userMessage += `Characters: ${characters.join(', ')}\n`;
  }

  if (includeLighting) {
    userMessage += '\nInclude specific lighting suggestions.\n';
  }

  if (includeQualityModifiers) {
    userMessage += '\nEnd with quality modifiers like "4k, high detail, masterpiece".\n';
  }

  userMessage += '\nGenerate a detailed image generation prompt in English:';

  const response = await callSecondApi('imageTag', systemPrompt, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      prompt: '',
      error: response.error ?? 'Failed to generate image prompt',
    };
  }

  // Clean up the generated prompt
  const prompt = response.content
    .trim()
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\n/g, ', ') // Replace newlines with commas
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return {
    success: true,
    prompt,
    segments: prompt.split(',').map(s => s.trim()).filter(s => s.length > 0),
  };
}

/**
 * Generate multiple image prompt variations
 *
 * @param options - Generation options
 * @param count - Number of variations to generate
 * @returns Array of generated prompts
 *
 * @example
 * ```typescript
 * const results = await generateImagePromptVariations({
 *   title: '教室黄昏',
 *   type: 'background',
 *   style: 'anime'
 * }, 3);
 *
 * results.forEach((result, index) => {
 *   console.log(`Variation ${index + 1}:`, result.prompt);
 * });
 * ```
 */
export async function generateImagePromptVariations(
  options: ImageTagGenerationOptions,
  count: number = 3
): Promise<ImageTagGenerationResult[]> {
  const systemPrompt = options.type === 'background' ? PROMPT_IMAGE_TAG : PROMPT_IMAGE_TAG;

  let userMessage = `Generate ${count} different image prompts for the same scene.\n\n`;
  userMessage += `Scene Title: "${options.title}"\n`;
  userMessage += `Type: ${options.type === 'background' ? 'Background Scene' : 'CG (Special Scene)'}\n`;
  userMessage += `Style: ${options.style}\n`;

  if (options.mood) {
    userMessage += `Mood: ${options.mood}\n`;
  }

  userMessage += '\nProvide different interpretations/variations of the scene.\n';
  userMessage += 'Format each prompt on a separate line, numbered 1-3.';

  const response = await callSecondApi('imageTag', systemPrompt, userMessage);

  if (!response.success || !response.content) {
    return Array(count).fill({
      success: false,
      prompt: '',
      error: response.error ?? 'Failed to generate image prompts',
    });
  }

  // Parse multiple prompts
  const lines = response.content.split(/\n/).filter(line => line.trim());
  const prompts: ImageTagGenerationResult[] = [];

  for (const line of lines) {
    // Remove numbering like "1.", "2.", etc.
    const cleaned = line.replace(/^[0-9]+[.)]\s*/, '').trim();

    if (cleaned.length > 20) {
      prompts.push({
        success: true,
        prompt: cleaned.replace(/\s+/g, ', ').trim(),
        segments: cleaned.split(',').map(s => s.trim()).filter(s => s.length > 0),
      });
    }
  }

  // Ensure we have the requested count
  while (prompts.length < count) {
    prompts.push({
      success: false,
      prompt: '',
      error: 'Failed to parse all variations',
    });
  }

  return prompts.slice(0, count);
}

/**
 * Refine an existing image prompt
 *
 * @param originalPrompt - The original prompt to refine
 * @param refinement - What to change ('more_detailed', 'different_style', 'brighter', 'darker', etc.)
 * @returns Refined prompt
 *
 * @example
 * ```typescript
 * const result = await refineImagePrompt(
 *   'classroom, sunset, anime style',
 *   'more_detailed'
 * );
 * ```
 */
export async function refineImagePrompt(
  originalPrompt: string,
  refinement: 'more_detailed' | 'different_style' | 'brighter' | 'darker' | 'more_vibrant' | 'simpler'
): Promise<ImageTagGenerationResult> {
  const refinementInstructions = {
    more_detailed: 'Add more detail and specificity to every element.',
    different_style: 'Restyle to a completely different art style.',
    brighter: 'Adjust lighting to be much brighter and more cheerful.',
    darker: 'Adjust lighting to be darker and more dramatic/mysterious.',
    more_vibrant: 'Make colors more saturated and vibrant.',
    simpler: 'Simplify the prompt while keeping the essence.',
  };

  const userMessage = `Original prompt:\n"${originalPrompt}"\n\nRefinement request: ${refinementInstructions[refinement]}\n\nProvide the refined prompt in English:`;

  const response = await callSecondApi('imageTag', PROMPT_IMAGE_TAG, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      prompt: originalPrompt, // Fallback to original
      error: response.error ?? 'Failed to refine prompt',
    };
  }

  return {
    success: true,
    prompt: response.content.trim().replace(/^["']|["']$/g, '').replace(/\s+/g, ' ').trim(),
  };
}

/**
 * Generate image prompt from chat context
 *
 * @param chatHistory - Recent chat messages
 * @param type - Image type
 * @param style - Desired style
 * @returns Generated prompt
 */
export async function generateImagePromptFromHistory(
  chatHistory: SecondApiMessage[],
  type: ImageType,
  style: ImageStyle = 'anime'
): Promise<ImageTagGenerationResult> {
  const systemPrompt = type === 'background' ? PROMPT_IMAGE_TAG : PROMPT_IMAGE_TAG;

  const historyText = chatHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  const userMessage = `Based on this recent dialogue, generate an image prompt:\n\n${historyText}\n\nType: ${type === 'background' ? 'Background' : 'CG'}\nStyle: ${style}\n\nGenerate a detailed English prompt:`;

  const response = await callSecondApi('imageTag', systemPrompt, userMessage);

  if (!response.success || !response.content) {
    return {
      success: false,
      prompt: '',
      error: response.error ?? 'Failed to generate image prompt from history',
    };
  }

  return {
    success: true,
    prompt: response.content
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}
