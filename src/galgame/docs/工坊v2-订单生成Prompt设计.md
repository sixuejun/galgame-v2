# 工坊 v2：订单生成 Prompt 设计

本文档定义工坊 v2 订单制中"从第二 API 生成订单文案"的 prompt 模板与解析协议。

**前置文档**：`docs/工坊v2-订单制设计草案.md` §6、`docs/工坊v2-弹幕文本模板库.md`、`docs/工坊v2-变量清单与清空机制.md`

---

## 1. 调用时机

玩家点击"刷新订单"时调用，生成一批新的订单文案（`workType / title / brief / tags`），系统补全数值字段（`订单时长秒 / 基础金币 / 偏好`）。

> 刷新订单**不影响进行中订单**（已有 `OrderRun` 的角色继续工作）。

---

## 2. Prompt 模板

### 2.1 System Prompt（PROMPT_WORKSHOP_ORDERS）

```text
[System] 你是废土世界工坊的订单发布官。根据以下剧情上下文，为工坊生成一批可接取的订单。

指令：
1. 必须使用简体中文输出
2. 生成 6~10 条订单
3. 每条订单的字段用英文竖线 "|" 分隔
4. 订单标题要有废土风格，不要有现代感
5. 不要输出其它解释文本

输出格式（严格）：
<workshop_orders_v1>
工种|标题|说明|标签
...
</workshop_orders_v1>

字段说明：
- 工种：必须是以下三者之一——冶炼 / 制药 / 改装
- 标题：简洁有力的订单名称，少于 15 字
- 说明：订单背景描述，少于 30 字
- 标签：用逗号分隔的风险或类型标签，可空；如：危险、高压、精密、紧急 等
```

### 2.2 User Prompt（上下文）

```text
【当前剧情背景】
{worldInfo}

【工坊信息】
- 工坊等级：{workshopLevel} 级
- 已有角色：{availableRoles} 名
```

---

## 3. 输出协议

### 3.1 协议格式

```text
<workshop_orders_v1>
工种|标题|说明|标签
冶炼|紧急修复|一辆装甲车的引擎损坏了，急需焊接修复|高压,紧急
制药|退烧剂配方|避难所里有居民发烧，需要配制退烧剂|紧急
改装|信号增幅器|需要把旧天线改装为信号增幅器|精密,危险
...
</workshop_orders_v1>
```

### 3.2 约束

| 约束 | 说明 |
|---|---|
| 行数 | 6~10 行 |
| 工种 | 必须是 `冶炼` / `制药` / `改装` 之一 |
| 字段数 | 固定 4 列（`工种\|标题\|说明\|标签`） |
| 字段内部 | 禁止出现 `|` |
| 标签 | 用英文逗号 `,` 分隔，可空 |
| 标题 | 少于 15 字 |
| 说明 | 少于 30 字 |

---

## 4. 系统补全字段

AI 只生成风味文案字段，以下字段由**系统随机生成**：

| 字段 | 生成规则 |
|---|---|
| `订单id` | `order_${Date.now()}_${随机5位}` |
| `订单时长秒` | `randInt(60, 300)` |
| `基础金币` | `randInt(50, 200)` |
| `偏好.偏好属性[]` | 随机 1~2 个属性（如 `技巧`、`智慧`） |
| `偏好.偏好阈值` | 固定 `>=3` |
| `偏好.满足加成` | 满足偏好时的开局倍速加成，`randFloat(5, 20)` |

> **设计理由**：让系统控制数值，可以避免经济失控，也减少对 AI 的约束负担。

---

## 5. 解析器设计

### 5.1 解析流程

```typescript
/**
 * 解析 AI 返回的订单列表
 * @param raw - AI 返回的原始字符串
 * @returns 解析后的订单定义数组（不包含系统补全字段）
 */
function parseWorkshopOrders(raw: string): WorkshopOrderDef[] {
  // 1. 提取 <workshop_orders_v1> 块
  const match = raw.match(/<workshop_orders_v1>([\s\S]*?)<\/workshop_orders_v1>/i);
  if (!match) {
    console.warn('[Workshop] 订单解析失败，原始输出：', raw);
    return [];
  }

  const content = match[1].trim();
  const lines = content.split('\n').filter(l => l.trim());

  const orders: WorkshopOrderDef[] = [];

  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 3) continue;

    const [workType, title, brief, tagsStr] = parts;
    const validTypes = ['冶炼', '制药', '改装'];
    if (!validTypes.includes(workType)) continue;

    const tags = tagsStr
      ? tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    orders.push({
      workType: workType as '冶炼' | '制药' | '改装',
      title,
      brief,
      tags,
    });
  }

  return orders;
}
```

### 5.2 补全函数

```typescript
function generateOrderSystemFields(): OrderSystemFields {
  const attributeList = ['战力', '技巧', '智慧', '社交', '谨慎', '运气'] as const;

  // 随机选择 1~2 个偏好属性
  const prefCount = Math.random() < 0.3 ? 2 : 1;
  const shuffled = [...attributeList].sort(() => Math.random() - 0.5);
  const 偏好属性 = shuffled.slice(0, prefCount);

  return {
    订单id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    订单时长秒: Math.floor(Math.random() * 241) + 60,  // 60~300
    基础金币: Math.floor(Math.random() * 151) + 50,     // 50~200
    偏好: {
      偏好属性,
      偏好阈值: 3,
      满足加成: Math.floor(Math.random() * 16) + 5,   // 5~20
    },
  };
}
```

---

## 6. 调用封装

```typescript
/**
 * 刷新工坊订单
 * @param worldInfo - 当前剧情摘要（可空）
 * @param workshopLevel - 工坊等级
 * @param availableRoles - 可用角色数
 */
export async function refreshWorkshopOrders(
  worldInfo?: string,
  workshopLevel: number = 1,
  availableRoles: number = 1,
): Promise<WorkshopOrder[]> {
  // 1. 构建 user prompt
  const userPrompt = `【当前剧情背景】
${worldInfo || '（无特殊背景）'}

【工坊信息】
- 工坊等级：${workshopLevel} 级
- 已有角色：${availableRoles} 名`;

  // 2. 调用第二 API
  const raw = await callSecondApi('workshopOrder', {
    ordered_prompts: [
      'world_info',
      'char_persona',
      'chat_history',
      { role: 'system', content: PROMPT_WORKSHOP_ORDERS },
      { role: 'user', content: userPrompt },
    ],
  }) as string;

  // 3. 解析
  const parsed = parseWorkshopOrders(raw);

  // 4. 系统补全数值字段
  return parsed.map(p => ({
    ...generateOrderSystemFields(),
    ...p,
  }));
}
```

---

## 7. 错误处理与降级

| 情况 | 处理 |
|---|---|
| 解析失败（无 `<workshop_orders_v1>` 块） | 返回空数组，提示"订单刷新失败" |
| 解析结果为空 | 返回 3 条备用硬编码订单 |
| 第二 API 未配置/超时 | 静默返回空数组，显示提示 |

备用订单（降级用）：

```typescript
const FALLBACK_ORDERS: WorkshopOrder[] = [
  {
    订单id: `order_fallback_${Date.now()}_0`,
    工种: '冶炼',
    标题: '基础锻件',
    说明: '一份简单的锻造任务',
    标签: [],
    订单时长秒: 120,
    基础金币: 80,
    偏好: { 偏好属性: ['技巧'], 偏好阈值: 3, 满足加成: 10 },
  },
  {
    订单id: `order_fallback_${Date.now()}_1`,
    工种: '制药',
    标题: '止痛草药',
    说明: '配制一份止痛草药',
    标签: [],
    订单时长秒: 90,
    基础金币: 60,
    偏好: { 偏好属性: ['智慧'], 偏好阈值: 3, 满足加成: 10 },
  },
  {
    订单id: `order_fallback_${Date.now()}_2`,
    工种: '改装',
    标题: '工具修复',
    说明: '修好坏掉的工具',
    标签: [],
    订单时长秒: 150,
    基础金币: 100,
    偏好: { 偏好属性: ['技巧'], 偏好阈值: 3, 满足加成: 10 },
  },
];
```

---

## 8. 消耗金币的刷新机制

刷新订单时扣金币，由技能 `工坊.订单刷新费用减免` 修正：

```typescript
export function getRefreshCost(workshopLevel: number, discountSkills: number[]): number {
  const base = workshopLevel * 30;  // 基础费用 = 工坊等级 × 30
  const discount = discountSkills.reduce((acc, v) => acc + v, 0);  // 减免叠加
  return Math.max(10, base - discount);
}
```

---

## 9. 与现有 store.ts 的接口

`callSecondApi` 的 task 类型需要新增 `'workshopOrder'`：

```typescript
// store.ts 中
async function callSecondApi(
  task: 'danmaku' | 'shop' | 'system' | 'riddle' | 'imageTag' | 'danmakuAndImageGen' | 'boardGameEvent' | 'workshopOrder',
  ...
)
```

`secondApiTaskControl` 中也加入对应开关。
