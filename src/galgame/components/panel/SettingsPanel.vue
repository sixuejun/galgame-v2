<template>
  <div data-ui="settings-panel" class="absolute inset-0 flex items-center justify-center px-4" style="z-index: 50">
    <div
      class="absolute inset-0"
      :style="{
        background: 'var(--theme-panel-backdrop, rgba(42, 36, 32, 0.7))',
        backdropFilter: 'blur(var(--theme-panel-backdrop-blur, 4px))',
      }"
      @click="store.setOverlay('none')"
    />

    <SkinShell :skin="settingsPanelSkin" :shell-style="panelShellStyle">
      <div
        data-ui="panel"
        class="animate-fade-in-up relative flex w-full flex-col overflow-hidden border"
        :style="
          settingsPanelSkin ? { ...panelStyle, borderColor: 'transparent', background: 'transparent' } : panelStyle
        "
      >
        <div :style="decoTopThick" />
        <div :style="decoTopThin" />

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4" :style="headerBorder">
          <div class="flex items-center gap-3">
            <div class="stamp-effect">
              <span
                style="
                  color: var(--theme-accent, var(--rust));
                  font-size: 0.75rem;
                  font-weight: bold;
                  letter-spacing: 0.15em;
                "
                >SETTINGS</span
              >
            </div>
            <h2
              class="text-lg font-bold tracking-widest"
              style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
            >
              设置
            </h2>
          </div>
          <button
            class="flex h-8 w-8 cursor-pointer items-center justify-center transition-colors"
            style="color: var(--theme-text-muted, var(--vn-muted))"
            @click="store.setOverlay('none')"
          >
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- Content -->
        <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <!-- Portrait -->
          <SectionHeader icon="fa-user" title="立绘设置" />
          <div class="mb-6 pl-2">
            <SliderRow
              label="立绘大小"
              :value="store.settings.portraitScale"
              :min="10"
              :max="200"
              suffix="%"
              @update="v => store.updateSettings({ portraitScale: v })"
            />
            <SliderRow
              label="水平位置"
              :value="store.settings.portraitX"
              :min="-50"
              :max="50"
              suffix="%"
              @update="v => store.updateSettings({ portraitX: v })"
            />
            <SliderRow
              label="垂直位置"
              :value="store.settings.portraitY"
              :min="-50"
              :max="50"
              suffix="%"
              @update="v => store.updateSettings({ portraitY: v })"
            />
            <div class="flex items-center justify-between py-2">
              <div>
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                  >旁白继承立绘</span
                >
                <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px">
                  旁白块显示上一个角色的立绘（如角色与旁白穿插时保持立绘不消失）
                </p>
              </div>
              <ToggleSwitch
                :checked="store.settings.narrationSpriteInherit"
                @update="v => store.updateSettings({ narrationSpriteInherit: v })"
              />
            </div>
          </div>

          <!-- Text -->
          <SectionHeader icon="fa-font" title="文字显示" />
          <div class="mb-6 pl-2">
            <SliderRow
              label="文字速度"
              :value="store.settings.textSpeed"
              :min="1"
              :max="10"
              @update="v => store.updateSettings({ textSpeed: v })"
            />
            <SliderRow
              label="自动速度"
              :value="store.settings.autoPlaySpeed"
              :min="1"
              :max="10"
              @update="v => store.updateSettings({ autoPlaySpeed: v })"
            />
            <div class="flex items-center justify-between py-2">
              <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">自动播放</span>
              <ToggleSwitch :checked="store.settings.autoPlay" @update="v => store.updateSettings({ autoPlay: v })" />
            </div>
          </div>

          <!-- Danmaku -->
          <SectionHeader icon="fa-comment-dots" title="弹幕设置" />
          <div class="mb-6 pl-2">
            <div class="flex items-center justify-between py-2">
              <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">启用弹幕</span>
              <ToggleSwitch
                :checked="store.settings.danmakuEnabled"
                @update="v => store.updateSettings({ danmakuEnabled: v })"
              />
            </div>
            <template v-if="store.settings.danmakuEnabled">
              <SliderRow
                label="弹幕速度"
                :value="store.settings.danmakuSpeed"
                :min="1"
                :max="10"
                @update="v => store.updateSettings({ danmakuSpeed: v })"
              />
              <div class="flex items-center justify-between py-2">
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">循环弹幕</span>
                <ToggleSwitch
                  :checked="store.settings.danmakuLoop"
                  @update="v => store.updateSettings({ danmakuLoop: v })"
                />
              </div>
              <template v-if="store.settings.danmakuLoop">
                <SliderRow
                  label="循环时长"
                  :value="store.settings.danmakuLoopDuration"
                  :min="2"
                  :max="60"
                  @update="v => store.updateSettings({ danmakuLoopDuration: v })"
                />
              </template>
              <div class="flex items-center justify-between py-2">
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">显示区域</span>
                <div class="flex gap-2">
                  <button
                    v-for="opt in danmakuDisplayOptions"
                    :key="opt.value"
                    class="cursor-pointer border px-3 py-1.5 text-xs transition-all"
                    :style="{
                      borderColor:
                        store.settings.danmakuDisplay === opt.value
                          ? 'var(--theme-accent, var(--rust))'
                          : 'rgba(90,79,64,0.4)',
                      background: store.settings.danmakuDisplay === opt.value ? 'rgba(139,69,19,0.15)' : 'transparent',
                      color:
                        store.settings.danmakuDisplay === opt.value
                          ? 'var(--theme-text-main, var(--vn-fg))'
                          : 'var(--theme-text-muted, var(--vn-muted))',
                      borderRadius: '2px',
                    }"
                    @click="store.updateSettings({ danmakuDisplay: opt.value as any })"
                  >
                    {{ opt.label }}
                  </button>
                </div>
              </div>
              <SliderRow
                label="字体大小"
                :value="store.settings.danmakuFontSize"
                :min="0.8"
                :max="2.5"
                :step="0.1"
                suffix=""
                @update="v => store.updateSettings({ danmakuFontSize: v })"
              />
              <div class="flex items-center justify-between py-2">
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">弹幕颜色</span>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    :value="store.settings.danmakuColor"
                    class="h-6 w-10 cursor-pointer rounded border border-[rgba(90,79,64,0.4)]"
                    @input="e => store.updateSettings({ danmakuColor: (e.target as HTMLInputElement).value })"
                  />
                  <input
                    type="text"
                    :value="store.settings.danmakuColor"
                    class="w-20 rounded border border-[rgba(90,79,64,0.4)] bg-transparent px-2 py-1 text-xs"
                    style="color: var(--theme-text-main, var(--vn-fg))"
                    placeholder="#ffffff"
                    @input="e => store.updateSettings({ danmakuColor: (e.target as HTMLInputElement).value })"
                  />
                </div>
              </div>
              <SliderRow
                label="透明度"
                :value="store.settings.danmakuOpacity"
                :min="0.1"
                :max="1"
                :step="0.05"
                suffix=""
                @update="v => store.updateSettings({ danmakuOpacity: v })"
              />
              <div class="flex items-center justify-center pt-2">
                <button
                  class="cursor-pointer border px-4 py-1.5 text-xs font-medium transition-all hover:brightness-110"
                  style="
                    background: var(--theme-accent, var(--rust));
                    border-color: var(--theme-accent, var(--rust));
                    border-radius: 2px;
                    color: #fff;
                  "
                  @click="store.resetAndReapplyDanmaku()"
                >
                  保存
                </button>
              </div>
            </template>
          </div>

          <!-- Display -->
          <SectionHeader icon="fa-desktop" title="显示设置" />
          <div class="mb-6 pl-2">
            <div class="flex items-center justify-between py-2">
              <div>
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">竖屏模式</span>
                <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px">
                  画面宽度铺满楼层，高度随宽度按竖屏比例增高（适配 iframe，不使用视口高度单位）
                </p>
              </div>
              <ToggleSwitch
                :checked="store.settings.portraitMode"
                @update="v => store.updateSettings({ portraitMode: v })"
              />
            </div>
          </div>

          <!-- API Configuration -->
          <SectionHeader icon="fa-server" title="API 配置" />
          <div class="mb-6 pl-2">
            <!-- Second API -->
            <div class="mb-4 border p-3" style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                  >第二 API</span
                >
                <span class="text-xs" :class="'provider-' + store.secondApiStatus">
                  <i class="fa-solid fa-circle" style="font-size: 6px; margin-right: 4px" />
                  {{ store.secondApiStatus === 'available' ? '可用' : '未配置' }}
                </span>
              </div>
              <p class="mb-3 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">
                用于商店刷新、弹幕生成、系统/猜谜等功能
              </p>
              <input
                class="vn-input mb-2"
                placeholder="API URL"
                :value="store.settings.secondApiUrl"
                @input="store.updateSettings({ secondApiUrl: ($event.target as HTMLInputElement).value })"
              />
              <input
                class="vn-input mb-2"
                type="password"
                placeholder="API Key"
                :value="store.settings.secondApiKey"
                @input="store.updateSettings({ secondApiKey: ($event.target as HTMLInputElement).value })"
              />
              <div class="mb-3 flex gap-2">
                <select
                  class="vn-input flex-1 text-xs"
                  :value="store.settings.secondApiModel"
                  @change="store.updateSettings({ secondApiModel: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="">选择模型</option>
                  <!-- 已保存的模型不在列表中时显示为独立选项 -->
                  <option
                    v-if="
                      store.settings.secondApiModel && !store.secondApiModelList.includes(store.settings.secondApiModel)
                    "
                    :value="store.settings.secondApiModel"
                  >
                    {{ store.settings.secondApiModel }}
                  </option>
                  <option v-for="m in store.secondApiModelList" :key="m" :value="m">{{ m }}</option>
                </select>
                <button
                  class="cursor-pointer border px-2 py-1 text-xs whitespace-nowrap"
                  style="
                    border-color: rgba(90, 79, 64, 0.4);
                    border-radius: 2px;
                    color: var(--theme-text-muted, var(--vn-muted));
                  "
                  :disabled="!store.settings.secondApiUrl?.trim() || store.secondApiModelListLoading"
                  @click="store.fetchSecondApiModelList()"
                >
                  {{ store.secondApiModelListLoading ? '…' : '拉取模型' }}
                </button>
              </div>
              <div class="mb-3 flex gap-2">
                <select
                  class="vn-input flex-1 text-xs"
                  :value="store.settings.secondApiPreset"
                  @change="store.updateSettings({ secondApiPreset: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="">不使用预设（使用默认参数）</option>
                  <option v-for="preset in presetList" :key="preset" :value="preset">{{ preset }}</option>
                </select>
                <button
                  class="cursor-pointer border px-2 py-1 text-xs whitespace-nowrap"
                  style="
                    border-color: rgba(90, 79, 64, 0.4);
                    border-radius: 2px;
                    color: var(--theme-text-muted, var(--vn-muted));
                  "
                  :disabled="loadingPresetList"
                  @click="refreshPresetList"
                >
                  {{ loadingPresetList ? '…' : '刷新' }}
                </button>
              </div>
              <p style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 8px">
                选择预设后，将使用该预设的提示词等配置，但 API 请求仍使用上方配置的第二 API
              </p>
              <div class="mb-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="shrink-0 text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                    >流式</span
                  >
                  <ToggleSwitch
                    :checked="store.settings.secondApiStream"
                    @update="v => store.updateSettings({ secondApiStream: v })"
                  />
                </div>
                <button
                  class="flex shrink-0 cursor-pointer items-center gap-1.5 border px-2.5 py-1 text-xs transition-all"
                  :style="{
                    borderColor: canTestSecondApi ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.2)',
                    color: canTestSecondApi
                      ? 'var(--theme-text-main, var(--vn-fg))'
                      : 'var(--theme-text-muted, var(--vn-muted))',
                    borderRadius: '2px',
                    opacity: canTestSecondApi ? 1 : 0.4,
                  }"
                  :disabled="!canTestSecondApi || testingSecondApi"
                  @click="testSecondApi"
                >
                  <i
                    :class="testingSecondApi ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plug'"
                    style="font-size: 0.6rem"
                  />
                  <span>{{ secondApiTestResult ?? '测试连接' }}</span>
                </button>
              </div>
              <div class="mb-3 pt-2" style="border-top: 1px solid rgba(90, 79, 64, 0.2)">
                <p class="mb-2 text-xs" style="color: var(--theme-text-muted, var(--vn-muted))">生成参数</p>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-4 py-2">
                    <span class="w-20 shrink-0 text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                      >最大回复长度</span
                    >
                    <input
                      type="number"
                      class="vn-input w-24 text-center"
                      :value="
                        typeof store.settings.secondApiMaxTokens === 'number' ? store.settings.secondApiMaxTokens : ''
                      "
                      placeholder="不设限"
                      min="1"
                      @input="
                        e => {
                          const v = (e.target as HTMLInputElement).value;
                          store.updateSettings({ secondApiMaxTokens: v === '' ? 'unset' : Number(v) });
                        }
                      "
                    />
                  </div>
                  <SliderRow
                    label="温度"
                    :value="
                      typeof store.settings.secondApiTemperature === 'number'
                        ? store.settings.secondApiTemperature
                        : 0.7
                    "
                    :min="0"
                    :max="2"
                    :step="0.1"
                    @update="v => store.updateSettings({ secondApiTemperature: v })"
                  />
                  <SliderRow
                    label="Top P"
                    :value="typeof store.settings.secondApiTopP === 'number' ? store.settings.secondApiTopP : 0.9"
                    :min="0"
                    :max="1"
                    :step="0.05"
                    @update="v => store.updateSettings({ secondApiTopP: v })"
                  />
                  <SliderRow
                    label="Top K"
                    :value="typeof store.settings.secondApiTopK === 'number' ? store.settings.secondApiTopK : 40"
                    :min="0"
                    :max="200"
                    :step="1"
                    @update="v => store.updateSettings({ secondApiTopK: v })"
                  />
                </div>
              </div>
              <div class="mt-3 pt-3" style="border-top: 1px solid rgba(90, 79, 64, 0.2)">
                <button
                  class="mb-2 w-full cursor-pointer border px-3 py-2 text-xs transition-all"
                  style="
                    border-color: rgba(90, 79, 64, 0.4);
                    border-radius: 2px;
                    color: var(--theme-text-muted, var(--vn-muted));
                  "
                  @click="showApiTaskConfig = true"
                >
                  <i class="fa-solid fa-sliders mr-2" />
                  API 任务分配与生成历史
                </button>
                <button
                  class="w-full cursor-pointer border px-3 py-2 text-xs transition-all"
                  style="
                    border-color: rgba(90, 79, 64, 0.4);
                    border-radius: 2px;
                    color: var(--theme-text-muted, var(--vn-muted));
                  "
                  @click="showWorldbookManager = true"
                >
                  <i class="fa-solid fa-book mr-2" />
                  世界书管理
                </button>
              </div>
            </div>

            <!-- 生图（前端助手事件，需安装支持生图事件的插件） -->
            <div class="border p-3" style="border-color: rgba(90, 79, 64, 0.3); border-radius: 2px">
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                  >生图</span
                >
              </div>
              <p style="font-size: 9px; color: var(--theme-text-muted, var(--vn-muted)); margin-bottom: 8px">
                通过前端助手事件与外部插件通信，支持流式生图与生成完成后请求生图
              </p>
              <div class="flex items-center justify-between py-2">
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">生图总开关</span>
                <ToggleSwitch
                  :checked="store.settings.imageGenEnabled"
                  @update="v => store.updateSettings({ imageGenEnabled: v })"
                />
              </div>
              <!-- 卡片轮盘开关：独立于生图总开关，随时可开启 -->
              <div class="flex items-center justify-between py-2">
                <div>
                  <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">卡片轮盘</span>
                  <p style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted)); margin-top: 2px">
                    显示已生成图片的扇形队列，可随时查看历史
                  </p>
                </div>
                <ToggleSwitch
                  :checked="store.settings.imageCardWheelEnabled"
                  @update="v => store.updateSettings({ imageCardWheelEnabled: v })"
                />
              </div>
              <template v-if="store.settings.imageGenEnabled">
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">背景生成</span>
                  <ToggleSwitch
                    :checked="store.settings.backgroundGenEnabled"
                    @update="v => store.updateSettings({ backgroundGenEnabled: v })"
                  />
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">CG 生成</span>
                  <ToggleSwitch
                    :checked="store.settings.cgGenEnabled"
                    @update="v => store.updateSettings({ cgGenEnabled: v })"
                  />
                </div>
                <p
                  style="
                    font-size: 9px;
                    color: var(--theme-text-muted, var(--vn-muted));
                    margin-top: 4px;
                    margin-bottom: 8px;
                  "
                >
                  打开后自动启用对应世界书条目。同时打开背景与 CG 时，将根据消息内容判断生成类型，并显示扇形卡牌队列。
                </p>
                <div v-if="store.settings.backgroundGenEnabled && store.settings.cgGenEnabled" class="py-2">
                  <span class="mb-2 block text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">
                    两者都存在时的优先级
                  </span>
                  <div class="flex gap-2">
                    <button
                      class="cursor-pointer border px-3 py-1.5 text-xs transition-all"
                      :style="{
                        borderColor:
                          store.settings.imageGenPriority === 'cg'
                            ? 'var(--theme-accent, var(--rust))'
                            : 'rgba(90,79,64,0.4)',
                        background: store.settings.imageGenPriority === 'cg' ? 'rgba(139,69,19,0.15)' : 'transparent',
                        color:
                          store.settings.imageGenPriority === 'cg'
                            ? 'var(--theme-text-main, var(--vn-fg))'
                            : 'var(--theme-text-muted, var(--vn-muted))',
                        borderRadius: '2px',
                      }"
                      @click="store.updateSettings({ imageGenPriority: 'cg' })"
                    >
                      CG 优先
                    </button>
                    <button
                      class="cursor-pointer border px-3 py-1.5 text-xs transition-all"
                      :style="{
                        borderColor:
                          store.settings.imageGenPriority === 'background'
                            ? 'var(--theme-accent, var(--rust))'
                            : 'rgba(90,79,64,0.4)',
                        background:
                          store.settings.imageGenPriority === 'background' ? 'rgba(139,69,19,0.15)' : 'transparent',
                        color:
                          store.settings.imageGenPriority === 'background'
                            ? 'var(--theme-text-main, var(--vn-fg))'
                            : 'var(--theme-text-muted, var(--vn-muted))',
                        borderRadius: '2px',
                      }"
                      @click="store.updateSettings({ imageGenPriority: 'background' })"
                    >
                      背景优先
                    </button>
                  </div>
                </div>
                <div
                  v-if="
                    store.settings.backgroundGenEnabled &&
                    store.settings.cgGenEnabled &&
                    store.imageCardQueue.length > 0
                  "
                  class="mt-2 pt-2"
                  style="border-top: 1px solid rgba(90, 79, 64, 0.2)"
                >
                  <div class="flex items-center justify-between">
                    <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">
                      卡牌队列 ({{ store.imageCardQueue.length }}/10)
                    </span>
                    <button
                      class="cursor-pointer border px-2 py-1 text-xs"
                      style="
                        border-color: var(--theme-accent-soft, rgba(139, 69, 19, 0.6));
                        border-radius: 2px;
                        color: var(--theme-accent, var(--rust));
                      "
                      @click="store.clearImageCardQueue()"
                    >
                      清空队列
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Skin -->
          <SectionHeader icon="fa-palette" title="界面皮肤" />
          <div class="mb-6 pl-2">
            <!-- Theme Switcher -->
            <div class="mb-4">
              <span class="mb-2 block text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                >主题</span
              >
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="theme in themeList"
                  :key="theme.id"
                  class="cursor-pointer border p-3 text-left transition-all duration-200"
                  :style="{
                    borderColor:
                      store.settings.themeId === theme.id ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.4)',
                    background: store.settings.themeId === theme.id ? 'rgba(139,69,19,0.1)' : 'transparent',
                    borderRadius: '2px',
                  }"
                  @click="store.updateSettings({ themeId: theme.id })"
                >
                  <div class="mb-1 flex items-center gap-2">
                    <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">{{
                      theme.name
                    }}</span>
                    <span
                      v-if="theme.usesImageShell"
                      class="rounded px-1.5 py-0.5 text-[9px]"
                      style="color: var(--theme-accent, var(--rust)); background: rgba(139, 69, 19, 0.08)"
                      >IMG</span
                    >
                  </div>
                  <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
                    {{ theme.description }}
                  </div>
                  <div
                    v-if="store.settings.themeId === theme.id"
                    style="
                      margin-top: 6px;
                      font-size: 9px;
                      color: var(--theme-accent, var(--rust));
                      font-family: monospace;
                      letter-spacing: 0.1em;
                    "
                  >
                    [ 当前使用 ]
                  </div>
                </button>
              </div>
            </div>
            <div class="mb-3 rounded border p-3" style="border-color: rgba(90, 79, 64, 0.3)">
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))"
                    >主题系统</span
                  >
                  <span
                    class="rounded px-2 py-0.5 text-[10px] tracking-[0.18em]"
                    style="color: var(--theme-accent, var(--rust)); background: rgba(139, 69, 19, 0.08)"
                    >CSS</span
                  >
                </div>
                <ToggleSwitch
                  :checked="store.settings.themeEnabled"
                  @update="v => store.updateSettings({ themeEnabled: v })"
                />
              </div>

              <div
                class="mb-3 rounded border p-3"
                style="border-color: rgba(90, 79, 64, 0.25); background: rgba(42, 36, 32, 0.2)"
              >
                <div class="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <span class="text-xs font-bold" style="color: rgba(212, 197, 160, 0.88)">自定义 CSS</span>
                    <p class="mt-1 text-[11px] leading-5" style="color: var(--theme-text-muted, var(--vn-muted))"></p>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border transition-all"
                      :style="actionIconStyle"
                      title="导入 CSS"
                      @click="openThemeFilePicker"
                    >
                      <i class="fa-solid fa-file-arrow-up text-[11px]" />
                    </button>
                    <button
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border transition-all"
                      :style="actionIconStyle"
                      title="导出 CSS"
                      @click="exportThemeCss"
                    >
                      <i class="fa-solid fa-file-arrow-down text-[11px]" />
                    </button>
                    <button
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border transition-all"
                      :style="actionIconStyle"
                      title="保存 CSS"
                      @click="saveThemeCss"
                    >
                      <i class="fa-solid fa-floppy-disk text-[11px]" />
                    </button>
                    <button
                      class="flex h-8 w-8 cursor-pointer items-center justify-center border transition-all"
                      :style="actionIconStyle"
                      title="清空 CSS"
                      @click="clearThemeCss"
                    >
                      <i class="fa-solid fa-trash-can text-[11px]" />
                    </button>
                  </div>
                </div>
                <textarea
                  ref="themeCssInput"
                  class="vn-input min-h-36 w-full text-xs leading-5"
                  placeholder="粘贴或导入自定义 CSS，例如：\n[data-ui='dialogue-box'] { border-radius: 16px; }"
                  :value="store.settings.themeCustomCss"
                  @input="store.updateSettings({ themeCustomCss: ($event.target as HTMLTextAreaElement).value })"
                />
                <div
                  class="mt-2 flex flex-wrap items-center gap-2 text-[11px] leading-5"
                  style="color: var(--theme-text-muted, var(--vn-muted))"
                >
                  <span>当前内容：自定义 CSS</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="skin in SKIN_PRESETS"
                :key="skin.id"
                class="cursor-pointer border p-3 text-left transition-all duration-200"
                :style="{
                  borderColor:
                    store.settings.skinId === skin.id ? 'var(--theme-accent, var(--rust))' : 'rgba(90,79,64,0.4)',
                  background: store.settings.skinId === skin.id ? 'rgba(139,69,19,0.1)' : 'transparent',
                  borderRadius: '2px',
                }"
                @click="store.updateSettings({ skinId: skin.id })"
              >
                <div class="mb-1 text-xs font-bold" style="color: var(--theme-text-main, rgba(212, 197, 160, 0.9))">
                  {{ skin.name }}
                </div>
                <div style="font-size: 10px; color: var(--theme-text-muted, var(--vn-muted))">
                  {{ skin.description }}
                </div>
                <div
                  v-if="store.settings.skinId === skin.id"
                  style="
                    margin-top: 6px;
                    font-size: 9px;
                    color: var(--theme-accent, var(--rust));
                    font-family: monospace;
                    letter-spacing: 0.1em;
                  "
                >
                  [ 当前使用 ]
                </div>
              </button>
            </div>
          </div>

          <!-- Achievement -->
          <SectionHeader icon="fa-trophy" title="成就设置" />
          <div class="mb-6 pl-2">
            <div class="flex items-center justify-between py-2">
              <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))">显示成就列表</span>
              <ToggleSwitch
                :checked="store.settings.achievementListEnabled"
                @update="v => store.updateSettings({ achievementListEnabled: v })"
              />
            </div>
            <template v-if="store.settings.achievementListEnabled">
              <div class="flex items-center justify-between py-2">
                <span class="text-xs" style="color: var(--theme-text-soft, rgba(212, 197, 160, 0.7))"
                  >显示达成条件</span
                >
                <ToggleSwitch
                  :checked="store.settings.achievementShowCondition"
                  @update="v => store.updateSettings({ achievementShowCondition: v })"
                />
              </div>
              <SliderRow
                label="每页数量"
                :value="store.settings.achievementPageSize"
                :min="1"
                :max="10"
                @update="v => store.updateSettings({ achievementPageSize: v })"
              />
            </template>
          </div>

          <!-- Reset -->
          <div class="pt-4" :style="{ borderTop: '1px solid rgba(90,79,64,0.2)' }">
            <button
              class="flex cursor-pointer items-center gap-2 text-xs transition-colors"
              style="color: var(--theme-text-muted, var(--vn-muted))"
              @click="handleReset"
            >
              <i class="fa-solid fa-rotate-left" style="font-size: 0.75rem" />
              <span>恢复默认设置</span>
            </button>
          </div>
        </div>

        <div :style="decoBottomThin" />
        <div :style="decoBottomThick" />
      </div>
    </SkinShell>

    <!-- API Task Config Panel -->
    <ApiTaskConfigPanel v-if="showApiTaskConfig" @close="showApiTaskConfig = false" />

    <!-- Worldbook Manager Panel -->
    <WorldbookManagerPanel v-if="showWorldbookManager" @close="showWorldbookManager = false" />
  </div>
</template>

<script setup lang="ts">
import ApiTaskConfigPanel from '../common/ApiTaskConfigPanel.vue';
import SectionHeader from '../common/SectionHeader.vue';
import SkinShell from '../common/SkinShell.vue';
import SliderRow from '../common/SliderRow.vue';
import { useVNStore } from '../../store';
import { getThemeList } from '../../themes';
import ToggleSwitch from '../common/ToggleSwitch.vue';
import WorldbookManagerPanel from './WorldbookManagerPanel.vue';

const store = useVNStore();

const settingsPanelSkin = computed(() => store.getComponentSkinForCurrent('settingsPanel'));

const themeList = computed(() => getThemeList());

const currentFloorCount = computed(() => {
  try {
    return Math.max(1, getLastMessageId() + 1);
  } catch {
    return 100;
  }
});

const testingSecondApi = ref(false);
const secondApiTestResult = ref<string | null>(null);
const loadingPresetList = ref(false);
const presetList = ref<string[]>([]);
const showApiTaskConfig = ref(false);
const showWorldbookManager = ref(false);
const themeFileInput = ref<HTMLInputElement | null>(null);
const themeCssInput = ref<HTMLTextAreaElement | null>(null);

const actionIconStyle = {
  borderColor: 'rgba(90,79,64,0.42)',
  borderRadius: '9999px',
  color: 'var(--theme-text-muted, var(--vn-muted))',
  background: 'rgba(42,36,32,0.35)',
};

// 只要 URL 和 Key 已填写就允许测试（不依赖 secondApiStatus 避免降级状态干扰）
const canTestSecondApi = computed(() => !!(store.settings.secondApiUrl?.trim() && store.settings.secondApiKey?.trim()));

function refreshPresetList() {
  loadingPresetList.value = true;
  try {
    presetList.value = getPresetNames();
    console.info('[SettingsPanel] 获取预设列表:', presetList.value);
  } catch (e) {
    console.error('[SettingsPanel] 获取预设列表失败:', e);
    store.showToast('获取预设列表失败');
  } finally {
    loadingPresetList.value = false;
  }
}

async function testSecondApi() {
  if (!store.settings.secondApiModel?.trim()) {
    store.showToast('请先在「拉取模型」后选择一个模型，再测试连接');
    return;
  }
  testingSecondApi.value = true;
  secondApiTestResult.value = null;
  const success = await store.testSecondApiConnection();
  secondApiTestResult.value = success ? '连接成功 ✓' : '连接失败';
  testingSecondApi.value = false;
  setTimeout(() => {
    secondApiTestResult.value = null;
  }, 5000);
}

const SKIN_PRESETS = [
  { id: 'newspaper-default', name: '旧报', description: '泛黄报纸，油墨褪色' },
  { id: 'telegram', name: '电报', description: '深灰背景，打字机字体' },
  { id: 'wartime', name: '战时', description: '深红点缀，军事通讯风' },
  { id: 'archive', name: '档案', description: '牛皮纸色，公文档案风' },
];

const danmakuDisplayOptions = [
  { value: 'third', label: '1/3 屏' },
  { value: 'half', label: '半屏' },
  { value: 'full', label: '全屏' },
];

const panelShellStyle = {
  maxWidth: 'var(--theme-settings-panel-shell-max-width, var(--theme-panel-shell-max-width, min(100%, 42rem)))',
  maxHeight: 'var(--theme-settings-panel-shell-max-height, var(--theme-panel-shell-max-height, 90%))',
};

const panelStyle = {
  width: '100%',
  height: '100%',
  maxHeight: 'var(--theme-panel-max-height, 100%)',
  borderColor: 'var(--theme-panel-border, rgba(90,79,64,0.6))',
  background: 'var(--theme-panel-bg, var(--vn-panel-bg))',
  backdropFilter: 'blur(var(--theme-panel-content-blur, 12px)) saturate(var(--theme-panel-content-saturate, 100%))',
  display: 'flex',
  flexDirection: 'column',
};
const headerBorder = { borderBottom: '1px solid rgba(90,79,64,0.3)' };
const decoTopThick = {
  height: '3px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.6)), transparent)',
};
const decoTopThin = {
  height: '1px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottomThin = {
  height: '1px',
  background: 'linear-gradient(to right, transparent, rgba(139,69,19,0.3), transparent)',
};
const decoBottomThick = {
  height: '2px',
  marginTop: '1px',
  background: 'linear-gradient(to right, transparent, var(--theme-accent-soft, rgba(139,69,19,0.5)), transparent)',
};

async function handleThemeFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.css')) {
    store.showToast('只支持 .css 文件');
    input.value = '';
    return;
  }

  try {
    const content = await file.text();
    store.updateSettings({
      themeEnabled: true,
      themeImportedCssName: file.name,
      themeImportedCssContent: content,
      themeCustomCss: content,
    });
    store.showToast(`已导入 CSS：${file.name}`);
  } catch (e) {
    console.error('[SettingsPanel] 导入主题 CSS 失败:', e);
    store.showToast('导入 CSS 失败');
  } finally {
    input.value = '';
  }
}

function openThemeFilePicker() {
  if (themeFileInput.value) themeFileInput.value.click();
}

function getThemeCssExportContent() {
  return store.settings.themeCustomCss.trim() || '/* 空主题 CSS */\n';
}

function exportThemeCss() {
  const content = getThemeCssExportContent();
  const blob = new Blob([content], { type: 'text/css;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${store.settings.themeImportedCssName?.replace(/\.css$/i, '') || 'galgame-theme'}.css`;
  a.click();
  URL.revokeObjectURL(url);
  store.showToast('已导出 CSS');
}

function saveThemeCss() {
  store.updateSettings({
    themeEnabled: true,
    themeCustomCss: store.settings.themeCustomCss.trim(),
  });
  store.showToast('已保存主题 CSS');
}

function clearThemeCss() {
  store.updateSettings({
    themeCustomCss: '',
    themeImportedCssName: '',
    themeImportedCssContent: '',
    themeEnabled: true,
  });
}

// 初始化时加载预设列表
onMounted(() => {
  refreshPresetList();
});
</script>
