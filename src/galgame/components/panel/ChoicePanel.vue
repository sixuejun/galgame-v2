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
    <div data-ui="choice-panel-list" class="pointer-events-auto absolute" :style="choicePanelListStyle">
      <!-- Two-column layout: option count >= 4 -->
      <template v-if="useTwoColumn">
        <div class="choice-grid" :style="choiceGridStyle">
          <!-- Left column: items at indices 0, 2, 4 -->
          <div class="choice-two-col flex flex-1 flex-col" :style="{ gap: 'var(--theme-choice-list-gap, 0.5rem)' }">
            <div
              v-for="choice in leftColumnChoices"
              :key="choice.choiceId"
              class="choice-btn-shell w-full"
              :class="{ 'is-hovered': isHovered(choice.choiceId), 'is-selected': isSelected(choice.choiceId) }"
              @mouseenter="hoveredChoiceId = choice.choiceId"
              @mouseleave="hoveredChoiceId = null"
            >
              <SkinShell
                :skin="choiceButtonSkin"
                :hovered="isHovered(choice.choiceId)"
                :active="isSelected(choice.choiceId)"
                :shell-style="{
                  height: 'var(--theme-choice-btn-shell-height, auto)',
                }"
                object-fit="contain"
              >
                <ChoiceButtonContent
                  :choice="choice"
                  :index="choice.colIndex"
                  :is-selected="isSelected(choice.choiceId)"
                  :is-hovered="isHovered(choice.choiceId)"
                  :is-locked="store.choiceLocked"
                  @select="handleSelect"
                  @custom-input="handleCustomInput"
                  @custom-submit="handleCustomSubmit"
                />
              </SkinShell>
            </div>
          </div>

          <!-- Right column: items at indices 1, 3, 5 -->
          <div class="choice-two-col flex flex-1 flex-col" :style="{ gap: 'var(--theme-choice-list-gap, 0.5rem)' }">
            <div
              v-for="choice in rightColumnChoices"
              :key="choice.choiceId"
              class="choice-btn-shell w-full"
              :class="{ 'is-hovered': isHovered(choice.choiceId), 'is-selected': isSelected(choice.choiceId) }"
              @mouseenter="hoveredChoiceId = choice.choiceId"
              @mouseleave="hoveredChoiceId = null"
            >
              <SkinShell
                :skin="choiceButtonSkin"
                :hovered="isHovered(choice.choiceId)"
                :active="isSelected(choice.choiceId)"
                :shell-style="{
                  height: 'var(--theme-choice-btn-shell-height, auto)',
                }"
                object-fit="contain"
              >
                <ChoiceButtonContent
                  :choice="choice"
                  :index="choice.colIndex"
                  :is-selected="isSelected(choice.choiceId)"
                  :is-hovered="isHovered(choice.choiceId)"
                  :is-locked="store.choiceLocked"
                  @select="handleSelect"
                  @custom-input="handleCustomInput"
                  @custom-submit="handleCustomSubmit"
                />
              </SkinShell>
            </div>
          </div>
        </div>
      </template>

      <!-- Single column layout -->
      <template v-else>
        <div
          class="choice-list"
          :style="{ display: 'flex', flexDirection: 'column', gap: 'var(--theme-choice-list-gap, 0.5rem)' }"
        >
          <div
            v-for="(choice, index) in choices"
            :key="choice.choiceId"
            class="choice-btn-shell choice-item w-full"
            :class="{ 'is-hovered': isHovered(choice.choiceId), 'is-selected': isSelected(choice.choiceId) }"
            @mouseenter="hoveredChoiceId = choice.choiceId"
            @mouseleave="hoveredChoiceId = null"
          >
            <SkinShell
              :skin="choiceButtonSkin"
              :hovered="isHovered(choice.choiceId)"
              :active="isSelected(choice.choiceId)"
              :shell-style="{ height: 'var(--theme-choice-btn-shell-height, auto)' }"
              object-fit="contain"
            >
              <ChoiceButtonContent
                :choice="choice"
                :index="index"
                :is-selected="isSelected(choice.choiceId)"
                :is-hovered="isHovered(choice.choiceId)"
                :is-locked="store.choiceLocked"
                @select="handleSelect"
                @custom-input="handleCustomInput"
                @custom-submit="handleCustomSubmit"
              />
            </SkinShell>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVNStore, type Choice } from '../../store';
import SkinShell from '../common/SkinShell.vue';
import ChoiceButtonContent from './ChoiceButtonContent.vue';

const props = defineProps<{
  choices: Choice[];
  messageId: number;
}>();

const emit = defineEmits<{
  choiceSubmitted: [choiceId: string, text: string];
}>();

const store = useVNStore();
let submitTimeout: ReturnType<typeof setTimeout> | null = null;

// Track hovered choice for skin state
const hoveredChoiceId = ref<string | null>(null);

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
  zIndex: 1,
  display: 'flex' as const,
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
}));

const choiceGridStyle = {
  display: 'flex' as const,
  flexDirection: 'row' as const,
  gap: 'var(--theme-choice-list-gap, 0.5rem)',
  width: '100%',
};

const useTwoColumn = computed(() => props.choices.length >= 4);
const displayChoices = computed(() => props.choices.slice(0, 6));

const leftColumnChoices = computed(() =>
  displayChoices.value.filter((_, i) => i % 2 === 0).map((choice, i) => ({ ...choice, colIndex: i * 2 })),
);

const rightColumnChoices = computed(() =>
  displayChoices.value.filter((_, i) => i % 2 === 1).map((choice, i) => ({ ...choice, colIndex: i * 2 + 1 })),
);

function isSelected(id: string) {
  return store.selectedChoiceId === id;
}

function isHovered(id: string) {
  return hoveredChoiceId.value === id;
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

function handleCustomInput(value: string) {
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

onBeforeUnmount(() => {
  if (submitTimeout) clearTimeout(submitTimeout);
});
</script>

<style scoped>
/* Non-PNG theme choice button: CSS fallback background/border/shadow */
.choice-btn-shell {
  background: var(--theme-choice-btn-bg, var(--vn-choice-bg, rgba(42, 36, 32, 0.65)));
  border: 1px solid var(--theme-choice-btn-border, var(--vn-border, transparent));
  box-shadow: var(--theme-choice-btn-shadow, none);
  border-radius: var(--theme-choice-btn-radius, var(--theme-button-radius, 12px));
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.choice-btn-shell.is-hovered {
  background: var(--theme-choice-btn-hover-bg, transparent);
  border-color: var(--theme-choice-btn-hover-border, transparent);
  box-shadow: var(--theme-choice-btn-hover-shadow, none);
}

.choice-btn-shell.is-selected {
  background: var(--theme-choice-btn-selected-bg, transparent);
  border-color: var(--theme-choice-btn-selected-border, transparent);
  box-shadow: var(--theme-choice-btn-selected-shadow, none);
}
</style>
