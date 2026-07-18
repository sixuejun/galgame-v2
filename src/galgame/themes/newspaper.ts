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

    // 对话框（统一规则：位置/大小类变量不使用 em，全部用 rem/px 避免被祖先 font-size 联动缩小甚至"消失"）
    '--theme-dialogue-bg': 'var(--vn-dialogue-bg)',
    '--theme-dialogue-border': 'rgba(90,79,64,0.6)',
    '--theme-dialogue-radius': '0rem',
    '--theme-dialogue-shadow': 'inset 0 0 0.5rem rgba(42,36,32,0.3), 0 0.25rem 0.75rem rgba(0,0,0,0.4)',
    '--theme-dialogue-padding': '0rem',
    '--theme-dialogue-width': '100%',
    '--theme-dialogue-height': 'auto',
    '--theme-dialogue-min-height': '10rem',
    // 对话框文本区（关键 padding 用 rem：哪怕祖先 font-size 很小也不会消失）
    '--theme-dialogue-text-padding-top': '1.5rem',
    '--theme-dialogue-text-padding-right': '2.5rem',
    '--theme-dialogue-text-padding-bottom': '0.8rem',
    '--theme-dialogue-text-padding-left': '2.5rem',
    '--theme-dialogue-text-max-height': '6rem',
    // 文本字体大小：用 clamp() 提供合理范围，用户可直接重写为绝对值（重点修复：1em 在嵌套上下文会消失）
    '--theme-dialogue-text-font-size': 'clamp(0.95rem, 1.6vw, 1.15rem)',
    '--theme-dialogue-text-line-height': '1.75',
    '--theme-dialogue-text-letter-spacing': '0.02em' /* letter-spacing 保留 em，跟字宽有关 */,
    '--theme-dialogue-bottom': '0.5rem',
    '--theme-dialogue-margin-x': '0rem',
    '--theme-dialogue-margin-x-md': '1rem',
    '--theme-dialogue-margin-x-lg': '2rem',

    // 竖屏模式对话框位置
    '--theme-dialogue-bottom-portrait': '34vmin',
    '--theme-dialogue-portrait-padding-x': '2vmin',
    '--theme-dialogue-translate-x': '0px',
    '--theme-dialogue-translate-y': '0px',
    '--theme-dialogue-min-height-portrait': '20vmin',

    // 翻页按钮：用 rem 不依赖字号
    '--theme-dialogue-nav-btn-size': '3.5rem',
    '--theme-dialogue-nav-prev-top': '70%',
    '--theme-dialogue-nav-prev-left': '1.75rem',
    '--theme-dialogue-nav-next-top': '70%',
    '--theme-dialogue-nav-next-right': '1.75rem',
    '--theme-dialogue-nav-color': 'rgba(139, 69, 19, 0.6)',
    '--theme-dialogue-nav-hover-color': 'rgba(198, 184, 149, 0.6)',
    '--theme-dialogue-nav-disabled-opacity': '0.2',

    // 名字框：位置用 rem；字体大小用 clamp()（关键变量）
    '--theme-dialogue-name-top': '0.6rem',
    '--theme-dialogue-name-left': '2.5rem',
    '--theme-dialogue-name-max-width': '10rem',
    '--theme-dialogue-name-font-size':
      'clamp(0.95rem, 1.4vw, 1.15rem)' /* 重要：替换原来的 1em，小于 1 时也能保持稳定 */,
    '--theme-dialogue-name-align-items': 'flex-start',
    '--theme-dialogue-name-padding-left': '0px',
    '--theme-dialogue-name-padding-top': '0px',

    // 头像壳（普通模式）：宽高/位置用 rem
    '--theme-dialogue-portrait-top': '0.5rem',
    '--theme-dialogue-portrait-left': '0.75rem',
    '--theme-dialogue-portrait-width': '4rem',
    '--theme-dialogue-portrait-height': '4rem',
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

    // 按钮：padding 用 rem 不依赖字号
    '--theme-button-bg': 'rgba(42,36,32,0.85)',
    '--theme-button-border': 'rgba(139,69,19,0.5)',
    '--theme-button-radius': '0.1rem',
    '--theme-button-padding-y': '0.4rem',
    '--theme-button-padding-x': '0.75rem',

    // 选项面板：位置与大小用 rem 不依赖字号
    '--theme-choice-backdrop': 'rgba(42, 36, 32, 0.3)',
    '--theme-choice-left': '50%',
    '--theme-choice-bottom': 'clamp(8rem, 18vw, 15rem)',
    '--theme-choice-bottom-portrait': 'clamp(6rem, 14vw, 11rem)',
    '--theme-choice-width': '100%',
    '--theme-choice-max-width': '28rem',
    '--theme-choice-two-col-max-width': 'clamp(20rem, 60vw, 64rem)',
    '--theme-choice-padding-x': '1rem',
    '--theme-choice-list-gap': '0.5rem',
    '--theme-choice-translate-x': '-50%',
    '--theme-choice-translate-y': '0px',
    // 统一按钮高度（无论选项数量多少都保持一致）
    '--theme-choice-btn-shell-height': 'clamp(3.2rem, 7vw, 5rem)',
    '--theme-choice-btn-height': 'clamp(3.2rem, 7vw, 5rem)',
    '--theme-choice-btn-min-height': 'clamp(3.2rem, 7vw, 5rem)',
    '--theme-choice-btn-inner-gap': '0.5rem',
    '--theme-choice-btn-inner-padding-left': '0.75rem',
    '--theme-choice-btn-inner-padding-right': '0.75rem',
    '--theme-choice-btn-inner-padding-top': '0.35rem',
    '--theme-choice-btn-inner-padding-bottom': '0.35rem',
    '--theme-choice-btn-text-area-height': 'clamp(2.2rem, 4.5vw, 3.5rem)',

    // 选项按钮
    '--theme-choice-btn-bg': 'rgba(42, 36, 32, 0.85)',
    '--theme-choice-btn-border': 'rgba(90, 79, 64, 0.6)',
    '--theme-choice-btn-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)',
    '--theme-choice-btn-hover-bg': 'rgba(90, 79, 64, 0.3)',
    '--theme-choice-btn-hover-border': 'rgba(90, 79, 64, 0.7)',
    '--theme-choice-btn-selected-bg': 'rgba(90, 79, 64, 0.4)',
    '--theme-choice-btn-selected-border': 'rgba(139, 69, 19, 0.7)',
    '--theme-choice-btn-selected-shadow': '0 2px 12px rgba(139, 69, 19, 0.3)',
    '--theme-choice-letter-color': 'rgba(139, 69, 19, 0.9)',
    '--theme-choice-letter-color-hover': 'rgba(198, 184, 149, 0.9)',
    '--theme-choice-text-color': 'rgba(212, 197, 160, 0.92)',
    '--theme-choice-text-color-hover': 'rgba(212, 197, 160, 1)',
    '--theme-choice-text-color-selected': 'rgba(198, 184, 149, 1)',
    '--theme-choice-text-font-family': 'Georgia, "Times New Roman", serif',
    // 选项字号（关键变量：用 clamp()，替换原来的 1em）
    '--theme-choice-text-font-size': 'clamp(0.95rem, 1.4vw, 1.1rem)',
    // 选项序号字号
    '--theme-choice-letter-font-size': 'clamp(0.85rem, 1.2vw, 1rem)',
    '--theme-choice-text-font-weight': 'normal',
    '--theme-choice-text-line-height': '1.5',
    '--theme-choice-text-letter-spacing': '0.02em' /* em 在 letter-spacing 上是合理的 */,
    '--theme-choice-text-placeholder-color': 'rgba(139, 125, 107, 0.45)',
    '--theme-choice-caret-color': 'rgba(139, 69, 19, 0.9)',

    // 自由输入选项悬浮发送按钮
    '--theme-choice-send-btn-color': 'rgba(139, 69, 19, 0.75)',
    '--theme-choice-send-btn-hover-color': 'rgba(139, 69, 19, 1)',
    '--theme-choice-send-btn-disabled-color': 'rgba(139, 125, 107, 0.35)',

    // 弹幕
    '--theme-danmaku-top-offset': '2rem' /* 留更多顶部空间 */,
    '--theme-danmaku-bottom-offset': '8rem' /* 留更多底部空间 */,
    '--theme-danmaku-horizontal-padding': '1rem',
    // 弹幕字号/颜色/透明度（带单位，确保裸数字也能正常工作）
    '--theme-danmaku-font-size': '1.2rem',
    '--theme-danmaku-color': 'rgba(255, 255, 255, 0.85)',
    '--theme-danmaku-opacity': '0.9',

    // 输入面板
    '--theme-input-backdrop': 'rgba(42, 36, 32, 0.3)',
    '--theme-input-title-color': 'rgba(212, 197, 160, 0.85)',
    '--theme-input-send-btn-bg': 'rgba(139, 69, 19, 0.85)',
    '--theme-input-send-btn-border-color': 'rgba(139, 69, 19, 0.5)',
    '--theme-input-send-btn-color': 'rgba(212, 197, 160, 0.92)',
    '--theme-input-send-btn-disabled-bg': 'rgba(90, 79, 64, 0.2)',
    '--theme-input-send-btn-right': '1.1rem', // 发送按钮距输入区右侧的距离。
    '--theme-input-send-btn-bottom': '0.9rem', // 发送按钮距输入区底部的距离。
    '--theme-input-send-btn-disabled-color': 'rgba(139, 125, 107, 0.4)',
    '--theme-input-textarea-color': 'rgba(212, 197, 160, 0.9)',
    '--theme-input-textarea-bg': 'transparent',
    '--theme-input-textarea-border': 'rgba(90, 79, 64, 0.3)',
    '--theme-input-textarea-placeholder-color': 'rgba(139, 125, 107, 0.35)',
    '--theme-input-textarea-letter-spacing': '0.05em' /* letter-spacing 保留 em，正确用法 */,
    '--theme-input-textarea-padding-top': '0.5rem',
    '--theme-input-textarea-padding-right': '3rem',
    '--theme-input-textarea-padding-bottom': '0.5rem',
    '--theme-input-textarea-padding-left': '0.75rem',
    '--theme-input-textarea-caret-color': 'rgba(139, 69, 19, 0.9)',
    '--theme-input-close-btn-color': 'rgba(139, 125, 107, 0.5)',
    '--theme-input-close-btn-hover-color': 'rgba(212, 197, 160, 0.9)',

    // 弹窗面板：用 rem 不依赖字号
    '--theme-panel-bg': 'var(--vn-panel-bg)',
    '--theme-panel-border': 'rgba(90,79,64,0.55)',
    '--theme-panel-radius': '0rem',
    '--theme-panel-shell-max-width': 'min(100%, 42rem)',
    '--theme-panel-shell-max-height': '82%',
    '--theme-panel-max-height': '100%',
    '--theme-panel-backdrop': 'rgba(42, 36, 32, 0.7)',
    '--theme-panel-backdrop-blur': '0.25rem',
    '--theme-panel-content-blur': '0.75rem',
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

    // 顶部快捷菜单：用 rem 不依赖字号，避免嵌套 em 收缩时按钮"消失"
    '--theme-quick-menu-top': '0.75rem',
    '--theme-quick-menu-left-top': '0.75rem',
    '--theme-quick-menu-right-top': '0.75rem',
    '--theme-quick-menu-left': '0.5rem',
    '--theme-quick-menu-right': '0.5rem',
    '--theme-quick-menu-gap': '0.5rem',
    '--theme-quick-menu-left-collapsed-size': '2.5rem',
    '--theme-quick-menu-right-collapsed-size': '2.5rem',

    // Toast
    '--theme-toast-bg': 'rgba(42,36,32,0.9)',
    '--theme-toast-color': 'rgba(212, 197, 160, 0.9)',
    '--theme-toast-border': 'rgba(90,79,64,0.55)',
    '--theme-toast-radius': '0.25rem',
    '--theme-toast-shadow': '0 0.5rem 1.5rem rgba(0,0,0,0.35)',
  },
  components: {},
};
