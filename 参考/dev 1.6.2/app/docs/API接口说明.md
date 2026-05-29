# Eden System - API 接口说明

## 1. 概述

Eden System 通过 JS-Slash-Runner 插件提供的 API 与 SillyTavern 进行交互。所有 API 调用都封装在 `src/services/api/` 目录下。

## 2. 外部 API（JS-Slash-Runner 提供）

### 2.1 环境检测

**检查 JS-Slash-Runner 是否可用**:

```typescript
// 位置: src/utils/environment.ts
function isJSSlashRunnerAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.generate === 'function' &&
    typeof window.getWorldbook === 'function'
  )
}
```

### 2.2 AI 生成 API

#### window.generate()

调用 SillyTavern 的 AI 生成接口。

**类型定义**: `src/types/external-apis.d.ts`

```typescript
interface GenerateOptions {
  user_input: string // 用户输入（Prompt）
  should_stream: boolean // 是否流式输出（Eden System 使用 false）
  generation_id: string // 生成 ID（用于取消请求）
}

declare global {
  interface Window {
    generate(options: GenerateOptions): Promise<string>
  }
}
```

**封装**: `src/services/api/aiApi.ts`

<augment_code_snippet path="app/src/services/api/aiApi.ts" mode="EXCERPT">

```typescript
static async generate(options: GenerateOptions): Promise<string> {
  if (!this.isAvailable()) {
    throw new PermissionError('generate API 不可用')
  }
  const response = await window.generate(options)
  return response
}
```

</augment_code_snippet>

**使用示例**:

```typescript
import { AIApi } from '@/services/api/aiApi'

const response = await AIApi.generate({
  user_input: 'Hello, AI!',
  should_stream: false,
  generation_id: AIApi.generateUniqueId(),
})
```

### 2.3 世界书 API

#### window.getWorldbook()

获取指定世界书的内容。

**类型定义**: `src/types/external-apis.d.ts`

```typescript
interface WorldbookEntry {
  name: string // 条目名称
  content: string // 条目内容（YAML 格式）
  enabled: boolean // 是否启用
  strategy: {
    // 触发策略
    type: string
    keys: string[]
    keys_secondary: {
      logic: string
      keys: string[]
    }
    scan_depth: string
  }
  position: {
    // 插入位置
    type: string
    role: string
    depth: number
  }
}

declare global {
  interface Window {
    getWorldbook(worldbookName: string): Promise<WorldbookEntry[]>
  }
}
```

**封装**: `src/services/api/worldbookApi.ts`

<augment_code_snippet path="app/src/services/api/worldbookApi.ts" mode="EXCERPT">

```typescript
static async getWorldbook(worldbookName: string): Promise<WorldbookEntry[]> {
  if (!this.isAvailable()) {
    throw new PermissionError('getWorldbook API 不可用')
  }
  return await window.getWorldbook(worldbookName)
}
```

</augment_code_snippet>

#### window.updateWorldbook()

更新世界书内容。

**类型定义**:

```typescript
interface UpdateWorldbookOptions {
  worldbookName: string // 世界书名称
  worldbookEntries: WorldbookEntry[] // 世界书条目数组
}

declare global {
  interface Window {
    updateWorldbook(options: UpdateWorldbookOptions): Promise<void>
  }
}
```

**封装**:

```typescript
static async updateWorldbook(
  worldbookName: string,
  entries: WorldbookEntry[]
): Promise<void> {
  if (!this.isAvailable()) {
    throw new PermissionError('updateWorldbook API 不可用')
  }
  await window.updateWorldbook({
    worldbookName,
    worldbookEntries: entries
  })
}
```

#### window.getCharWorldbooks()

获取当前角色绑定的世界书列表。

**类型定义**:

```typescript
interface CharWorldbooks {
  worldbooks: string[] // 世界书名称列表
}

declare global {
  interface Window {
    getCharWorldbooks(): Promise<CharWorldbooks>
  }
}
```

### 2.4 角色 API

#### window.getCharacterName()

获取当前角色的名称。

**封装**: `src/services/api/characterApi.ts`

```typescript
static async getCharacterName(): Promise<string> {
  if (!this.isAvailable()) {
    throw new PermissionError('getCharacterName API 不可用')
  }
  return await window.getCharacterName()
}
```

### 2.5 MiniMax TTS API

MiniMax 文本转语音（T2A）API 服务，用于将文本转换为语音。

**位置**: `src/services/api/minimaxApi.ts`

#### synthesizeSpeech()

将文本转换为语音。

**方法签名**:

```typescript
static async synthesizeSpeech(
  text: string,
  apiKey: string,
  options?: Partial<MiniMaxT2ARequest>
): Promise<string>
```

**参数说明**:

- `text`: 需要合成语音的文本
- `apiKey`: MiniMax API Key
- `options`: 可选配置
  - `model`: 模型版本（默认: 'speech-2.6-hd'）
  - `stream`: 是否流式输出（默认: false）
  - `output_format`: 输出格式（默认: 'hex'）
  - `voice_setting`: 音色设置（voice_id、speed、vol、pitch、emotion）
  - `audio_setting`: 音频设置（sample_rate、bitrate、format、channel）

**返回值**: Base64 编码的音频数据（hex 格式）或音频 URL

**使用示例**:

```typescript
import { MiniMaxApi } from '@/services/api/minimaxApi'

const audioData = await MiniMaxApi.synthesizeSpeech('你好，欢迎来到伊甸园', 'your-api-key', {
  model: 'speech-2.6-hd',
  output_format: 'hex',
  voice_setting: {
    voice_id: 'female-tianmei',
    speed: 1.0,
  },
})
```

## 3. 内部服务 API

### 3.1 AI 服务

**位置**: `src/services/aiService.ts`

#### sendPlayerChoice()

发送玩家选择到 AI，获取剧情更新。

**方法签名**:

```typescript
static async sendPlayerChoice(
  gameData: GameData,
  playerChoice: string,
  userActionLog: UserAction[],
  summariesCount: number
): Promise<string>
```

**参数说明**:

- `gameData`: 当前游戏数据
- `playerChoice`: 玩家选择的文本
- `userActionLog`: 用户操作历史
- `summariesCount`: 摘要数量（用于控制发送的摘要数量）

**返回值**: AI 生成的响应文本（YAML 格式）

**流程**:

1. 构建 Prompt（包含游戏数据、玩家选择、操作历史）
2. 调用 `AIApi.generate()`
3. 应用重试机制（失败时自动重试）
4. 返回 AI 响应

**使用示例**:

```typescript
import { AIService } from '@/services/aiService'

const response = await AIService.sendPlayerChoice(gameData, '继续散步', userActionLog, 5)
```

### 3.2 游戏数据服务

**位置**: `src/services/gameDataService.ts`

#### loadGameData()

加载游戏数据（从世界书或本地示例数据）。

**方法签名**:

```typescript
static async loadGameData(): Promise<{
  gameData: GameData
  needsInitialization: boolean
  error: string | null
}>
```

**返回值**:

- `gameData`: 加载的游戏数据
- `needsInitialization`: 是否需要初始化
- `error`: 错误信息（如果有）

**加载流程**:

1. 检查 JS-Slash-Runner 环境
   - 不可用 → 加载本地示例数据
2. 检查角色世界书绑定
   - 未绑定 → 提示绑定世界书
3. 检查世界书数据状态
   - 有自动存档 → 加载自动存档
   - 有初始化数据 → 加载初始化数据
   - 无数据 → 需要初始化

#### saveInitializationData()

保存初始化数据到世界书。

**方法签名**:

```typescript
static async saveInitializationData(gameData: GameData): Promise<void>
```

### 3.3 世界书数据服务

**位置**: `src/services/worldbook/worldbookDataService.ts`

#### loadGameDataFromWorldbook()

从世界书加载游戏数据。

**方法签名**:

```typescript
static async loadGameDataFromWorldbook(): Promise<GameData | null>
```

**加载优先级**:

1. 自动存档数据（最新）
2. 初始化数据（初始状态）

#### saveGameDataToWorldbook()

保存游戏数据到世界书（自动存档）。

**方法签名**:

```typescript
static async saveGameDataToWorldbook(gameData: GameData): Promise<void>
```

**存档结构**:

```yaml
gameData:
  # 游戏数据
_saveInfo:
  saveTime: '2024-01-01T10:00:00Z'
  version: '1.3'
  phase: '渗透期'
```

### 3.4 世界书存档服务

**位置**: `src/services/worldbook/worldbookSaveService.ts`

#### saveGame()

手动保存游戏到指定存档位。

**方法签名**:

```typescript
static async saveGame(
  gameData: GameData,
  saveNumber?: number
): Promise<number>
```

**参数说明**:

- `gameData`: 要保存的游戏数据
- `saveNumber`: 存档编号（可选，不提供则自动分配）

**返回值**: 实际使用的存档编号

#### loadSave()

加载指定存档。

**方法签名**:

```typescript
static async loadSave(saveNumber: number): Promise<GameData>
```

#### deleteSave()

删除指定存档。

**方法签名**:

```typescript
static async deleteSave(saveNumber: number): Promise<void>
```

#### listSaves()

列出所有存档。

**方法签名**:

```typescript
static async listSaves(): Promise<SaveInfo[]>

interface SaveInfo {
  saveNumber: number
  saveTime: string
  version: string
  phase: string
}
```

#### exportSave()

导出存档为 JSON 字符串。

**方法签名**:

```typescript
static exportSave(gameData: GameData): string
```

#### importSave()

从 JSON 字符串导入存档。

**方法签名**:

```typescript
static importSave(jsonString: string): GameData
```

### 3.5 AI 服务（含响应解析）

**位置**: `src/services/aiService.ts`

**注**: AI 响应解析逻辑已从独立的 `aiResponseParser.ts` 合并到 `aiService.ts` 中，简化了调用链。

#### sendPlayerChoice()

发送玩家选择到 AI 并解析响应。

**方法签名**:

```typescript
static async sendPlayerChoice(
  gameData: GameData,
  playerChoice: string,
  userActionLog: UserAction[],
  summariesCount: number = 5
): Promise<ParsedAIResponse | null>
```

**参数说明**:

- `gameData`: 当前游戏数据
- `playerChoice`: 玩家选择的文本
- `userActionLog`: 用户操作日志
- `summariesCount`: 发送给 AI 的摘要条数（默认 5）

**返回值**: 解析后的 AI 响应

```typescript
interface ParsedAIResponse {
  success: boolean // 是否解析成功
  yamlContent: string | null // YAML 代码块内容
  error?: string // 错误信息
}
```

**解析流程**:

1. 构建 AI Prompt（包含游戏数据和玩家选择）
2. 调用 AI API 生成响应
3. 提取 YAML 代码块（`yaml ... `）
4. 返回解析结果

### 3.6 数据更新服务

**位置**: `src/services/dataUpdate/`

#### DataMerger.applyYamlUpdate()

应用 YAML 更新操作到游戏数据。

**方法签名**:

```typescript
static applyYamlUpdate(gameData: GameData, yamlContent: string): void
```

**支持的操作符**:

- `$update`: 更新或添加字段
- `$delete`: 删除字段

**示例**:

```yaml
$update:
  'gameData.story.time': '清晨 7:46'
  'gameData.story.content': '故事内容...'
  'gameData.choices':
    - text: '选项1'
    - text: '选项2'

$delete:
  - 'gameData.system.storage.inventory.used_item'
```

#### PathResolver.setValueByPath()

通过路径设置对象的值。

**方法签名**:

```typescript
static setValueByPath(obj: unknown, path: string, value: unknown): void
```

#### PathResolver.deleteByPath()

通过路径删除对象的属性。

**方法签名**:

```typescript
static deleteByPath(obj: unknown, path: string): void
```

## 4. 错误处理

所有 API 调用都使用统一的错误处理机制。

**错误类型**: `src/utils/errorHandler.ts`

```typescript
enum ErrorCategory {
  NETWORK = 'network', // 网络错误
  PERMISSION = 'permission', // 权限错误
  VALIDATION = 'validation', // 验证错误
  UNKNOWN = 'unknown', // 未知错误
}

class AppError extends Error {
  category: ErrorCategory
  getUserMessage(): string // 获取用户友好的错误消息
}
```

**错误处理示例**:

```typescript
try {
  const response = await AIApi.generate(options)
} catch (error) {
  if (error instanceof AppError) {
    showErrorToast(error.getUserMessage())
  } else {
    showErrorToast('操作失败，请稍后重试')
  }
}
```

## 5. 重试机制

AI 请求和数据加载都实现了重试机制。

**配置**: `src/stores/settingsStore.ts`

```typescript
interface AppSettings {
  maxRetries: number // 最大重试次数（默认 3）
  maxDataRetries: number // 数据加载最大重试次数（默认 3）
  retryDelay: number // 重试延迟（毫秒，默认 1000）
}
```

**重试策略**:

- 指数退避：每次重试延迟翻倍
- 最大重试次数：可配置
- 用户反馈：显示重试进度

## 6. API 调用流程图

### 6.1 玩家选择流程

```
用户点击选择
    ↓
usePlayerChoice.handleChoice()
    ↓
useAICommunication.sendPlayerChoice()
    ↓
AIService.sendPlayerChoice()  ←─────┐
    ↓                               │
AIApi.generate()                    │ 重试
    ↓                               │
AI 响应（含 YAML 代码块提取和解析）  │
    ↓                               │
返回 ParsedAIResponse ──────────────┘
    ↓
DataMerger.applyYamlUpdate()
    ↓
WorldbookDataService.saveGameDataToWorldbook()
```

### 6.2 数据加载流程

```
应用启动
    ↓
GameDataService.loadGameData()
    ↓
检查环境 → WorldbookConnectionService.isJSSlashRunnerAvailable()
    ↓
检查绑定 → WorldbookConnectionService.checkCharacterBinding()
    ↓
检查数据 → WorldbookDataService.checkWorldbookData()
    ↓
加载数据 → WorldbookDataService.loadGameDataFromWorldbook()
```

## 7. 最佳实践

### 7.1 API 调用

- 始终检查 API 可用性
- 使用封装的 API 类而非直接调用 window 对象
- 处理所有可能的错误情况
- 提供用户友好的错误提示

### 7.2 数据更新

- 使用 `DataMerger.applyYamlUpdate()` 应用 YAML 更新
- 使用 `PathResolver` 进行路径操作而非直接修改数据
- 更新后保存到世界书

### 7.3 错误处理

- 捕获所有异常
- 使用 `AppError` 提供结构化错误信息
- 向用户展示友好的错误消息
- 记录详细的错误日志

### 7.4 性能优化

- 避免频繁调用 API
- 使用防抖减少不必要的请求
- 批量操作合并为单次请求
