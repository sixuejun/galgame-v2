<template>
  <!-- Root does NOT block clicks; only the list is interactive -->
  <div
    v-if="choices.length > 0"
    data-ui="choice-panel"
    class="pointer-events-none absolute inset-0"
    style="z-index: 30"
  >
    <!-- Backdrop: purely visual, does not block clicks -->
    <div
      data-ui="choice-panel-backdrop"
      class="pointer-events-none absolute inset-0"
      style="background: var(--theme-choice-backdrop, rgba(42, 36, 32, 0.3))"
    />

    <!-- Choice list: interactive area only -->
    <div
      data-ui="choice-panel-list"
      class="pointer-events-auto absolute"
      :style="{ ...choicePanelListStyle, zIndex: 1 }"
    >
      <!-- Two-column layout: option count >= 4 -->
      <template v-if="useTwoColumn">
        <div class="choice-grid" :style="choiceGridStyle">
          <!-- Left column: items at indices 0, 2, 4 -->
          <div class="choice-two-col flex-1">
            <div v-for="choice in leftColumnChoices" :key="choice.choiceId" class="w-full">
              <SkinShell :skin="choiceButtonSkin" disable-aspect-ratio>
                <template v-if="choice.isCustomInput">
                  <div
                    data-ui="button"
                    class="choice-button relative w-full cursor-pointer transition-all duration-200"
                    :style="{
                      background: 'var(--theme-choice-btn-bg)',
                      border: 'var(--theme-choice-btn-border)',
                      boxShadow: 'var(--theme-choice-btn-shadow)',
                      opacity: store.choiceLocked ? 0.5 : 1,
                      pointerEvents: store.choiceLocked ? 'none' : 'auto',
                    }"
                    @click="handleSelect(choice.choiceId)"
                  >
                    <div
                      :style="{
                        height: '1px',
                        background: 'linear-gradient(to right, transparent, rgba(139, 90, 43, 0.3), transparent)',
                      }"
                    />
                    <div class="flex items-start" :style="choiceButtonContentStyle">
                      <span
                        style="
                          color: var(--theme-choice-letter-color);
                          font-family: var(--theme-choice-letter-font-family);
                          font-size: var(--theme-choice-letter-font-size);
                          padding-top: 2px;
                        "
                      >
                        {{ String.fromCharCode(65 + choice.colIndex) }}.
                      </span>
                      <textarea
                        ref="inputRef"
                        :value="store.customInputText"
                        placeholder="自由输入..."
                        rows="1"
                        class="flex-1 resize-none bg-transparent outline-none"
                        :style="{
                          color: 'var(--theme-choice-text-color)',
                          fontFamily: 'var(--theme-choice-text-font-family)',
                          fontSize: 'var(--theme-choice-text-font-size)',
                        }"
                        @input="handleCustomInput"
                        @keydown.enter.ctrl="handleCustomSubmit"
                        @keydown.enter.exact.prevent
                        @click.stop="!isSelected(choice.choiceId) && handleSelect(choice.choiceId)"
                      />
                      <button
                        v-if="store.customInputText.trim()"
                        class="mt-1 cursor-pointer transition-colors"
                        style="color: var(--theme-accent)"
                        @click.stop="handleCustomSubmit"
                      >
                        <i class="fa-solid fa-paper-plane" style="font-size: 0.875rem" />
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <button
                    data-ui="button"
                    class="choice-button relative w-full cursor-pointer text-left transition-all duration-200"
                    :style="{
                      background: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-bg)'
                        : 'var(--theme-choice-btn-bg)',
                      border: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-border)'
                        : 'var(--theme-choice-btn-border)',
                      boxShadow: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-shadow)'
                        : 'var(--theme-choice-btn-shadow)',
                      opacity: store.choiceLocked ? 0.5 : 1,
                      pointerEvents: store.choiceLocked ? 'none' : 'auto',
                    }"
                    :disabled="store.choiceLocked"
                    @click.stop="handleSelect(choice.choiceId)"
                  >
                    <div
                      :style="{
                        height: '1px',
                        background: 'linear-gradient(to right, transparent, rgba(139, 90, 43, 0.3), transparent)',
                      }"
                    />
                    <div class="flex items-center" :style="choiceButtonContentStyle">
                      <span
                        style="
                          color: var(--theme-choice-letter-color);
                          font-family: var(--theme-choice-letter-font-family);
                          font-size: var(--theme-choice-letter-font-size);
                        "
                      >
                        {{ String.fromCharCode(65 + choice.colIndex) }}.
                      </span>
                      <span
                        :style="{
                          color: 'var(--theme-choice-text-color)',
                          fontFamily: 'var(--theme-choice-text-font-family)',
                          fontSize: 'var(--theme-choice-text-font-size)',
                          fontWeight: 'var(--theme-choice-text-font-weight)',
                        }"
                      >
                        {{ choice.text }}
                      </span>
                    </div>
                  </button>
                </template>
              </SkinShell>
            </div>
          </div>

          <!-- Right column: items at indices 1, 3, 5 -->
          <div class="choice-two-col flex-1">
            <div v-for="choice in rightColumnChoices" :key="choice.choiceId" class="w-full">
              <SkinShell :skin="choiceButtonSkin" disable-aspect-ratio>
                <template v-if="choice.isCustomInput">
                  <div
                    data-ui="button"
                    class="choice-button relative w-full cursor-pointer transition-all duration-200"
                    :style="{
                      background: 'var(--theme-choice-btn-bg)',
                      border: 'var(--theme-choice-btn-border)',
                      boxShadow: 'var(--theme-choice-btn-shadow)',
                      opacity: store.choiceLocked ? 0.5 : 1,
                      pointerEvents: store.choiceLocked ? 'none' : 'auto',
                    }"
                    @click="handleSelect(choice.choiceId)"
                  >
                    <div
                      :style="{
                        height: '1px',
                        background: 'linear-gradient(to right, transparent, rgba(139, 90, 43, 0.3), transparent)',
                      }"
                    />
                    <div class="flex items-start" :style="choiceButtonContentStyle">
                      <span
                        style="
                          color: var(--theme-choice-letter-color);
                          font-family: var(--theme-choice-letter-font-family);
                          font-size: var(--theme-choice-letter-font-size);
                          padding-top: 2px;
                        "
                      >
                        {{ String.fromCharCode(65 + choice.colIndex) }}.
                      </span>
                      <textarea
                        ref="inputRef"
                        :value="store.customInputText"
                        placeholder="自由输入..."
                        rows="1"
                        class="flex-1 resize-none bg-transparent outline-none"
                        :style="{
                          color: 'var(--theme-choice-text-color)',
                          fontFamily: 'var(--theme-choice-text-font-family)',
                          fontSize: 'var(--theme-choice-text-font-size)',
                        }"
                        @input="handleCustomInput"
                        @keydown.enter.ctrl="handleCustomSubmit"
                        @keydown.enter.exact.prevent
                        @click.stop="!isSelected(choice.choiceId) && handleSelect(choice.choiceId)"
                      />
                      <button
                        v-if="store.customInputText.trim()"
                        class="mt-1 cursor-pointer transition-colors"
                        style="color: var(--theme-accent)"
                        @click.stop="handleCustomSubmit"
                      >
                        <i class="fa-solid fa-paper-plane" style="font-size: 0.875rem" />
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <button
                    data-ui="button"
                    class="choice-button relative w-full cursor-pointer text-left transition-all duration-200"
                    :style="{
                      background: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-bg)'
                        : 'var(--theme-choice-btn-bg)',
                      border: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-border)'
                        : 'var(--theme-choice-btn-border)',
                      boxShadow: isSelected(choice.choiceId)
                        ? 'var(--theme-choice-btn-selected-shadow)'
                        : 'var(--theme-choice-btn-shadow)',
                      opacity: store.choiceLocked ? 0.5 : 1,
                      pointerEvents: store.choiceLocked ? 'none' : 'auto',
                    }"
                    :disabled="store.choiceLocked"
                    @click.stop="handleSelect(choice.choiceId)"
                  >
                    <div
                      :style="{
                        height: '1px',
                        background: 'linear-gradient(to right, transparent, rgba(139, 90, 43, 0.3), transparent)',
                      }"
                    />
                    <div class="flex items-center" :style="choiceButtonContentStyle">
                      <span
                        style="
                          color: var(--theme-choice-letter-color);
                          font-family: var(--theme-choice-letter-font-family);
                          font-size: var(--theme-choice-letter-font-size);
                        "
                      >
                        {{ String.fromCharCode(65 + choice.colIndex) }}.
                      </span>
                      <span
                        :style="{
                          color: 'var(--theme-choice-text-color)',
                          fontFamily: 'var(--theme-choice-text-font-family)',
                          fontSize: 'var(--theme-choice-text-font-size)',
                          fontWeight: 'var(--theme-choice-text-font-weight)',
                        }"
                      >
                        {{ choice.text }}
                      </span>
                    </div>
                  </button>
                </template>
              </SkinShell>
            </div>
          </div>
        </div>
      </template>

      <!-- Single column layout -->
      <template v-else>
        <template v-for="(choice, index) in choices" :key="choice.choiceId">
          <div v-if="choice.isCustomInput" class="choice-item">
            <SkinShell :skin="choiceButtonSkin">
              <div
                data-ui="button"
                class="choice-button relative w-full cursor-pointer transition-all duration-200"
                :style="{
                  background: 'var(--theme-choice-btn-bg)',
                  border: 'var(--theme-choice-btn-border)',
                  boxShadow: 'var(--theme-choice-btn-shadow)',
                  opacity: store.choiceLocked ? 0.5 : 1,
                  pointerEvents: store.choiceLocked ? 'none' : 'auto',
                }"
                @click="handleSelect(choice.choiceId)"
              >
                <div
                  :style="{
                    height: '1px',
                    background: 'linear-gradient(to right, transparent, rgba(90, 79, 64, 0.4), transparent)',
                  }"
                />
                <div class="flex items-start" :style="choiceButtonContentStyle">
                  <span
                    style="
                      color: var(--theme-choice-letter-color);
                      font-family: var(--theme-choice-letter-font-family);
                      font-size: var(--theme-choice-letter-font-size);
                      padding-top: 2px;
                    "
                  >
                    {{ String.fromCharCode(65 + index) }}.
                  </span>
                  <textarea
                    ref="inputRef"
                    :value="store.customInputText"
                    placeholder="自由输入..."
                    rows="2"
                    class="flex-1 resize-none bg-transparent outline-none"
                    :style="{
                      color: 'var(--theme-choice-text-color)',
                      fontFamily: 'var(--theme-choice-text-font-family)',
                      fontSize: 'var(--theme-choice-text-font-size)',
                      minHeight: '2.5rem',
                    }"
                    @input="handleCustomInput"
                    @keydown.enter.ctrl="handleCustomSubmit"
                    @keydown.enter.exact.prevent
                    @click.stop="!isSelected(choice.choiceId) && handleSelect(choice.choiceId)"
                  />
                  <button
                    v-if="store.customInputText.trim()"
                    class="mt-1 cursor-pointer transition-colors"
                    style="color: var(--theme-accent)"
                    @click.stop="handleCustomSubmit"
                  >
                    <i class="fa-solid fa-paper-plane" style="font-size: 0.875rem" />
                  </button>
                </div>
              </div>
            </SkinShell>
          </div>

          <div v-else class="choice-item">
            <SkinShell :skin="choiceButtonSkin">
              <button
                data-ui="button"
                class="choice-button relative w-full cursor-pointer text-left transition-all duration-200"
                :style="{
                  background: isSelected(choice.choiceId)
                    ? 'var(--theme-choice-btn-selected-bg)'
                    : 'var(--theme-choice-btn-bg)',
                  border: isSelected(choice.choiceId)
                    ? 'var(--theme-choice-btn-selected-border)'
                    : 'var(--theme-choice-btn-border)',
                  boxShadow: 'var(--theme-choice-btn-shadow)',
                  opacity: store.choiceLocked ? 0.5 : 1,
                  pointerEvents: store.choiceLocked ? 'none' : 'auto',
                }"
                :disabled="store.choiceLocked"
                @click.stop="handleSelect(choice.choiceId)"
              >
                <div
                  :style="{
                    height: '1px',
                    background: 'linear-gradient(to right, transparent, rgba(90, 79, 64, 0.4), transparent)',
                  }"
                />
                <div class="flex items-center" :style="choiceButtonContentStyle">
                  <span
                    style="
                      color: var(--theme-choice-letter-color);
                      font-family: var(--theme-choice-letter-font-family);
                      font-size: var(--theme-choice-letter-font-size);
                    "
                  >
                    {{ String.fromCharCode(65 + index) }}.
                  </span>
                  <span
                    :style="{
                      color: 'var(--theme-choice-text-color)',
                      fontFamily: 'var(--theme-choice-text-font-family)',
                      fontSize: 'var(--theme-choice-text-font-size)',
                      fontWeight: 'var(--theme-choice-text-font-weight)',
                    }"
                  >
                    {{ choice.text }}
                  </span>
                </div>
              </button>
            </SkinShell>
          </div>
        </template>
      </template>

      <!-- Submit area -->
      <div v-if="selectedChoice" class="pointer-events-auto mt-4 flex items-center justify-center gap-2">
        <button
          class="choice-submit-btn"
          :disabled="store.choiceLocked"
          :style="{
            background: 'var(--theme-choice-submit-bg)',
            border: 'var(--theme-choice-submit-border)',
            boxShadow: 'var(--theme-choice-submit-shadow)',
            color: 'var(--theme-choice-submit-color)',
            opacity: store.choiceLocked ? 0.5 : 1,
          }"
          @click.stop="handleSubmit"
        >
          确认
        </button>
        <button
          class="choice-cancel-btn"
          :disabled="store.choiceLocked"
          :style="{
            background: 'transparent',
            border: '1px solid var(--theme-choice-cancel-border)',
            color: 'var(--theme-choice-cancel-color)',
            opacity: store.choiceLocked ? 0.5 : 1,
          }"
          @click.stop="handleDeselectChoice"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore, type Choice } from '../../store';
import SkinShell from '../common/SkinShell.vue';

const props = defineProps<{
  choices: Choice[];
  messageId: number;
}>();

const emit = defineEmits<{
  choiceSubmitted: [choiceId: string, text: string];
}>();

const store = useVNStore();
const inputRef = ref<HTMLInputElement | null>(null);
watchEffect(() => {
  void inputRef.value;
});
let submitTimeout: ReturnType<typeof setTimeout> | null = null;

const choiceButtonSkin = computed(() => store.getComponentSkinForCurrent('choiceButton' as any));

const choicePanelListStyle = computed(() => ({
  left: 'var(--theme-choice-left, 50%)',
  bottom: store.settings.portraitMode
    ? 'var(--theme-choice-bottom-portrait, 8rem)'
    : 'var(--theme-choice-bottom, 11rem)',
  width: 'var(--theme-choice-width, 100%)',
  maxWidth: useTwoColumn.value
    ? 'var(--theme-choice-two-col-max-width, 64rem)'
    : 'var(--theme-choice-max-width, 32rem)',
  paddingLeft: 'var(--theme-choice-padding-x, 1rem)',
  paddingRight: 'var(--theme-choice-padding-x, 1rem)',
  transform: 'translate(var(--theme-choice-translate-x, -50%), var(--theme-choice-translate-y, 0px))',
}));

const choiceButtonContentStyle = {
  padding: 'var(--theme-choice-button-padding, 0.75rem)',
  gap: 'var(--theme-choice-button-gap, 0.75rem)',
};

const useTwoColumn = computed(() => props.choices.length >= 4);
const displayChoices = computed(() => props.choices.slice(0, 6));

const leftColumnChoices = computed(() =>
  displayChoices.value.filter((_, i) => i % 2 === 0).map((choice, i) => ({ ...choice, colIndex: i * 2 })),
);

const rightColumnChoices = computed(() =>
  displayChoices.value.filter((_, i) => i % 2 === 1).map((choice, i) => ({ ...choice, colIndex: i * 2 + 1 })),
);

const choiceGridStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  gap: 'var(--theme-choice-list-gap, 0.5rem)',
  width: '100%',
};

const selectedChoice = computed(() => {
  const id = store.selectedChoiceId;
  if (!id) return null;
  return props.choices.find(c => c.choiceId === id) ?? null;
});

function isSelected(id: string) {
  return store.selectedChoiceId === id;
}

function handleSelect(choiceId: string) {
  if (store.choiceLocked) return;

  if (store.selectedChoiceId === choiceId) {
    store.selectChoice(null);
    return;
  }

  store.selectChoice(choiceId);

  const choice = props.choices.find(c => c.choiceId === choiceId);
  if (choice && !choice.isCustomInput) {
    submitTimeout = setTimeout(() => {
      store.lockChoice();
      const text = choice.text;
      setTimeout(() => {
        emit('choiceSubmitted', choiceId, text);
        store.clearChoices();
      }, 300);
    }, 200);
  }
}

function handleCustomInput(e: Event) {
  const value = (e.target as HTMLTextAreaElement).value;
  store.customInputText = value;
}

function handleCustomSubmit() {
  if (store.choiceLocked) return;

  const selectedId = store.selectedChoiceId;
  if (!selectedId) return;

  const choice = props.choices.find(c => c.choiceId === selectedId);
  if (!choice?.isCustomInput) return;

  const text = store.customInputText.trim();
  if (!text) return;

  store.lockChoice();
  if (submitTimeout) {
    clearTimeout(submitTimeout);
    submitTimeout = null;
  }

  emit('choiceSubmitted', selectedId, text);
  store.clearChoices();
  store.customInputText = '';
}

function handleSubmit() {
  if (store.choiceLocked) return;

  const selected = selectedChoice.value;
  if (!selected) return;

  if (selected.isCustomInput) {
    handleCustomSubmit();
    return;
  }

  store.lockChoice();
  if (submitTimeout) {
    clearTimeout(submitTimeout);
    submitTimeout = null;
  }

  emit('choiceSubmitted', selected.choiceId, selected.text);
  store.clearChoices();
}

function handleDeselectChoice() {
  if (store.choiceLocked) return;
  store.selectChoice(null);
}

onBeforeUnmount(() => {
  if (submitTimeout) clearTimeout(submitTimeout);
});
</script>
