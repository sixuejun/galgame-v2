export type VNLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type VNLogEvent =
  | 'init'
  | 'streamToken'
  | 'generationEnded'
  | 'messageUpdated'
  | 'messageRendered'
  | 'parser'
  | 'nav'
  | 'secondApi'
  | 'theme'
  | 'action'
  | 'gameplay';

export type VNLogPayload = Record<string, unknown>;

export type VNLogger = {
  debug: (event: VNLogEvent, message: string, payload?: VNLogPayload) => void;
  info: (event: VNLogEvent, message: string, payload?: VNLogPayload) => void;
  warn: (event: VNLogEvent, message: string, payload?: VNLogPayload) => void;
  error: (event: VNLogEvent, message: string, payload?: VNLogPayload) => void;
  count: (key: string) => void;
  time: (key: string) => void;
  timeEnd: (key: string) => void;
};

function safePayload(payload?: VNLogPayload) {
  if (!payload) return undefined;
  try {
    // avoid Proxy / cyclic structures
    return JSON.parse(JSON.stringify(payload));
  } catch {
    return { payload_unserializable: true };
  }
}

export function createVNLogger(prefix = '[VN]'): VNLogger {
  function emit(level: VNLogLevel, event: VNLogEvent, message: string, payload?: VNLogPayload) {
    const fn =
      level === 'debug'
        ? console.debug
        : level === 'info'
          ? console.info
          : level === 'warn'
            ? console.warn
            : console.error;
    const p = safePayload(payload);
    if (p) fn(`${prefix}[${event}] ${message}`, p);
    else fn(`${prefix}[${event}] ${message}`);
  }

  return {
    debug: (event, message, payload) => emit('debug', event, message, payload),
    info: (event, message, payload) => emit('info', event, message, payload),
    warn: (event, message, payload) => emit('warn', event, message, payload),
    error: (event, message, payload) => emit('error', event, message, payload),
    count: key => console.count(`${prefix}[count] ${key}`),
    time: key => console.time(`${prefix}[time] ${key}`),
    timeEnd: key => console.timeEnd(`${prefix}[time] ${key}`),
  };
}
