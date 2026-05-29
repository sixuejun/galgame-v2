import type { ThemeDefinition } from './types';

export const newspaperTheme: ThemeDefinition = {
  id: 'newspaper',
  name: '报纸',
  description: '偏复古、纸张感的默认视觉风格',
  usesImageShell: false,
  cssVars: {
    // 基础色
    '--theme-bg': 'var(--vn-bg)',
    '--theme-fg': 'var(--vn-fg)',
    '--theme-muted': 'var(--vn-muted)',
    '--theme-accent': 'var(--rust)',
    '--theme-accent-soft': 'rgba(139, 69, 19, 0.6)',
    '--theme-line-color': 'rgba(90, 79, 64, 0.4)',
    '--theme-surface-border': 'rgba(90, 79, 64, 0.55)',
    '--theme-surface-soft': 'rgba(212, 197, 160, 0.05)',

    // 旧主题变量兼容：补充报纸主题缺失的兼容变量
    '--vn-bg': 'rgba(42, 36, 32, 0.92)',
    '--vn-fg': 'rgba(212, 197, 160, 0.92)',
    '--vn-muted': 'rgba(139, 125, 107, 0.8)',
    '--vn-border': 'rgba(90, 79, 64, 0.55)',
    '--vn-panel-bg': 'rgba(35, 30, 25, 0.88)',
    '--vn-dialogue-bg': 'rgba(35, 30, 25, 0.88)',
    '--vn-choice-bg': 'rgba(42, 36, 32, 0.85)',
    '--vn-choice-hover': 'rgba(90, 79, 64, 0.3)',
    '--vn-choice-selected': 'rgba(110, 71, 54, 0.35)',
    '--rust': 'rgba(139, 69, 19, 0.95)',
    '--rust-light': 'rgba(139, 69, 19, 0.6)',
    '--rust-faded': 'rgba(139, 69, 19, 0.4)',

    // 文本颜色
    '--theme-text-main': 'rgba(212, 197, 160, 0.92)',
    '--theme-text-soft': 'rgba(212, 197, 160, 0.7)',
    '--theme-text-muted': 'rgba(139, 125, 107, 0.8)',
    '--theme-text-faint': 'rgba(139, 125, 107, 0.5)',
    '--theme-text-inverse': 'rgba(42, 36, 32, 0.9)',
    '--theme-user-text': '#5c8a9c',
    '--theme-dialogue-name-color': 'var(--rust)',
    '--theme-font-body': 'Georgia, "Times New Roman", serif',
    '--theme-font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

    // 舞台背景
    '--theme-bg-gradient': 'linear-gradient(to bottom, rgba(42,36,32,0.8), rgba(74,64,53,0.6), rgba(42,36,32,0.9))',
    '--theme-stage-vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(42,36,32,0.5) 100%)',

    // 对话框（使用相对单位，避免缩放后大小/位置变化）
    '--theme-dialogue-bg': 'var(--vn-dialogue-bg)',
    '--theme-dialogue-border': 'rgba(90,79,64,0.6)',
    '--theme-dialogue-radius': '0px',
    '--theme-dialogue-shadow': 'inset 0 0 0.5em rgba(42,36,32,0.3), 0 0.25em 0.75em rgba(0,0,0,0.4)',
    '--theme-dialogue-padding': '0px',
    '--theme-dialogue-width': '100%',
    '--theme-dialogue-height': 'auto',
    '--theme-dialogue-min-height': '8em',
    '--theme-dialogue-text-padding-top': '2em',
    '--theme-dialogue-text-padding-right': '6em',
    '--theme-dialogue-text-padding-bottom': '1em',
    '--theme-dialogue-text-padding-left': '6em',
    '--theme-dialogue-text-max-height': '6em',
    '--theme-dialogue-bottom': '0.5em',
    '--theme-dialogue-margin-x': '0em',
    '--theme-dialogue-margin-x-md': '1em',
    '--theme-dialogue-margin-x-lg': '2em',

    // 竖屏模式对话框位置
    '--theme-dialogue-bottom-portrait': '34vmin',
    '--theme-dialogue-portrait-padding-x': '2vmin',
    '--theme-dialogue-translate-x': '0px',
    '--theme-dialogue-translate-y': '0px',
    '--theme-dialogue-min-height-portrait': '20vmin',

    // 翻页按钮
    '--theme-dialogue-nav-btn-size': '3.5em',
    '--theme-dialogue-nav-prev-top': '50%',
    '--theme-dialogue-nav-prev-left': '1.75em',
    '--theme-dialogue-nav-next-top': '50%',
    '--theme-dialogue-nav-next-right': '1.75em',
    '--theme-dialogue-nav-color': 'rgba(139, 69, 19, 0.6)',
    '--theme-dialogue-nav-hover-color': 'rgba(198, 184, 149, 0.6)',
    '--theme-dialogue-nav-disabled-opacity': '0.2',

    // 名字框
    '--theme-dialogue-name-top': '0.6em',
    '--theme-dialogue-name-left': '6em',
    '--theme-dialogue-name-max-width': '10em',
    '--theme-dialogue-name-font-size': '1em',
    '--theme-dialogue-name-align-items': 'flex-start',
    '--theme-dialogue-name-padding-left': '0px',
    '--theme-dialogue-name-padding-top': '0px',

    // 头像壳（普通模式）
    '--theme-dialogue-portrait-top': '0.5em',
    '--theme-dialogue-portrait-left': '0.75em',
    '--theme-dialogue-portrait-width': '4em',
    '--theme-dialogue-portrait-height': '4em',
    '--theme-dialogue-portrait-display': 'none', // 报纸主题隐藏头像壳
    // 头像壳（竖屏模式）
    '--theme-dialogue-portrait-bottom-portrait': 'calc(16vmin + 3vmin)',
    '--theme-dialogue-portrait-left-portrait': '1.5vmin',

    // 黑屏文字
    '--theme-blacktext-bg': '#1a1510',
    '--theme-blacktext-color': 'rgba(212, 197, 160, 0.9)',
    '--theme-blacktext-hint-color': 'rgba(139, 125, 107, 0.7)',
    '--theme-blacktext-arrow-color': 'rgba(139, 69, 19, 0.6)',
    '--theme-blacktext-arrow-hover-color': 'rgba(139, 69, 19, 0.9)',

    // 按钮（使用相对单位）
    '--theme-button-bg': 'rgba(42,36,32,0.85)',
    '--theme-button-border': 'rgba(139,69,19,0.5)',
    '--theme-button-radius': '0.1em',
    '--theme-button-padding-y': '0.375em',
    '--theme-button-padding-x': '0.75em',

    // 选项面板（使用相对单位）
    '--theme-choice-backdrop': 'rgba(42, 36, 32, 0.3)',
    '--theme-choice-left': '50%',
    '--theme-choice-bottom': '15em',
    '--theme-choice-width': '100%',
    '--theme-choice-max-width': '28em',
    '--theme-choice-padding-x': '1em',
    '--theme-choice-list-gap': '0.5em',
    '--theme-choice-translate-x': '-50%',
    '--theme-choice-button-padding': '0.6em 0.8em',
    '--theme-choice-button-gap': '0.5em',

    // 弹窗面板（使用相对单位）
    '--theme-panel-bg': 'var(--vn-panel-bg)',
    '--theme-panel-border': 'rgba(90,79,64,0.55)',
    '--theme-panel-radius': '0px',
    '--theme-panel-shell-max-width': 'min(100%, 42em)',
    '--theme-panel-shell-max-height': '82%',
    '--theme-panel-max-height': '100%',
    '--theme-panel-backdrop': 'rgba(42, 36, 32, 0.7)',
    '--theme-panel-backdrop-blur': '0.25em',
    '--theme-panel-content-blur': '0.75em',
    '--theme-panel-content-saturate': '100%',

    // 历史面板专用颜色
    '--theme-history-info-color': 'rgba(139, 125, 107, 0.8)',
    '--theme-history-index-color': 'rgba(139, 125, 107, 0.5)',
    '--theme-history-speaker-color': 'var(--rust)',
    '--theme-history-text-color': 'rgba(212, 197, 160, 0.8)',
    '--theme-history-narration-color': 'rgba(212, 197, 160, 0.6)',
    '--theme-history-active-bg': 'rgba(139,69,19,0.1)',
    '--theme-history-row-border': 'rgba(90,79,64,0.1)',
    '--theme-history-header-border': 'rgba(90,79,64,0.2)',

    // 顶部快捷菜单（使用相对单位）
    '--theme-quick-menu-top': '0.75em',
    '--theme-quick-menu-left-top': '0.75em',
    '--theme-quick-menu-right-top': '0.75em',
    '--theme-quick-menu-left': '0.5em',
    '--theme-quick-menu-right': '0.5em',
    '--theme-quick-menu-gap': '0.5em',
    '--theme-quick-menu-left-collapsed-size': '2.5em',
    '--theme-quick-menu-right-collapsed-size': '2.5em',

    // Toast（使用相对单位）
    '--theme-toast-bg': 'rgba(42,36,32,0.9)',
    '--theme-toast-color': 'rgba(212, 197, 160, 0.9)',
    '--theme-toast-border': 'rgba(90,79,64,0.55)',
    '--theme-toast-radius': '0.25em',
    '--theme-toast-shadow': '0 0.5em 1.5em rgba(0,0,0,0.35)',
  },
  components: {},
};
