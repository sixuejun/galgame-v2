/**
 * Liquid Glass Theme
 *
 * A modern, sleek theme featuring frosted glass effects (glassmorphism).
 * Uses backdrop blur, semi-transparent panels, and gradient backgrounds.
 */

import type { ThemeDefinition } from './types';

export const liquidGlassTheme: ThemeDefinition = {
  id: 'liquid-glass',
  name: '液态玻璃',
  description: '毛玻璃质感的现代风格，透明与渐变的完美融合',
  usesImageShell: false,
  cssVars: {
    // 基础色 - 渐变背景
    '--theme-bg': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    '--theme-fg': '#ffffff',
    '--theme-muted': 'rgba(255, 255, 255, 0.7)',
    '--theme-accent': '#60a5fa',
    '--theme-accent-soft': 'rgba(96, 165, 250, 0.4)',
    '--theme-line-color': 'rgba(255, 255, 255, 0.2)',
    '--theme-surface-border': 'rgba(255, 255, 255, 0.25)',
    '--theme-surface-soft': 'rgba(255, 255, 255, 0.15)',

    // 文本颜色
    '--theme-text-main': '#ffffff',
    '--theme-text-soft': 'rgba(255, 255, 255, 0.85)',
    '--theme-text-muted': 'rgba(255, 255, 255, 0.6)',
    '--theme-text-faint': 'rgba(255, 255, 255, 0.4)',
    '--theme-text-inverse': '#1a1a2e',
    '--theme-user-text': '#93c5fd',
    '--theme-dialogue-name-color': '#ffffff',
    '--theme-font-body': "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    '--theme-font-mono': "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Monaco, Consolas, monospace",

    // 旧变量兼容
    '--vn-bg': 'rgba(255, 255, 255, 0.1)',
    '--vn-fg': '#ffffff',
    '--vn-muted': 'rgba(255, 255, 255, 0.7)',
    '--vn-border': 'rgba(255, 255, 255, 0.25)',
    '--vn-panel-bg': 'rgba(255, 255, 255, 0.12)',
    '--vn-dialogue-bg': 'rgba(255, 255, 255, 0.15)',
    '--vn-choice-bg': 'rgba(255, 255, 255, 0.18)',
    '--vn-choice-hover': 'rgba(96, 165, 250, 0.3)',
    '--vn-choice-selected': 'rgba(96, 165, 250, 0.4)',
    '--rust': '#60a5fa',
    '--rust-light': 'rgba(96, 165, 250, 0.5)',
    '--rust-faded': 'rgba(96, 165, 250, 0.3)',

    // 舞台背景
    '--theme-bg-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    '--theme-stage-vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.3) 100%)',

    // 对话框 - 毛玻璃效果
    '--theme-dialogue-bg': 'rgba(255, 255, 255, 0.12)',
    '--theme-dialogue-border': 'rgba(255, 255, 255, 0.2)',
    '--theme-dialogue-radius': '16px',
    '--theme-dialogue-shadow': '0 8px 32px rgba(0, 0, 0, 0.2)',
    '--theme-dialogue-padding': '0px',
    '--theme-dialogue-width': '100%',
    '--theme-dialogue-height': 'auto',
    '--theme-dialogue-min-height': '10em',
    '--theme-dialogue-text-padding-top': '1.8em',
    '--theme-dialogue-text-padding-right': '3em',
    '--theme-dialogue-text-padding-bottom': '1.2em',
    '--theme-dialogue-text-padding-left': '3em',
    '--theme-dialogue-text-max-height': '7em',
    '--theme-dialogue-bottom': '1.2em',
    '--theme-dialogue-margin-x': '1.5em',
    '--theme-dialogue-margin-x-md': '2.5em',
    '--theme-dialogue-margin-x-lg': '4em',

    // 竖屏模式
    '--theme-dialogue-bottom-portrait': '32vmin',
    '--theme-dialogue-portrait-padding-x': '2vmin',
    '--theme-dialogue-translate-x': '0px',
    '--theme-dialogue-translate-y': '0px',
    '--theme-dialogue-min-height-portrait': '20vmin',

    // 翻页按钮
    '--theme-dialogue-nav-btn-size': '2.8em',
    '--theme-dialogue-nav-prev-top': '50%',
    '--theme-dialogue-nav-prev-left': '2.5em',
    '--theme-dialogue-nav-next-top': '50%',
    '--theme-dialogue-nav-next-right': '2.5em',
    '--theme-dialogue-nav-color': 'rgba(255, 255, 255, 0.6)',
    '--theme-dialogue-nav-hover-color': 'rgba(255, 255, 255, 0.9)',
    '--theme-dialogue-nav-disabled-opacity': '0.25',

    // 名字框
    '--theme-dialogue-name-top': '0.6em',
    '--theme-dialogue-name-left': '3em',
    '--theme-dialogue-name-max-width': '12em',
    '--theme-dialogue-name-font-size': '1em',
    '--theme-dialogue-name-align-items': 'center',
    '--theme-dialogue-name-padding-left': '12px',
    '--theme-dialogue-name-padding-top': '6px',

    // 头像壳
    '--theme-dialogue-portrait-top': '0.6em',
    '--theme-dialogue-portrait-left': '0.8em',
    '--theme-dialogue-portrait-width': '4em',
    '--theme-dialogue-portrait-height': '4em',
    '--theme-dialogue-portrait-display': 'flex',
    '--theme-dialogue-portrait-bottom-portrait': 'calc(20vmin + 3vmin)',
    '--theme-dialogue-portrait-left-portrait': '2vmin',

    // 黑屏文字
    '--theme-blacktext-bg': 'rgba(15, 15, 35, 0.95)',
    '--theme-blacktext-color': 'rgba(255, 255, 255, 0.95)',
    '--theme-blacktext-hint-color': 'rgba(255, 255, 255, 0.4)',
    '--theme-blacktext-arrow-color': 'rgba(255, 255, 255, 0.35)',
    '--theme-blacktext-arrow-hover-color': 'rgba(255, 255, 255, 0.65)',

    // 按钮
    '--theme-button-bg': 'rgba(255, 255, 255, 0.18)',
    '--theme-button-border': 'rgba(255, 255, 255, 0.3)',
    '--theme-button-radius': '10px',
    '--theme-button-padding-y': '0.5em',
    '--theme-button-padding-x': '1.2em',

    // 选项面板
    '--theme-choice-backdrop': 'rgba(0, 0, 0, 0.2)',
    '--theme-choice-left': '50%',
    '--theme-choice-bottom': '14em',
    '--theme-choice-width': '100%',
    '--theme-choice-max-width': '28em',
    '--theme-choice-padding-x': '1.5em',
    '--theme-choice-list-gap': '0.6em',
    '--theme-choice-translate-x': '-50%',
    '--theme-choice-button-padding': '0.9em 1.2em',
    '--theme-choice-button-gap': '0.5em',

    // 弹窗面板 - 毛玻璃
    '--theme-panel-bg': 'rgba(255, 255, 255, 0.12)',
    '--theme-panel-border': 'rgba(255, 255, 255, 0.2)',
    '--theme-panel-radius': '20px',
    '--theme-panel-shell-max-width': 'min(100%, 44em)',
    '--theme-panel-shell-max-height': '88%',
    '--theme-panel-max-height': '100%',
    '--theme-panel-backdrop': 'rgba(0, 0, 0, 0.35)',
    '--theme-panel-backdrop-blur': '16px',
    '--theme-panel-content-blur': '10px',
    '--theme-panel-content-saturate': '120%',

    // 顶部快捷菜单
    '--theme-quick-menu-top': '0.8em',
    '--theme-quick-menu-left-top': '0.8em',
    '--theme-quick-menu-right-top': '0.8em',
    '--theme-quick-menu-left': '0.5em',
    '--theme-quick-menu-right': '0.5em',
    '--theme-quick-menu-gap': '0.6em',
    '--theme-quick-menu-left-collapsed-size': '2.8em',
    '--theme-quick-menu-right-collapsed-size': '2.8em',

    // Toast
    '--theme-toast-bg': 'rgba(255, 255, 255, 0.2)',
    '--theme-toast-color': '#ffffff',
    '--theme-toast-border': 'rgba(255, 255, 255, 0.3)',
    '--theme-toast-radius': '12px',
    '--theme-toast-shadow': '0 8px 32px rgba(0, 0, 0, 0.25)',

    // 历史面板
    '--theme-history-info-color': 'rgba(255, 255, 255, 0.6)',
    '--theme-history-index-color': 'rgba(255, 255, 255, 0.35)',
    '--theme-history-speaker-color': '#93c5fd',
    '--theme-history-text-color': 'rgba(255, 255, 255, 0.9)',
    '--theme-history-narration-color': 'rgba(255, 255, 255, 0.7)',
    '--theme-history-active-bg': 'rgba(96, 165, 250, 0.15)',
    '--theme-history-row-border': 'rgba(255, 255, 255, 0.1)',
    '--theme-history-header-border': 'rgba(255, 255, 255, 0.15)',
  },
  components: {},
};
