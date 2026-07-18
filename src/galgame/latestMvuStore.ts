import { defineStore } from 'pinia';
import { klona } from 'klona';
import _ from 'lodash';

export type LatestMvuStatData = Record<string, any>;

function getLatestStatData(): LatestMvuStatData {
  const vars = getVariables({ type: 'message', message_id: 'latest' });
  const stat = _.get(vars, 'stat_data', {});
  return typeof stat === 'object' && stat != null ? (stat as LatestMvuStatData) : {};
}

function writeLatestStatData(next: LatestMvuStatData) {
  replaceVariables({ stat_data: next }, { type: 'message', message_id: 'latest' });
}

export const useLatestMvuStore = defineStore('latest-mvu', () => {
  const statData = shallowRef<LatestMvuStatData>({});
  const ready = ref(false);
  const lastUpdatedAt = ref(0);

  function refresh() {
    const next = klona(getLatestStatData());
    if (_.isEqual(next, statData.value)) return;
    statData.value = next;
    lastUpdatedAt.value = Date.now();
  }

  function patch(mutator: (draft: LatestMvuStatData) => void) {
    const base = getLatestStatData();
    const draft = klona(base);
    mutator(draft);
    writeLatestStatData(draft);
    statData.value = klona(draft);
    lastUpdatedAt.value = Date.now();
  }

  /**
   * 写入单个 key 值。等价于 patch(d => d[key] = value)，但更轻量、语义更清晰。
   * 用于"某个具体变量的值需要更新"场景（例如 {{剧情文本}} 同步）。
   * key 不存在时直接新增；存在则覆盖。
   */
  function setKey(key: string, value: any) {
    patch(stat => {
      _.set(stat, key, value);
    });
  }

  let pollInterval: ReturnType<typeof setInterval> | null = null;

  async function startAutoSync() {
    if (ready.value) return;
    ready.value = true;

    refresh();

    // Mvu 是运行时全局变量，必须等待其初始化完毕才能订阅事件
    await waitGlobalInitialized('Mvu');

    // 当新楼层变量更新完毕时刷新 latest（AI 输出解析触发）
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, () => {
      refresh();
    });

    // 轮询机制：定期检查最新楼层变量是否被外部修改（如直接在酒馆变量管理器中修改）
    pollInterval = setInterval(() => {
      refresh();
    }, 1000);
  }

  function stopAutoSync() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  return {
    statData,
    ready,
    lastUpdatedAt,
    refresh,
    patch,
    setKey,
    startAutoSync,
    stopAutoSync,
  };
});
