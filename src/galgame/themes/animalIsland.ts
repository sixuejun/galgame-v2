/**
 * Animal Island Theme
 *
 * A soft, cute theme inspired by Animal Crossing style aesthetics.
 * Features pastel colors, large rounded corners, and a friendly atmosphere.
 */

import type { ThemeDefinition } from './types';

export const animalIslandTheme: ThemeDefinition = {
  id: 'animal-island',
  name: '动物之森',
  description: '柔和可爱的森系风格，圆润的视觉元素和温暖的色调',
  hidden: true,
  usesImageShell: false,
  cssVars: {
    // 基础色 - 柔和渐变
    '--theme-bg': 'linear-gradient(135deg, #a8d8ea 0%, #ffb6c1 50%, #ffd89b 100%)',
    '--theme-fg': '#4a5568',
    '--theme-muted': '#718096',
    '--theme-accent': '#f687b3',
    '--theme-accent-soft': 'rgba(246, 135, 179, 0.5)',
    '--theme-line-color': 'rgba(160, 140, 180, 0.3)',
    '--theme-surface-border': 'rgba(160, 140, 180, 0.3)',
    '--theme-surface-soft': 'rgba(255, 255, 255, 0.7)',

    // 文本颜色
    '--theme-text-main': '#4a5568',
    '--theme-text-soft': '#718096',
    '--theme-text-muted': '#a0aec0',
    '--theme-text-faint': '#cbd5e0',
    '--theme-text-inverse': '#ffffff',
    '--theme-user-text': '#4299e1',
    '--theme-dialogue-name-color': '#d53f8c',
    '--theme-font-body': "'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    '--theme-font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',

    // 旧变量兼容
    '--vn-bg': 'rgba(255, 250, 245, 0.92)',
    '--vn-fg': '#4a5568',
    '--vn-muted': '#718096',
    '--vn-border': 'rgba(160, 140, 180, 0.4)',
    '--vn-panel-bg': 'rgba(255, 255, 255, 0.85)',
    '--vn-dialogue-bg': 'rgba(255, 255, 255, 0.88)',
    '--vn-choice-bg': 'rgba(255, 255, 255, 0.78)',
    '--vn-choice-hover': 'rgba(246, 135, 179, 0.2)',
    '--vn-choice-selected': 'rgba(246, 135, 179, 0.3)',
    '--rust': '#f687b3',
    '--rust-light': 'rgba(246, 135, 179, 0.6)',
    '--rust-faded': 'rgba(246, 135, 179, 0.3)',

    // 舞台背景
    '--theme-bg-gradient': 'linear-gradient(135deg, #a8d8ea 0%, #ffb6c1 50%, #ffd89b 100%)',
    '--theme-stage-vignette': 'radial-gradient(ellipse at center, transparent 50%, rgba(160, 140, 180, 0.2) 100%)',

    // 对话框 - 大圆角风格
    '--theme-dialogue-bg': 'rgba(255, 255, 255, 0.92)',
    '--theme-dialogue-border': 'rgba(160, 140, 180, 0.3)',
    '--theme-dialogue-radius': '20px',
    '--theme-dialogue-shadow': '0 8px 32px rgba(160, 140, 180, 0.25)',
    '--theme-dialogue-padding': '16px',
    '--theme-dialogue-width': '100%',
    '--theme-dialogue-height': 'auto',
    '--theme-dialogue-min-height': '10em',
    '--theme-dialogue-text-padding-top': '1.5em',
    '--theme-dialogue-text-padding-right': '2em',
    '--theme-dialogue-text-padding-bottom': '1em',
    '--theme-dialogue-text-padding-left': '2em',
    '--theme-dialogue-text-max-height': '8em',
    '--theme-dialogue-bottom': '1em',
    '--theme-dialogue-margin-x': '1em',
    '--theme-dialogue-margin-x-md': '2em',
    '--theme-dialogue-margin-x-lg': '3em',

    // 竖屏模式
    '--theme-dialogue-bottom-portrait': '35vmin',
    '--theme-dialogue-portrait-padding-x': '3vmin',
    '--theme-dialogue-translate-x': '0px',
    '--theme-dialogue-translate-y': '0px',
    '--theme-dialogue-min-height-portrait': '22vmin',

    // 翻页按钮
    '--theme-dialogue-nav-btn-size': '3em',
    '--theme-dialogue-nav-prev-top': '50%',
    '--theme-dialogue-nav-prev-left': '2em',
    '--theme-dialogue-nav-next-top': '50%',
    '--theme-dialogue-nav-next-right': '2em',
    '--theme-dialogue-nav-color': 'rgba(213, 63, 140, 0.5)',
    '--theme-dialogue-nav-hover-color': 'rgba(213, 63, 140, 0.8)',
    '--theme-dialogue-nav-disabled-opacity': '0.3',

    // 名字框
    '--theme-dialogue-name-top': '0.8em',
    '--theme-dialogue-name-left': '2em',
    '--theme-dialogue-name-max-width': '10em',
    '--theme-dialogue-name-font-size': '1.1em',
    '--theme-dialogue-name-align-items': 'center',
    '--theme-dialogue-name-padding-left': '8px',
    '--theme-dialogue-name-padding-top': '4px',

    // 头像壳
    '--theme-dialogue-portrait-top': '0.8em',
    '--theme-dialogue-portrait-left': '0.8em',
    '--theme-dialogue-portrait-width': '4.5em',
    '--theme-dialogue-portrait-height': '4.5em',
    '--theme-dialogue-portrait-display': 'flex',
    '--theme-dialogue-portrait-bottom-portrait': 'calc(22vmin + 4vmin)',
    '--theme-dialogue-portrait-left-portrait': '2vmin',

    // 黑屏文字
    '--theme-blacktext-bg': '#2d3748',
    '--theme-blacktext-color': 'rgba(255, 255, 255, 0.95)',
    '--theme-blacktext-hint-color': 'rgba(255, 255, 255, 0.5)',
    '--theme-blacktext-arrow-color': 'rgba(255, 255, 255, 0.4)',
    '--theme-blacktext-arrow-hover-color': 'rgba(255, 255, 255, 0.7)',

    // 按钮
    '--theme-button-bg': 'linear-gradient(135deg, #ffb6c1, #ffd89b)',
    '--theme-button-border': 'rgba(246, 135, 179, 0.5)',
    '--theme-button-radius': '12px',
    '--theme-button-padding-y': '0.5em',
    '--theme-button-padding-x': '1em',

    // 选项面板
    '--theme-choice-backdrop': 'rgba(160, 140, 180, 0.2)',
    '--theme-choice-left': '50%',
    '--theme-choice-bottom': '12em',
    '--theme-choice-width': '100%',
    '--theme-choice-max-width': '26em',
    '--theme-choice-padding-x': '1.5em',
    '--theme-choice-list-gap': '0.8em',
    '--theme-choice-translate-x': '-50%',
    '--theme-choice-button-padding': '0.8em 1em',
    '--theme-choice-button-gap': '0.6em',

    // 选项按钮
    '--theme-choice-btn-bg': 'rgba(255, 255, 255, 0.78)',
    '--theme-choice-btn-border': 'rgba(160, 140, 180, 0.4)',
    '--theme-choice-btn-shadow': '0 4px 16px rgba(160, 140, 180, 0.2)',
    '--theme-choice-btn-selected-bg': 'rgba(246, 135, 179, 0.25)',
    '--theme-choice-btn-selected-border': 'rgba(246, 135, 179, 0.6)',
    '--theme-choice-btn-selected-shadow': '0 4px 20px rgba(246, 135, 179, 0.3)',
    '--theme-choice-letter-color': '#d53f8c',
    '--theme-choice-text-color': '#4a5568',
    '--theme-choice-text-font-family': "'Nunito', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    '--theme-choice-text-font-size': '1em',
    '--theme-choice-text-font-weight': '500',

    // 输入面板
    '--theme-input-backdrop': 'rgba(160, 140, 180, 0.2)',
    '--theme-input-title-color': '#4a5568',
    '--theme-input-send-btn-bg': 'rgba(246, 135, 179, 0.8)',
    '--theme-input-send-btn-border-color': 'rgba(246, 135, 179, 0.5)',
    '--theme-input-send-btn-color': '#ffffff',
    '--theme-input-send-btn-disabled-bg': 'rgba(160, 140, 180, 0.2)',
    '--theme-input-send-btn-disabled-color': 'rgba(74, 85, 104, 0.5)',
    '--theme-input-textarea-color': '#4a5568',
    '--theme-input-textarea-bg': 'rgba(255, 255, 255, 0.5)',
    '--theme-input-textarea-border': 'rgba(160, 140, 180, 0.3)',
    '--theme-input-textarea-placeholder-color': 'rgba(74, 85, 104, 0.45)',
    '--theme-input-close-btn-color': 'rgba(74, 85, 104, 0.5)',
    '--theme-input-close-btn-hover-color': '#4a5568',

    // 弹窗面板
    '--theme-panel-bg': 'rgba(255, 255, 255, 0.95)',
    '--theme-panel-border': 'rgba(160, 140, 180, 0.3)',
    '--theme-panel-radius': '24px',
    '--theme-panel-shell-max-width': 'min(100%, 42em)',
    '--theme-panel-shell-max-height': '85%',
    '--theme-panel-max-height': '100%',
    '--theme-panel-backdrop': 'rgba(160, 140, 180, 0.4)',
    '--theme-panel-backdrop-blur': '12px',
    '--theme-panel-content-blur': '8px',
    '--theme-panel-content-saturate': '110%',

    // 顶部快捷菜单
    '--theme-quick-menu-top': '1em',
    '--theme-quick-menu-left-top': '1em',
    '--theme-quick-menu-right-top': '1em',
    '--theme-quick-menu-left': '0.5em',
    '--theme-quick-menu-right': '0.5em',
    '--theme-quick-menu-gap': '0.8em',
    '--theme-quick-menu-left-collapsed-size': '3em',
    '--theme-quick-menu-right-collapsed-size': '3em',

    // Toast
    '--theme-toast-bg': 'rgba(255, 255, 255, 0.95)',
    '--theme-toast-color': '#4a5568',
    '--theme-toast-border': 'rgba(160, 140, 180, 0.3)',
    '--theme-toast-radius': '16px',
    '--theme-toast-shadow': '0 8px 32px rgba(160, 140, 180, 0.3)',

    // 历史面板
    '--theme-history-info-color': 'rgba(113, 128, 150, 0.8)',
    '--theme-history-index-color': 'rgba(160, 140, 180, 0.5)',
    '--theme-history-speaker-color': '#d53f8c',
    '--theme-history-text-color': 'rgba(74, 85, 104, 0.85)',
    '--theme-history-narration-color': 'rgba(113, 128, 150, 0.7)',
    '--theme-history-active-bg': 'rgba(246, 135, 179, 0.1)',
    '--theme-history-row-border': 'rgba(160, 140, 180, 0.1)',
    '--theme-history-header-border': 'rgba(160, 140, 180, 0.2)',
  },
  components: {},
};
