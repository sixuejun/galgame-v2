export interface ComponentSkin {
  shellImage: string | null;
  shellSize: { width: string; height: string };
  contentInset: { top: string; right: string; bottom: string; left: string };
  /** 图片适配方式：cover 铺满裁剪、contain 完整显示。默认 cover。 */
  objectFit?: 'cover' | 'contain';
  states?: {
    hover?: string;
    active?: string;
    disabled?: string;
  };
}

export type ComponentKey =
  | 'dialogue'
  | 'dialoguePortrait'
  | 'dialogueName'
  | 'dialogueText'
  | 'dialogueNavPrev'
  | 'dialogueNavNext'
  | 'button'
  | 'buttonExpanded'
  | 'choiceButton'
  | 'choicePanel'
  | 'inputPanel'
  | 'characterPanel'
  | 'settingsPanel'
  | 'historyPanel'
  | 'stageFrame'
  | 'quickMenuCollapsedLeft'
  | 'quickMenuCollapsedRight'
  | 'quickMenuExpandedLeft'
  | 'quickMenuExpandedRight'
  | 'achievementNotch';

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  usesImageShell: boolean;
  /** 为 true 时在主题列表中隐藏，但仍然可以通过 themeId 直接切换使用 */
  hidden?: boolean;
  cssVars: Record<string, string>;
  components: Partial<Record<ComponentKey, ComponentSkin>>;
}
