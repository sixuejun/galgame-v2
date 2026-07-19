/**
 * 版本检查器
 *
 * # 目标
 * 每次脚本启动（或每 N 分钟）从 jsDelivr CDN 上 fetch 一份 version.json，
 * 与本地 BUILD_VERSION 比较：
 * - 一致 → jsDelivr 已同步，无需操作
 * - 不一致 → jsDelivr 上的版本更新了，window.location.reload() 拉取新代码
 * - 拉取失败 → 静默忽略，不影响正常使用
 *
 * # 部署约定
 * - 用户在自己 GitHub 仓库的 dist/galgame/version.json 维护一个简单 JSON：
 *   `{ "version": "2026-07-20-r3" }`
 * - jsDelivr URL：https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/dist/galgame/version.json
 * - 当前仓库与分支通过下方 REMOTE_VERSION_URL 常量配置
 *
 * # 为什么这个方案不依赖任何"用户配置"
 * 你只需要把仓库信息写进 REMOTE_VERSION_URL，存到 dist 的 version.json 由你维护即可。
 * 终端用户不需要任何额外操作。
 */

const REMOTE_VERSION_URL =
  'https://cdn.jsdelivr.net/gh/sixuejun/galgame-v2@main/version.json';

// 拉取远端 version.json 的间隔（毫秒）。脚本启动时立刻检查一次，
// 之后每 5 分钟再检查一次，覆盖用户长时间停留在酒馆里不刷新的场景。
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// 拉取超时（毫秒）。jsDelivr 在国内大部分地区 < 2s，超时即放弃。
const FETCH_TIMEOUT_MS = 8000;

export interface RemoteVersionInfo {
  /** 远端版本号（字符串，由用户自行约定） */
  version: string;
  /** 远端最后构建时间（可选，来自 version.json 的 buildTime 字段） */
  buildTime?: string;
  /** 远端 commit hash（可选） */
  commit?: string;
}

export type VersionSyncStatus = 'unknown' | 'synced' | 'outdated' | 'failed';

export interface VersionState {
  local: string;
  remote: RemoteVersionInfo | null;
  status: VersionSyncStatus;
  /** 上次检查的时间戳 */
  lastCheckedAt: number | null;
  /** 最近一次错误信息 */
  lastError: string | null;
}

/**
 * 拉取远端 version.json。失败返回 null 而不是抛出 —— 版本检查是辅助功能，
 * 网络问题不应阻塞脚本主流程。
 */
export async function fetchRemoteVersion(
  url: string = REMOTE_VERSION_URL,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<RemoteVersionInfo | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      cache: 'no-cache',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.info('[version-check] 远端 version.json 拉取失败 HTTP=', res.status, url);
      return null;
    }
    const data = (await res.json()) as Partial<RemoteVersionInfo>;
    if (typeof data.version !== 'string' || data.version.length === 0) {
      console.info('[version-check] 远端 version.json 缺少 version 字段', data);
      return null;
    }
    return {
      version: data.version,
      buildTime: typeof data.buildTime === 'string' ? data.buildTime : undefined,
      commit: typeof data.commit === 'string' ? data.commit : undefined,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.name + ': ' + err.message : String(err);
    console.info('[version-check] 远端 version.json 拉取异常:', detail);
    return null;
  }
}

/**
 * 对比本地版本与远端版本，判断是否需要 reload。
 * - 任一方缺失（local 为 BUILD_VERSION 的初始值或远端 fetch 失败）→ 不 reload
 * - 版本字符串严格相等 → 不 reload
 * - 不等 → reload
 */
export function shouldReload(localVersion: string, remoteVersion: string | null | undefined): boolean {
  if (!remoteVersion) return false;
  if (!localVersion || localVersion === '0.0.0') return false;
  return localVersion !== remoteVersion;
}

export interface VersionCheckerOptions {
  /** 当前脚本构建时硬编码的版本号 */
  localVersion: string;
  /**
   * 拿到状态时的回调。可用于驱动 UI 响应式更新。
   * 注意：回调可能在同步代码路径中触发，避免在回调里做重操作。
   */
  onState: (state: VersionState) => void;
  /** 决定要不要 reload 时触发 */
  onNeedReload?: (remote: RemoteVersionInfo) => void;
  /** 间隔检查时间（毫秒），默认 5 分钟 */
  intervalMs?: number;
  /** 拉取超时（毫秒） */
  fetchTimeoutMs?: number;
}

/**
 * 启动版本检查器：立即检查一次，然后每 N 分钟检查一次。
 * 返回一个停止函数。
 */
export function startVersionChecker(opts: VersionCheckerOptions): () => void {
  let state: VersionState = {
    local: opts.localVersion,
    remote: null,
    status: 'unknown',
    lastCheckedAt: null,
    lastError: null,
  };
  let stopped = false;

  const update = (patch: Partial<VersionState>) => {
    state = { ...state, ...patch };
    try {
      opts.onState(state);
    } catch (err) {
      console.warn('[version-check] onState 回调异常:', err);
    }
  };

  const runCheck = async () => {
    if (stopped) return;
    const remote = await fetchRemoteVersion(REMOTE_VERSION_URL, opts.fetchTimeoutMs ?? FETCH_TIMEOUT_MS);
    if (stopped) return;
    if (remote === null) {
      update({ status: 'failed', lastCheckedAt: Date.now(), lastError: 'fetch failed' });
      return;
    }
    const outdated = shouldReload(opts.localVersion, remote.version);
    update({
      remote,
      status: outdated ? 'outdated' : 'synced',
      lastCheckedAt: Date.now(),
      lastError: null,
    });
    if (outdated && opts.onNeedReload) {
      try {
        opts.onNeedReload(remote);
      } catch (err) {
        console.warn('[version-check] onNeedReload 回调异常:', err);
      }
    }
  };

  // 立即跑一次（不 await：避免阻塞外层 $(() => {}) 入口）
  void runCheck();
  // 定时跑
  const timer = setInterval(() => void runCheck(), opts.intervalMs ?? CHECK_INTERVAL_MS);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}