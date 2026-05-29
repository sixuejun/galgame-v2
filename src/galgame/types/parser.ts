export type MessageParseStatus = 'ok' | 'noContent' | 'invalidFormat';

export type MessageParseResult<TBlock> =
  | { status: 'noContent'; content: ''; blocks: []; error?: undefined }
  | { status: 'invalidFormat'; content: string; blocks: []; error: string }
  | { status: 'ok'; content: string; blocks: TBlock[]; error?: undefined };
