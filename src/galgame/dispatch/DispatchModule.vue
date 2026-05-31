<template>
  <div class="dispatch-module">
    <!-- Phase tabs -->
    <div class="dm-phase-tabs">
      <button
        v-for="p in phases"
        :key="p.value"
        class="dm-tab"
        :class="{ 'dm-tab-active': currentPhase === p.value, [`dm-tab-${p.value}`]: true }"
        :disabled="!canAccessTab(p.value)"
        @click="navigateToPhase(p.value)"
      >
        <i :class="p.icon" />
        <span>{{ p.label }}</span>
      </button>
    </div>

    <!-- Phase content -->
    <div class="dm-content">
      <!-- ══ Phase 1: Select Destination ══ -->
      <div v-if="currentPhase === 'selectDestination'" class="dm-phase-section">
        <div class="dm-section-header">
          <h3>选择目的地</h3>
          <p class="dm-section-hint">选择要探索的地点</p>
        </div>
        <div class="dm-destination-grid">
          <div
            v-for="dest in destinations"
            :key="dest.id"
            class="dm-dest-card"
            :class="{ 'dm-dest-selected': selectedDestination?.id === dest.id }"
            @click="selectDestination(dest)"
          >
            <div class="dm-dest-icon">{{ dest.emoji }}</div>
            <div class="dm-dest-info">
              <div class="dm-dest-name">{{ dest.name }}</div>
              <div class="dm-dest-desc">{{ dest.description }}</div>
              <div class="dm-dest-meta">
                <span class="dm-meta-chip dm-meta-diff">
                  <i class="fa-solid fa-skull" /> {{ dest.difficulty }}
                </span>
                <span class="dm-meta-chip dm-meta-risk" :class="`dm-risk-${dest.risk}`">
                  <i :class="riskIcon(dest.risk)" /> {{ riskLabel(dest.risk) }}
                </span>
              </div>
              <div class="dm-dest-reward">
                <i class="fa-solid fa-coins" /> 预期: {{ dest.rewardMin }}-{{ dest.rewardMax }}G
              </div>
            </div>
            <div v-if="selectedDestination?.id === dest.id" class="dm-dest-check">
              <i class="fa-solid fa-check" />
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Phase 2: Select Character ══ -->
      <div v-else-if="currentPhase === 'selectCharacter'" class="dm-phase-section">
        <div class="dm-section-header">
          <h3>选择角色</h3>
          <p class="dm-section-hint">选择执行派遣的角色</p>
        </div>
        <div v-if="availableRoles.length === 0" class="dm-empty-state">
          <i class="fa-solid fa-user-slash" />
          <p>没有可派遣的角色</p>
          <span>所有角色正在执行任务或休息中</span>
        </div>
        <div v-else class="dm-role-grid">
          <div
            v-for="role in availableRoles"
            :key="role.id"
            class="dm-role-card"
            :class="{ 'dm-role-selected': selectedRoleId === role.id }"
            @click="selectRole(role.id)"
          >
            <div class="dm-role-avatar">
              {{ role.姓名?.charAt(0) || '?' }}
            </div>
            <div class="dm-role-info">
              <div class="dm-role-name">{{ role.姓名 }}</div>
              <div class="dm-role-status">
                <span class="dm-status-badge" :class="`dm-status-${role.状态}`">
                  {{ role.状态 }}
                </span>
              </div>
              <div class="dm-role-attrs">
                <span v-for="(val, key) in role.属性" :key="key" class="dm-attr-chip">
                  {{ key }}:{{ val }}
                </span>
              </div>
              <div v-if="role.已装备技能?.length > 0" class="dm-role-skills">
                <i class="fa-solid fa-star" />
                {{ role.已装备技能.length }} 个技能
              </div>
            </div>
            <div v-if="selectedRoleId === role.id" class="dm-role-check">
              <i class="fa-solid fa-check" />
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Phase 3: Confirm Dispatch ══ -->
      <div v-else-if="currentPhase === 'confirm'" class="dm-phase-section">
        <div class="dm-section-header">
          <h3>确认派遣</h3>
          <p class="dm-section-hint">检查派遣计划并确认</p>
        </div>
        <div class="dm-confirm-layout">
          <!-- Summary card -->
          <div class="dm-summary-card">
            <div class="dm-summary-row">
              <span class="dm-summary-label"><i class="fa-solid fa-map-pin" /> 目的地</span>
              <span class="dm-summary-value">{{ selectedDestination?.emoji }} {{ selectedDestination?.name }}</span>
            </div>
            <div class="dm-summary-row">
              <span class="dm-summary-label"><i class="fa-solid fa-user" /> 角色</span>
              <span class="dm-summary-value">{{ selectedRole?.姓名 }}</span>
            </div>
            <div class="dm-summary-row">
              <span class="dm-summary-label"><i class="fa-solid fa-route" /> 路线</span>
              <span class="dm-summary-value">{{ routeLabel(selectedRoute) }}</span>
            </div>
            <div class="dm-summary-row">
              <span class="dm-summary-label"><i class="fa-solid fa-clock" /> 预计步数</span>
              <span class="dm-summary-value">{{ estimatedSteps }} 步</span>
            </div>
            <div class="dm-summary-divider" />
            <div class="dm-summary-row dm-summary-reward">
              <span class="dm-summary-label"><i class="fa-solid fa-coins" /> 预期收益</span>
              <span class="dm-summary-value">{{ selectedDestination?.rewardMin }}-{{ selectedDestination?.rewardMax }}G</span>
            </div>
          </div>

          <!-- Route selection -->
          <div class="dm-route-section">
            <div class="dm-route-title">选择路线长度</div>
            <div class="dm-route-options">
              <button
                v-for="route in routeOptions"
                :key="route.value"
                class="dm-route-btn"
                :class="{ 'dm-route-selected': selectedRoute === route.value }"
                @click="selectedRoute = route.value"
              >
                <span class="dm-route-label">{{ route.label }}</span>
                <span class="dm-route-desc">{{ route.desc }}</span>
              </button>
            </div>
          </div>

          <!-- Map preview -->
          <div v-if="mapPreviewNodes.length > 0" class="dm-map-preview">
            <div class="dm-map-preview-title">
              <i class="fa-solid fa-map" /> 地图预览
            </div>
            <div class="dm-map-grid">
              <div
                v-for="node in mapPreviewNodes"
                :key="node.id"
                class="dm-map-node"
                :class="[
                  `dm-node-${node.type}`,
                  { 'dm-node-current': node.id === mapPreviewCurrent },
                ]"
                :title="nodeLabel(node.type)"
              >
                <i :class="nodeIcon(node.type)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Phase 4: In Progress ══ -->
      <div v-else-if="currentPhase === 'inProgress'" class="dm-phase-section dm-inprogress-section">
        <div class="dm-inprogress-layout">
          <!-- Left: stats -->
          <div class="dm-stats-panel">
            <div class="dm-stats-title">
              <i class="fa-solid fa-chart-line" /> 状态
            </div>
            <div class="dm-stat-row">
              <span class="dm-stat-label"><i class="fa-solid fa-heart" /> HP</span>
              <div class="dm-stat-track">
                <div
                  class="dm-stat-fill dm-stat-hp"
                  :style="{ width: (bgStore.stats.hp / bgStore.stats.maxHp) * 100 + '%' }"
                />
              </div>
              <span class="dm-stat-val">{{ bgStore.stats.hp }}/{{ bgStore.stats.maxHp }}</span>
            </div>
            <div class="dm-stat-row">
              <span class="dm-stat-label"><i class="fa-solid fa-brain" /> 精神</span>
              <div class="dm-stat-track">
                <div
                  class="dm-stat-fill dm-stat-san"
                  :style="{ width: (bgStore.stats.sanity / bgStore.stats.maxSanity) * 100 + '%' }"
                />
              </div>
              <span class="dm-stat-val">{{ bgStore.stats.sanity }}/{{ bgStore.stats.maxSanity }}</span>
            </div>
            <div class="dm-stat-row">
              <span class="dm-stat-label"><i class="fa-solid fa-shoe-prints" /> 步数</span>
              <span class="dm-stat-val dm-stat-steps">{{ bgStore.totalSteps }} 步</span>
            </div>
            <div class="dm-stat-row">
              <span class="dm-stat-label"><i class="fa-solid fa-flag" /> 阶段</span>
              <span class="dm-stat-val">{{ phaseLabel }}</span>
            </div>
          </div>

          <!-- Center: mini map -->
          <div class="dm-mini-map-area">
            <div class="dm-mini-map-container">
              <div
                class="dm-mini-map"
                :style="{ width: bgStore.mapConfig.width * 0.3 + 'px', height: bgStore.mapConfig.height * 0.3 + 'px' }"
              >
                <div
                  v-for="node in bgStore.mapConfig.nodes"
                  :key="node.id"
                  class="dm-mini-node"
                  :class="[
                    `dm-mini-${node.type}`,
                    {
                      'dm-mini-current': node.id === bgStore.currentNodeId,
                      'dm-mini-walkable': bgStore.walkableNodeIds.includes(node.id),
                      'dm-mini-visited': bgStore.visitedNodeIds.has(node.id) && node.id !== bgStore.currentNodeId,
                    },
                  ]"
                  :style="{
                    left: (node.x - 20) * 0.3 + 'px',
                    top: (node.y - 20) * 0.3 + 'px',
                  }"
                  :title="nodeLabel(node.type)"
                />
                <div
                  v-if="playerTokenPos.x > 0"
                  class="dm-mini-token"
                  :style="{ left: playerTokenPos.x * 0.3 - 6 + 'px', top: playerTokenPos.y * 0.3 - 6 + 'px' }"
                >
                  <i class="fa-solid fa-person-walking" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right: event log -->
          <div class="dm-log-panel">
            <div class="dm-log-title">
              <i class="fa-solid fa-scroll" /> 行路记录
            </div>
            <div ref="logScrollRef" class="dm-log-body">
              <div
                v-for="(entry, i) in bgStore.gameLog"
                :key="i"
                class="dm-log-entry"
                :class="{
                  'dm-log-event': entry.startsWith('⚡'),
                  'dm-log-transfer': entry.startsWith('⊙'),
                  'dm-log-indent': entry.startsWith('  └'),
                }"
              >
                {{ entry }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons for in-progress -->
        <div class="dm-inprogress-actions">
          <button
            class="dm-btn dm-btn-primary"
            :disabled="bgStore.phase !== 'idle' || bgStore.aiEventGenerating"
            @click="handleAdvance"
          >
            <i class="fa-solid fa-forward-fast" />
            {{ bgStore.aiEventGenerating ? '生成中...' : '加速' }}
          </button>
          <button class="dm-btn dm-btn-danger" @click="handleRetreat">
            <i class="fa-solid fa-person-falling" />
            撤退
          </button>
        </div>
      </div>

      <!-- ══ Phase 5: Settlement ══ -->
      <div v-else-if="currentPhase === 'settlement'" class="dm-phase-section">
        <div class="dm-settlement-header">
          <div class="dm-result-badge" :class="`dm-result-${settlementResult?.状态 || '成功'}`">
            <i :class="settlementIcon(settlementResult?.状态)" />
            {{ settlementResult?.状态 || '完成' }}
          </div>
          <h3>{{ selectedRole?.姓名 }} 的派遣</h3>
        </div>

        <!-- Rewards -->
        <div class="dm-settlement-rewards">
          <div class="dm-reward-row">
            <span class="dm-reward-label"><i class="fa-solid fa-coins" /> 金币</span>
            <span class="dm-reward-value dm-gold">+{{ settlementResult?.总金币 || 0 }}</span>
          </div>
          <div v-if="settlementResult?.战斗加成" class="dm-reward-row">
            <span class="dm-reward-label"><i class="fa-solid fa-khanda" /> 战斗加成</span>
            <span class="dm-reward-value dm-battle">+{{ settlementResult.战斗加成 }}</span>
          </div>
        </div>

        <!-- Story -->
        <div v-if="settlementStory" class="dm-story-section">
          <div class="dm-story-title"><i class="fa-solid fa-book-open" /> 旅途故事</div>
          <div class="dm-story-content">{{ settlementStory }}</div>
        </div>

        <!-- Dispatch history -->
        <div class="dm-history-section">
          <div class="dm-history-title"><i class="fa-solid fa-clock-rotate-left" /> 派遣记录</div>
          <div v-if="dispatchRuns.length === 0" class="dm-history-empty">
            暂无派遣记录
          </div>
          <div v-else class="dm-history-list">
            <div
              v-for="run in dispatchRuns.slice(-5).reverse()"
              :key="run.派遣id"
              class="dm-history-item"
            >
              <span class="dm-history-icon">
                <i :class="runResultIcon(run.状态)" />
              </span>
              <span class="dm-history-role">{{ run.角色id ? getRoleName(run.角色id) : '?' }}</span>
              <span class="dm-history-result" :class="`dm-result-${run.状态}`">
                {{ run.状态 }}
              </span>
              <span class="dm-history-gold">
                {{ run.结算结果?.总金币 || 0 }}G
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="dm-actions">
      <!-- Select Destination: Next -->
      <template v-if="currentPhase === 'selectDestination'">
        <button
          class="dm-btn dm-btn-primary"
          :disabled="!selectedDestination"
          @click="navigateToPhase('selectCharacter')"
        >
          下一步 <i class="fa-solid fa-arrow-right" />
        </button>
      </template>

      <!-- Select Character: Back + Next -->
      <template v-else-if="currentPhase === 'selectCharacter'">
        <button class="dm-btn dm-btn-secondary" @click="navigateToPhase('selectDestination')">
          <i class="fa-solid fa-arrow-left" /> 上一步
        </button>
        <button
          class="dm-btn dm-btn-primary"
          :disabled="!selectedRoleId"
          @click="navigateToPhase('confirm')"
        >
          下一步 <i class="fa-solid fa-arrow-right" />
        </button>
      </template>

      <!-- Confirm: Back + Confirm Start -->
      <template v-else-if="currentPhase === 'confirm'">
        <button class="dm-btn dm-btn-secondary" @click="navigateToPhase('selectCharacter')">
          <i class="fa-solid fa-arrow-left" /> 上一步
        </button>
        <button
          class="dm-btn dm-btn-primary"
          :disabled="!selectedDestination || !selectedRoleId || starting"
          @click="handleStartDispatch"
        >
          <i v-if="starting" class="fa-solid fa-spinner fa-spin" />
          <i v-else class="fa-solid fa-play" />
          {{ starting ? '派遣中...' : '确认派遣' }}
        </button>
      </template>

      <!-- In Progress: no buttons (handled inline) -->

      <!-- Settlement: Close -->
      <template v-else-if="currentPhase === 'settlement'">
        <button class="dm-btn dm-btn-primary" @click="handleCloseSettlement">
          <i class="fa-solid fa-check" /> 完成
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore } from '../store';
import { useBoardGameStore } from '../boardgame/boardGameStore';
import { generateMap } from '../boardgame/mapGenerator';
import type { MapNode, MapConfig, NodeType } from '../boardgame/types';
import type { DispatchRun, 结算结果 } from '../types/role';

const emit = defineEmits<{ close: [] }>();

const store = useVNStore();
const bgStore = useBoardGameStore();

// ── Types ──────────────────────────────────────────────────────────

interface Destination {
  id: string;
  emoji: string;
  name: string;
  description: string;
  difficulty: string;
  risk: 'low' | 'medium' | 'high';
  rewardMin: number;
  rewardMax: number;
  route: 'short' | 'medium' | 'long';
}

interface RouteOption {
  value: 'short' | 'medium' | 'long';
  label: string;
  desc: string;
}

// ── Phase management ──────────────────────────────────────────────

type Phase = 'selectDestination' | 'selectCharacter' | 'confirm' | 'inProgress' | 'settlement';

const currentPhase = ref<Phase>('selectDestination');
const phaseOrder: Phase[] = ['selectDestination', 'selectCharacter', 'confirm', 'inProgress', 'settlement'];

const phases = [
  { value: 'selectDestination' as Phase, label: '目的地', icon: 'fa-solid fa-map-pin' },
  { value: 'selectCharacter' as Phase, label: '角色', icon: 'fa-solid fa-user' },
  { value: 'confirm' as Phase, label: '确认', icon: 'fa-solid fa-check' },
  { value: 'inProgress' as Phase, label: '进行中', icon: 'fa-solid fa-person-walking' },
  { value: 'settlement' as Phase, label: '结算', icon: 'fa-solid fa-flag' },
];

function canAccessTab(phase: Phase): boolean {
  const idx = phaseOrder.indexOf(phase);
  const currentIdx = phaseOrder.indexOf(currentPhase.value);
  // Can always go back, can only go forward if we've completed previous steps
  if (phase === 'inProgress') return bgStore.phase !== 'idle' || bgStore.totalSteps > 0;
  if (idx <= currentIdx) return true;
  // Can go forward only if previous phases are done
  if (phase === 'selectCharacter') return !!selectedDestination.value;
  if (phase === 'confirm') return !!selectedRoleId.value;
  return false;
}

function navigateToPhase(phase: Phase) {
  currentPhase.value = phase;
}

// ── Destinations ──────────────────────────────────────────────────

const destinations: Destination[] = [
  {
    id: 'hospital',
    emoji: '🏥',
    name: '废弃医院',
    description: '曾经救死扶伤的地方，如今只剩残垣断壁',
    difficulty: '★★☆',
    risk: 'high',
    rewardMin: 600,
    rewardMax: 1200,
    route: 'medium',
  },
  {
    id: 'mall',
    emoji: '🏬',
    name: '购物中心废墟',
    description: '末日前的繁华之地，可能藏有大量物资',
    difficulty: '★★☆',
    risk: 'medium',
    rewardMin: 400,
    rewardMax: 900,
    route: 'medium',
  },
  {
    id: 'military',
    emoji: '🏰',
    name: '军事基地遗迹',
    description: '被遗弃的要塞，高风险高回报',
    difficulty: '★★★',
    risk: 'high',
    rewardMin: 900,
    rewardMax: 1800,
    route: 'long',
  },
  {
    id: 'school',
    emoji: '🏫',
    name: '废弃学校',
    description: '孩子们的避难所，相对安全的探索区域',
    difficulty: '★☆☆',
    risk: 'low',
    rewardMin: 200,
    rewardMax: 500,
    route: 'short',
  },
];

const selectedDestination = ref<Destination | null>(null);

function selectDestination(dest: Destination) {
  selectedDestination.value = dest;
  selectedRoute.value = dest.route;
}

// ── Route selection ───────────────────────────────────────────────

const routeOptions: RouteOption[] = [
  { value: 'short', label: '短途探索', desc: '约30~40步，风险低' },
  { value: 'medium', label: '中途探索', desc: '约55~75步，平衡' },
  { value: 'long', label: '长途远征', desc: '约90~112步，高收益' },
];

const selectedRoute = ref<'short' | 'medium' | 'long'>('medium');

const estimatedSteps = computed(() => {
  const ranges: Record<string, [number, number]> = {
    short: [30, 40],
    medium: [55, 75],
    long: [90, 112],
  };
  const [min, max] = ranges[selectedRoute.value] || [55, 75];
  return Math.round((min + max) / 2);
});

function routeLabel(route: string): string {
  return routeOptions.find(r => r.value === route)?.label || route;
}

// ── Map preview ───────────────────────────────────────────────────

const mapPreviewNodes = ref<MapNode[]>([]);
const mapPreviewCurrent = ref<string>('');

function generateMapPreview() {
  const seed = Math.floor(Math.random() * 999999);
  const config: MapConfig = generateMap(seed, selectedRoute.value);
  mapPreviewNodes.value = config.nodes;
  mapPreviewCurrent.value = config.startNodeId;
}

watch([selectedRoute], () => {
  if (currentPhase.value === 'confirm') {
    generateMapPreview();
  }
});

watch(currentPhase, (phase) => {
  if (phase === 'confirm') {
    generateMapPreview();
  }
});

// ── Character selection ───────────────────────────────────────────

const availableRoles = computed(() => store.getAvailableRoles());
const selectedRoleId = ref<string | null>(null);
const selectedRole = computed(() =>
  selectedRoleId.value ? store.roles[selectedRoleId.value] : null
);

function selectRole(roleId: string) {
  selectedRoleId.value = roleId;
}

// ── Start dispatch ────────────────────────────────────────────────

const starting = ref(false);

async function handleStartDispatch() {
  if (!selectedDestination.value || !selectedRoleId.value || starting.value) return;

  starting.value = true;
  try {
    // Generate map config
    const seed = Math.floor(Math.random() * 999999);
    const mapConfig: MapConfig = generateMap(seed, selectedRoute.value);

    // Start dispatch in store
    const success = store.startDispatch(selectedRoleId.value, mapConfig);
    if (!success) {
      store.showToast('派遣启动失败');
      return;
    }

    // Initialize board game store with the map
    bgStore.seed = seed;
    bgStore.route = selectedRoute.value;
    bgStore.mapConfig = mapConfig;
    bgStore.phase = 'idle';
    bgStore.currentNodeId = mapConfig.startNodeId;
    bgStore.stats = { hp: 100, maxHp: 100, sanity: 100, maxSanity: 100, luck: 5 };
    bgStore.totalSteps = 0;
    bgStore.gameLog = [`□ 派遣开始，目标：${selectedDestination.value.name}。`];

    // Navigate to in-progress
    currentPhase.value = 'inProgress';
  } catch (e) {
    console.error('[Dispatch] Start failed:', e);
    store.showToast('派遣启动失败');
  } finally {
    starting.value = false;
  }
}

// ── In-progress ──────────────────────────────────────────────────

const logScrollRef = ref<HTMLElement>();

const playerTokenPos = computed(() => {
  const node = bgStore.nodeMap.get(bgStore.currentNodeId);
  return { x: node?.x ?? 0, y: node?.y ?? 0 };
});

const phaseLabel = computed(() => {
  const labels: Record<string, string> = {
    idle: '等待中',
    rolling: '掷骰中',
    choosingPath: '选择路径',
    event: '事件触发',
    resolving: '结算中',
  };
  return labels[bgStore.phase] ?? bgStore.phase;
});

async function handleAdvance() {
  if (bgStore.phase === 'idle') {
    bgStore.rollDice();
    // Wait for roll animation, then finish
    setTimeout(() => {
      bgStore.finishRoll();
    }, 600);
  }
}

// Auto-scroll log
watch(
  () => bgStore.gameLog.length,
  () =>
    nextTick(() => {
      if (logScrollRef.value) {
        logScrollRef.value.scrollTop = logScrollRef.value.scrollHeight;
      }
    }),
);

// Watch for dispatch end (HP/Sanity zero or other completion)
watch(
  () => bgStore.stats.hp,
  (hp) => {
    if (hp <= 0 && currentPhase.value === 'inProgress') {
      triggerSettlement('forced');
    }
  },
);

watch(
  () => bgStore.stats.sanity,
  (sanity) => {
    if (sanity <= 0 && currentPhase.value === 'inProgress') {
      triggerSettlement('forced');
    }
  },
);

// Watch for reaching end node
watch(
  () => bgStore.currentNodeId,
  (nodeId) => {
    const node = bgStore.nodeMap.get(nodeId);
    if (node?.type === 'end' && currentPhase.value === 'inProgress') {
      triggerSettlement('success');
    }
  },
);

async function handleRetreat() {
  if (!selectedRoleId.value) return;
  store.cancelDispatch(selectedRoleId.value);
  triggerSettlement('cancelled');
}

// ── Settlement ───────────────────────────────────────────────────

const settlementResult = ref<结算结果 | null>(null);
const settlementStory = ref('');
const dispatchRuns = computed<DispatchRun[]>(() => store.dispatchRuns ?? []);

async function triggerSettlement(result: 'success' | 'forced' | 'cancelled') {
  // Generate settlement
  const resultStatus = result === 'success' ? '成功' : result === 'forced' ? '强制结算' : '取消';

  settlementResult.value = {
    状态: resultStatus,
    总金币: result === 'cancelled' ? 0 : Math.round(200 + bgStore.totalSteps * 50 + Math.random() * 100),
    战斗加成: Math.round(Math.random() * 50),
  };

  // End dispatch in store
  if (result !== 'cancelled' && selectedRoleId.value) {
    store.endDispatch({
      状态: resultStatus as any,
      基础金币: 200,
      战斗加成: settlementResult.value.战斗加成,
      总金币: settlementResult.value.总金币,
      纪念品: [],
    });
  }

  // Generate story
  if (result !== 'cancelled' && selectedRoleId.value) {
    const active = store.getDispatchActive();
    if (active) {
      settlementStory.value = `经过 ${bgStore.totalSteps} 步的探索，${selectedRole.value?.姓名 || '角色'} 完成了在 ${selectedDestination.value?.name || '未知地点'} 的冒险。虽然 ${result === 'success' ? '成功到达了终点' : '因状态不佳被迫撤离'}，但这次经历一定会有所收获。`;
    }
  }

  currentPhase.value = 'settlement';
}

function handleCloseSettlement() {
  // Reset state
  selectedDestination.value = null;
  selectedRoleId.value = null;
  settlementResult.value = null;
  settlementStory.value = '';
  bgStore.resetGame();
  emit('close');
}

// ── Helpers ──────────────────────────────────────────────────────

function riskIcon(risk: string): string {
  return {
    low: 'fa-solid fa-shield-heart',
    medium: 'fa-solid fa-triangle-exclamation',
    high: 'fa-solid fa-skull',
  }[risk] || 'fa-solid fa-question';
}

function riskLabel(risk: string): string {
  return { low: '低风险', medium: '中风险', high: '高风险' }[risk] || risk;
}

function nodeIcon(type: NodeType | string): string {
  const icons: Record<string, string> = {
    start: 'fa-solid fa-flag-checkered',
    encounter: 'fa-solid fa-users',
    trap: 'fa-solid fa-triangle-exclamation',
    fortune: 'fa-solid fa-star',
    battle: 'fa-solid fa-khanda',
    end: 'fa-solid fa-flag',
    empty: 'fa-solid fa-square',
  };
  return icons[type] ?? 'fa-solid fa-circle';
}

function nodeLabel(type: NodeType | string | undefined): string {
  const labels: Record<string, string> = {
    start: '起点',
    empty: '空地',
    encounter: '遭遇',
    trap: '陷阱',
    fortune: '幸运',
    battle: '战斗',
    end: '终点',
  };
  return labels[type ?? ''] ?? type ?? '';
}

function settlementIcon(status: string | undefined): string {
  return {
    成功: 'fa-solid fa-trophy',
    强制结算: 'fa-solid fa-triangle-exclamation',
    取消: 'fa-solid fa-xmark',
  }[status ?? ''] ?? 'fa-solid fa-flag';
}

function runResultIcon(status: string): string {
  return {
    成功: 'fa-solid fa-check-circle',
    强制结算: 'fa-solid fa-exclamation-circle',
    失败: 'fa-solid fa-times-circle',
  }[status] ?? 'fa-solid fa-circle';
}

function getRoleName(roleId: string): string {
  return store.roles[roleId]?.姓名 ?? roleId;
}

// Initialize map preview on mount
onMounted(() => {
  if (currentPhase.value === 'confirm') {
    generateMapPreview();
  }
});
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────── */
.dispatch-module {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--vn-bg);
}

/* ── Phase tabs ─────────────────────────────────────────────────── */
.dm-phase-tabs {
  display: flex;
  gap: 2px;
  padding: 12px 16px 0;
  border-bottom: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(35, 30, 26, 0.3);
  flex-shrink: 0;
}

.dm-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  font-size: 11px;
  font-family: monospace;
  letter-spacing: 0.08em;
  border: none;
  background: transparent;
  color: var(--theme-text-muted, var(--vn-muted));
  cursor: pointer;
  border-radius: 3px 3px 0 0;
  transition: all 0.2s;
  border-top: 2px solid transparent;
}

.dm-tab i {
  font-size: 10px;
}

.dm-tab:hover:not(:disabled) {
  color: var(--theme-text-main, var(--vn-fg));
  background: rgba(90, 79, 64, 0.1);
}

.dm-tab-active {
  color: var(--stain) !important;
  border-top-color: var(--stain) !important;
  background: rgba(196, 162, 101, 0.08) !important;
}

.dm-tab:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Content ───────────────────────────────────────────────────── */
.dm-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
}

.dm-phase-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Section header ─────────────────────────────────────────────── */
.dm-section-header {
  flex-shrink: 0;
}

.dm-section-header h3 {
  font-size: 13px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.dm-section-hint {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  font-family: monospace;
}

/* ── Destination cards ─────────────────────────────────────────── */
.dm-destination-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  flex: 1;
}

.dm-dest-card {
  position: relative;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.6);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  gap: 10px;
  border-radius: 3px;
}

.dm-dest-card:hover {
  border-color: rgba(196, 162, 101, 0.5);
  background: rgba(58, 51, 44, 0.7);
  transform: translateY(-1px);
}

.dm-dest-selected {
  border-color: var(--stain) !important;
  background: rgba(196, 162, 101, 0.08) !important;
  box-shadow: 0 0 10px rgba(196, 162, 101, 0.15);
}

.dm-dest-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
  line-height: 1;
  margin-top: 2px;
}

.dm-dest-info {
  flex: 1;
  min-width: 0;
}

.dm-dest-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: 'Noto Serif SC', serif;
  margin-bottom: 4px;
}

.dm-dest-desc {
  font-size: 10px;
  color: var(--theme-text-muted, var(--vn-muted));
  line-height: 1.5;
  margin-bottom: 6px;
}

.dm-dest-meta {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.dm-meta-chip {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 3px;
}

.dm-meta-diff {
  background: rgba(139, 69, 19, 0.2);
  color: var(--theme-accent, var(--rust));
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.dm-meta-risk {
  border: 1px solid;
}

.dm-risk-low {
  background: rgba(90, 122, 74, 0.15);
  color: var(--vn-success);
  border-color: rgba(90, 140, 74, 0.3);
}

.dm-risk-medium {
  background: rgba(139, 69, 19, 0.15);
  color: var(--theme-accent, var(--rust));
  border-color: rgba(139, 69, 19, 0.3);
}

.dm-risk-high {
  background: rgba(110, 26, 14, 0.15);
  color: #c46060;
  border-color: rgba(110, 26, 14, 0.3);
}

.dm-dest-reward {
  font-size: 10px;
  color: var(--stain);
  font-family: monospace;
  display: flex;
  align-items: center;
  gap: 3px;
}

.dm-dest-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--stain);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: var(--ink-black);
}

/* ── Role cards ─────────────────────────────────────────────────── */
.dm-role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  flex: 1;
}

.dm-role-card {
  position: relative;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.6);
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dm-role-card:hover {
  border-color: rgba(196, 162, 101, 0.5);
  background: rgba(58, 51, 44, 0.7);
  transform: translateY(-1px);
}

.dm-role-selected {
  border-color: var(--stain) !important;
  background: rgba(196, 162, 101, 0.08) !important;
  box-shadow: 0 0 10px rgba(196, 162, 101, 0.15);
}

.dm-role-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(196, 162, 101, 0.15);
  border: 1.5px solid rgba(196, 162, 101, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: var(--stain);
}

.dm-role-name {
  font-size: 12px;
  font-weight: bold;
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  font-family: 'Noto Serif SC', serif;
}

.dm-role-attrs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.dm-attr-chip {
  font-size: 8px;
  padding: 1px 5px;
  background: rgba(90, 79, 64, 0.2);
  border: 1px solid rgba(90, 79, 64, 0.3);
  color: var(--theme-text-muted, var(--vn-muted));
  border-radius: 2px;
  font-family: monospace;
}

.dm-role-skills {
  font-size: 9px;
  color: var(--stain);
  display: flex;
  align-items: center;
  gap: 3px;
}

.dm-status-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
  font-family: monospace;
}

.dm-status-空闲 {
  background: rgba(90, 122, 74, 0.15);
  color: var(--vn-success);
  border: 1px solid rgba(90, 140, 74, 0.3);
}

.dm-status-休息中 {
  background: rgba(139, 69, 19, 0.15);
  color: var(--theme-accent, var(--rust));
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.dm-role-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--stain);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: var(--ink-black);
}

/* ── Empty state ───────────────────────────────────────────────── */
.dm-empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--theme-text-muted, var(--vn-muted));
}

.dm-empty-state i {
  font-size: 2rem;
  opacity: 0.3;
}

.dm-empty-state p {
  font-size: 13px;
  font-family: 'Noto Serif SC', serif;
}

.dm-empty-state span {
  font-size: 10px;
  opacity: 0.6;
}

/* ── Confirm layout ──────────────────────────────────────────────── */
.dm-confirm-layout {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dm-summary-card {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.5);
  padding: 14px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dm-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
}

.dm-summary-label {
  color: var(--theme-text-muted, var(--vn-muted));
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: monospace;
  font-size: 10px;
}

.dm-summary-value {
  color: var(--theme-text-main, var(--vn-fg));
  font-family: 'Noto Serif SC', serif;
}

.dm-summary-divider {
  height: 1px;
  background: rgba(90, 79, 64, 0.3);
  margin: 4px 0;
}

.dm-summary-reward .dm-summary-value {
  color: var(--stain);
  font-weight: bold;
}

/* Route selection */
.dm-route-section {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.5);
  padding: 12px;
  border-radius: 3px;
}

.dm-route-title {
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-bottom: 8px;
  text-transform: uppercase;
}

.dm-route-options {
  display: flex;
  gap: 8px;
}

.dm-route-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 8px;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(58, 51, 44, 0.3);
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 3px;
}

.dm-route-btn:hover {
  border-color: rgba(196, 162, 101, 0.4);
  background: rgba(74, 64, 53, 0.4);
}

.dm-route-selected {
  border-color: var(--stain) !important;
  background: rgba(196, 162, 101, 0.1) !important;
}

.dm-route-label {
  font-size: 11px;
  font-weight: bold;
  color: var(--theme-text-main, var(--vn-fg));
  font-family: 'Noto Serif SC', serif;
}

.dm-route-desc {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
}

/* Map preview */
.dm-map-preview {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.5);
  padding: 12px;
  border-radius: 3px;
}

.dm-map-preview-title {
  font-size: 10px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  margin-bottom: 8px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dm-map-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  max-width: 100%;
  padding: 8px;
  background: rgba(35, 30, 26, 0.4);
  border-radius: 2px;
  overflow: hidden;
  max-height: 80px;
}

.dm-map-node {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(58, 51, 44, 0.5);
}

.dm-map-node i {
  font-size: 8px;
  pointer-events: none;
}

.dm-node-start {
  background: rgba(196, 162, 101, 0.3);
  border-color: var(--stain);
  color: var(--stain);
}

.dm-node-end {
  background: rgba(196, 162, 101, 0.4);
  border-color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
  color: var(--theme-text-main, rgba(212, 197, 160, 0.9));
}

.dm-node-encounter {
  background: rgba(110, 26, 14, 0.3);
  border-color: rgba(110, 26, 14, 0.6);
  color: #c46060;
}

.dm-node-trap {
  background: rgba(139, 69, 19, 0.25);
  border-color: rgba(139, 69, 19, 0.5);
  color: var(--theme-accent, var(--rust));
}

.dm-node-fortune {
  background: rgba(74, 103, 65, 0.3);
  border-color: rgba(90, 140, 74, 0.5);
  color: var(--vn-success);
}

.dm-node-battle {
  background: rgba(90, 79, 64, 0.35);
  border-color: rgba(139, 69, 19, 0.5);
  color: #c46060;
}

.dm-node-current {
  border-color: var(--stain) !important;
  border-width: 2px;
  box-shadow: 0 0 6px rgba(196, 162, 101, 0.5);
}

/* ── In-progress ────────────────────────────────────────────────── */
.dm-inprogress-section {
  gap: 0;
}

.dm-inprogress-layout {
  display: grid;
  grid-template-columns: 180px 1fr 180px;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

/* Stats panel */
.dm-stats-panel {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.5);
  padding: 12px;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dm-stats-title {
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.dm-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dm-stat-label {
  font-size: 9px;
  color: var(--theme-text-muted, var(--vn-muted));
  display: flex;
  align-items: center;
  gap: 3px;
  width: 42px;
  flex-shrink: 0;
}

.dm-stat-track {
  flex: 1;
  height: 5px;
  background: rgba(90, 79, 64, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.dm-stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.dm-stat-hp {
  background: linear-gradient(to right, #8b2500, #c46060);
}

.dm-stat-san {
  background: linear-gradient(to right, #3e5470, #7ab0d4);
}

.dm-stat-val {
  font-size: 9px;
  font-family: monospace;
  color: var(--theme-text-muted, var(--vn-muted));
  width: 42px;
  text-align: right;
  flex-shrink: 0;
}

.dm-stat-steps {
  font-size: 10px;
  color: var(--stain);
  font-weight: bold;
}

/* Mini map */
.dm-mini-map-area {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dm-mini-map-container {
  overflow: auto;
  background: rgba(35, 30, 26, 0.4);
  border: 1px solid rgba(90, 79, 64, 0.4);
  border-radius: 3px;
  padding: 8px;
  max-width: 100%;
  max-height: 200px;
}

.dm-mini-map {
  position: relative;
  transform-origin: center;
}

.dm-mini-node {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(90, 79, 64, 0.5);
  background: rgba(58, 51, 44, 0.6);
}

.dm-mini-node i {
  font-size: 7px;
  pointer-events: none;
}

.dm-mini-start {
  background: rgba(196, 162, 101, 0.4);
  border-color: var(--stain);
  color: var(--stain);
}

.dm-mini-end {
  background: rgba(196, 162, 101, 0.5);
  border-color: rgba(212, 197, 160, 0.8);
  color: rgba(212, 197, 160, 0.9);
}

.dm-mini-encounter {
  background: rgba(110, 26, 14, 0.35);
  border-color: rgba(110, 26, 14, 0.6);
  color: #c46060;
}

.dm-mini-trap {
  background: rgba(139, 69, 19, 0.3);
  border-color: rgba(139, 69, 19, 0.5);
  color: var(--theme-accent, var(--rust));
}

.dm-mini-fortune {
  background: rgba(74, 103, 65, 0.35);
  border-color: rgba(90, 140, 74, 0.5);
  color: var(--vn-success);
}

.dm-mini-current {
  border-color: var(--stain) !important;
  border-width: 2px;
  box-shadow: 0 0 8px rgba(196, 162, 101, 0.6);
  z-index: 5;
}

.dm-mini-walkable {
  animation: dm-node-pulse 1.2s ease-in-out infinite;
}

@keyframes dm-node-pulse {
  0%, 100% { box-shadow: 0 0 3px rgba(196, 162, 101, 0.4); }
  50% { box-shadow: 0 0 8px rgba(196, 162, 101, 0.7); }
}

.dm-mini-visited {
  opacity: 0.4;
}

.dm-mini-token {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--stain);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 7px;
  color: var(--ink-black);
  z-index: 10;
  box-shadow: 0 0 6px rgba(196, 162, 101, 0.6);
  border: 1px solid rgba(212, 197, 160, 0.8);
  pointer-events: none;
}

/* Log panel */
.dm-log-panel {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.5);
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dm-log-title {
  padding: 8px 10px 6px;
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
  border-bottom: 1px solid rgba(90, 79, 64, 0.2);
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dm-log-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dm-log-entry {
  font-size: 9px;
  font-family: monospace;
  color: var(--theme-text-muted, rgba(139, 125, 107, 0.7));
  line-height: 1.5;
}

.dm-log-event { color: rgba(196, 162, 101, 0.8); }
.dm-log-transfer { color: rgba(122, 176, 212, 0.8); }
.dm-log-indent { color: rgba(90, 122, 74, 0.7); padding-left: 4px; }

/* In-progress action buttons */
.dm-inprogress-actions {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(90, 79, 64, 0.2);
  margin-top: 12px;
  flex-shrink: 0;
}

.dm-btn-primary {
  flex: 1;
}

/* ── Settlement ────────────────────────────────────────────────── */
.dm-settlement-header {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(90, 79, 64, 0.3);
}

.dm-result-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: bold;
  font-family: 'Noto Serif SC', serif;
  margin-bottom: 8px;
}

.dm-result-成功 {
  background: rgba(90, 122, 74, 0.15);
  color: var(--vn-success);
  border: 1px solid rgba(90, 140, 74, 0.3);
}

.dm-result-强制结算 {
  background: rgba(139, 69, 19, 0.15);
  color: var(--theme-accent, var(--rust));
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.dm-result-取消 {
  background: rgba(90, 79, 64, 0.15);
  color: var(--theme-text-muted, var(--vn-muted));
  border: 1px solid rgba(90, 79, 64, 0.3);
}

.dm-result-失败 {
  background: rgba(110, 26, 14, 0.15);
  color: #c46060;
  border: 1px solid rgba(110, 26, 14, 0.3);
}

.dm-settlement-header h3 {
  font-size: 12px;
  color: var(--theme-text-main, var(--vn-fg));
  font-family: 'Noto Serif SC', serif;
}

.dm-settlement-rewards {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dm-reward-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(42, 36, 32, 0.4);
  border: 1px solid rgba(90, 79, 64, 0.3);
  border-radius: 3px;
}

.dm-reward-label {
  font-size: 11px;
  color: var(--theme-text-muted, var(--vn-muted));
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: monospace;
}

.dm-reward-value {
  font-size: 14px;
  font-weight: bold;
  font-family: monospace;
}

.dm-gold { color: var(--stain); }
.dm-battle { color: #c46060; }

.dm-story-section {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.4);
  padding: 12px;
  border-radius: 3px;
}

.dm-story-title {
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dm-story-content {
  font-size: 11px;
  color: var(--theme-text-main, var(--vn-fg));
  font-family: 'Noto Serif SC', serif;
  line-height: 1.8;
  font-style: italic;
  max-height: 120px;
  overflow-y: auto;
}

.dm-history-section {
  border: 1px solid rgba(90, 79, 64, 0.4);
  background: rgba(42, 36, 32, 0.4);
  padding: 12px;
  border-radius: 3px;
}

.dm-history-title {
  font-size: 9px;
  font-family: monospace;
  letter-spacing: 0.1em;
  color: var(--theme-text-muted, var(--vn-muted));
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dm-history-empty {
  font-size: 10px;
  color: var(--theme-text-faint, rgba(139, 125, 107, 0.4));
  text-align: center;
  padding: 12px;
}

.dm-history-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dm-history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  padding: 5px 8px;
  background: rgba(35, 30, 26, 0.3);
  border-radius: 2px;
}

.dm-history-icon {
  color: var(--theme-text-muted, var(--vn-muted));
  font-size: 9px;
}

.dm-history-role {
  flex: 1;
  color: var(--theme-text-main, var(--vn-fg));
}

.dm-history-result {
  font-family: monospace;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 2px;
}

.dm-history-gold {
  color: var(--stain);
  font-family: monospace;
  font-size: 9px;
}

/* ── Action buttons ─────────────────────────────────────────────── */
.dm-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid rgba(90, 79, 64, 0.3);
  background: rgba(35, 30, 26, 0.3);
  flex-shrink: 0;
}

.dm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 12px;
  font-family: 'Noto Serif SC', serif;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.06em;
  border: 1px solid;
  flex: 1;
}

.dm-btn i {
  font-size: 10px;
}

.dm-btn-primary {
  background: rgba(139, 69, 19, 0.18);
  border-color: rgba(139, 69, 19, 0.5);
  color: var(--stain);
}

.dm-btn-primary:hover:not(:disabled) {
  background: rgba(139, 69, 19, 0.32);
  border-color: rgba(139, 69, 19, 0.7);
}

.dm-btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.dm-btn-secondary {
  background: rgba(74, 64, 53, 0.3);
  border-color: rgba(90, 79, 64, 0.5);
  color: var(--theme-text-muted, var(--vn-muted));
}

.dm-btn-secondary:hover {
  background: rgba(74, 64, 53, 0.5);
  color: var(--theme-text-main, var(--vn-fg));
}

.dm-btn-danger {
  background: rgba(110, 26, 14, 0.15);
  border-color: rgba(110, 26, 14, 0.4);
  color: #c46060;
}

.dm-btn-danger:hover {
  background: rgba(110, 26, 14, 0.28);
  border-color: rgba(110, 26, 14, 0.6);
}
</style>
