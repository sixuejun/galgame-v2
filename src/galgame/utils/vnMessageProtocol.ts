import type { MessageBlock } from '../types/message';
import type { MessageParseResult } from '../types/parser';
import { parseMessageBlocks } from './messageParser';

export function parseAssistantMessageToBlocks(message: string): MessageParseResult<MessageBlock> {
  const contentMatch = message.match(/<content>([\s\S]*?)<\/content>/);
  const content = contentMatch ? contentMatch[1].trim() : '';
  if (!content) return { status: 'noContent', content: '', blocks: [] };

  try {
    const blocks = parseMessageBlocks(content);
    if (!blocks || blocks.length === 0) {
      return { status: 'invalidFormat', content, blocks: [], error: 'noBlocks' };
    }
    return { status: 'ok', content, blocks };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 'invalidFormat', content, blocks: [], error: msg || 'parseFailed' };
  }
}
