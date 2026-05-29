import { createVNLogger } from './vnLogger';

const vnLog = createVNLogger('[VN]');

export type ThemeDiff = {
  missing: string[];
  overridden: Array<{ key: string; from: string | null; to: string }>;
  presentCount: number;
};

export function snapshotThemeVars(keys: string[], root: HTMLElement = document.documentElement): Record<string, string> {
  const styles = getComputedStyle(root);
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = styles.getPropertyValue(k).trim();
  return out;
}

export function diffThemeVars(
  keys: string[],
  before: Record<string, string>,
  after: Record<string, string>,
): ThemeDiff {
  const missing: string[] = [];
  const overridden: Array<{ key: string; from: string | null; to: string }> = [];

  let presentCount = 0;
  for (const k of keys) {
    const a = after[k];
    if (!a) missing.push(k);
    else presentCount++;

    const b = before[k];
    if (a !== b) overridden.push({ key: k, from: b || null, to: a });
  }

  return { missing, overridden, presentCount };
}

export function logThemeVarDiff(label: string, keys: string[], before: Record<string, string>, after: Record<string, string>) {
  const diff = diffThemeVars(keys, before, after);
  vnLog.info('theme', label, {
    presentCount: diff.presentCount,
    missing: diff.missing,
    overriddenCount: diff.overridden.length,
    overridden: diff.overridden.slice(0, 20),
  });
}
