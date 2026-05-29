export interface ComponentSkin {
  shellImage: string | null;
  shellSize: { width: string; height: string };
  contentInset: { top: string; right: string; bottom: string; left: string };
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
  | 'choicePanel'
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
  cssVars: Record<string, string>;
  components: Partial<Record<ComponentKey, ComponentSkin>>;
}
