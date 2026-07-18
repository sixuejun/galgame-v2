import dialogueAvatarShellImage from '../assets/hedie-avatar-bubble.png?url';
import characterPanelImage from '../assets/hedie-character-panel.png?url';
import choiceButtonImage from '../assets/hedie-choice-panel.png?url';
import dialogueBoxImage from '../assets/hedie-dialogue-box.png?url';
import inputPanelImage from '../assets/hedie-input-panel.png?url';
import leftCollapsedButtonImage from '../assets/hedie-left-collapsed-button.png?url';
import leftExpandedButtonImage from '../assets/hedie-left-expanded-button.png?url';
import dialogueNameTagImage from '../assets/hedie-name-tag.png?url';
import rightCollapsedButtonImage from '../assets/hedie-right-collapsed-button.png?url';
import rightExpandedButtonImage from '../assets/hedie-right-expanded-button.png?url';
import settingsPanelImage from '../assets/hedie-settings-panel.png?url';
import type { ThemeDefinition } from './types';

/** 翻页按钮 SVG（指向右侧，用于右侧按钮；左侧按钮在 CSS 中通过 scaleX(-1) 左右翻转） */
const DIALOGUE_NAV_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" fill="#6e4736">
  <g transform="translate(179.542068,641.088520) scale(0.057334,-0.057334)">
    <path d="M3648 7596 c-104 -28 -142 -70 -282 -315 -208 -361 -338 -681 -434 -1066 -89 -356 -117 -592 -117 -995 1 -408 24 -602 121 -984 177 -704 531 -1324 1073 -1880 125 -128 163 -156 213 -156 60 0 95 20 203 117 652 584 1100 1340 1290 2178 39 170 42 245 15 317 -33 88 -83 132 -254 223 -174 92 -238 132 -361 225 -457 347 -799 850 -936 1378 -43 166 -66 314 -84 526 -15 192 -26 237 -74 311 -70 106 -233 159 -373 121z"/>
    <path d="M458 5920 c-139 -25 -258 -154 -275 -298 -14 -123 132 -620 279 -947 454 -1012 1333 -1809 2382 -2159 93 -31 186 -59 207 -62 121 -20 225 80 204 195 -9 46 -30 76 -140 192 -388 411 -676 882 -850 1389 -92 268 -160 547 -186 762 -21 168 -56 202 -226 219 -267 26 -492 106 -717 256 -99 66 -263 219 -361 337 -78 94 -197 138 -317 116z"/>
    <path d="M6369 3597 c-87 -37 -134 -82 -217 -207 -157 -240 -316 -435 -512 -630 -282 -280 -529 -471 -880 -682 -115 -69 -150 -108 -150 -167 0 -58 32 -96 137 -165 670 -437 1406 -670 2190 -693 295 -8 365 7 451 101 72 78 92 146 113 381 17 197 2 411 -47 660 -96 483 -311 888 -663 1248 -129 133 -190 168 -296 174 -57 3 -80 -1 -126 -20z"/>
    <path d="M2820 1909 c-233 -26 -581 -129 -646 -190 -31 -29 -32 -78 -1 -106 21 -21 31 -21 307 -20 161 0 328 -5 385 -11 684 -81 1235 -308 1788 -737 70 -53 97 -56 139 -15 26 26 30 36 25 66 -7 43 -112 201 -219 328 -311 374 -788 622 -1318 686 -98 12 -351 11 -460 -1z"/>
  </g>
</svg>`;

export const hedieTheme: ThemeDefinition = {
  // 主题唯一标识。切换主题、保存主题选择时用它来识别"和蝶"。
  id: 'hedie',
  // 主题在界面里显示给用户看的名称。
  name: '和蝶',
  // 主题说明文字，一般显示在主题选择或调试信息里。
  description: '图片皮肤主题，目前只建议电脑使用',
  // 是否启用图片外壳模式。为 true 时，dialogue/button/panel 等组件会优先套用 components 里的 PNG 皮肤。
  usesImageShell: true,
  cssVars: {
    // 基础色：控制整套主题的默认背景、文字、强调色、分割线和柔和面板底色。
    '--theme-bg': '#f3ead8', // 页面或舞台的基础背景色。
    '--theme-fg': '#2f241f', // 默认前景色，主要用于普通文字或图标。
    '--theme-muted': '#5c4c44', // 次级文字色，常用于说明文字、弱化信息。
    '--theme-accent': '#6e4736', // 主题强调色，常用于标题、选中态、重要按钮。
    '--theme-accent-soft': 'rgba(110, 71, 54, 0.72)', // 半透明强调色，用于 hover、阴影、柔和高亮。
    '--theme-line-color': 'rgba(110, 71, 54, 0.28)', // 通用细线颜色，用于分割线。
    '--theme-surface-border': 'rgba(110, 71, 54, 0.28)', // 卡片、面板等表面的边框颜色。
    '--theme-surface-soft': 'rgba(246, 238, 225, 0.8)', // 卡片、选项、半透明面板的柔和底色。

    // 文本：控制正文、弱化文字、反色文字、用户发言和字体。
    '--theme-text-main': '#2f241f', // 主正文颜色，剧情文本、普通标签主要用它。
    '--theme-text-soft': 'rgba(47, 36, 31, 0.78)', // 略弱于正文的文字颜色，用于辅助说明。
    '--theme-text-muted': 'rgba(92, 76, 68, 0.78)', // 更弱的文字颜色，用于时间、提示、非重点信息。
    '--theme-text-faint': 'rgba(92, 76, 68, 0.52)', // 最弱文字颜色，用于占位、不可用状态、淡提示。
    '--theme-text-inverse': '#f4ead8', // 反色文字，通常用于深色按钮或深色遮罩上。
    '--theme-user-text': '#2d4f5c', // 用户发言或玩家相关文本的专用颜色。
    '--theme-dialogue-name-color': '#6e4736', // 对话框里角色名的颜色。
    '--theme-history-info-color': 'var(--theme-text-muted)', // 历史面板顶部"共 x 条"等信息颜色。
    '--theme-history-index-color': 'var(--theme-text-faint)', // 历史面板左侧序号颜色。
    '--theme-history-speaker-color': 'var(--theme-accent)', // 历史面板说话人名称颜色。
    '--theme-history-text-color': 'var(--theme-text-soft)', // 历史面板角色发言正文颜色。
    '--theme-history-narration-color': 'rgba(47, 36, 31, 0.62)', // 历史面板旁白/无说话人文本颜色。
    '--theme-history-active-bg': 'rgba(110, 71, 54, 0.12)', // 历史面板当前行背景色。
    '--theme-history-row-border': 'rgba(110, 71, 54, 0.12)', // 历史面板每行底部分割线颜色。
    '--theme-history-header-border': 'rgba(110, 71, 54, 0.26)', // 历史面板标题和信息栏分割线颜色。
    '--theme-font-body': "'Noto Serif SC', 'Noto Serif', Georgia, serif", // 正文与界面默认字体。
    '--theme-font-mono': "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace", // 等宽字体，用于代码、调试文本或需要对齐的内容。

    // 旧主题变量兼容：给旧版 CSS 变量提供映射，避免旧样式失效。
    '--vn-bg': 'var(--theme-bg)', // 旧变量：视觉小说背景色。
    '--vn-fg': 'var(--theme-text-main)', // 旧变量：视觉小说主文字色。
    '--vn-muted': 'var(--theme-text-muted)', // 旧变量：视觉小说弱化文字色。
    '--vn-border': 'var(--theme-surface-border)', // 旧变量：视觉小说边框色。
    '--vn-panel-bg': 'var(--theme-surface-soft)', // 旧变量：视觉小说面板底色。
    '--vn-dialogue-bg': 'var(--theme-dialogue-bg)', // 旧变量：视觉小说对话框底色。
    '--vn-choice-bg': 'rgba(246, 238, 225, 0.78)', // 旧变量：选项按钮默认背景。
    '--vn-choice-hover': 'rgba(110, 71, 54, 0.16)', // 旧变量：选项按钮悬停背景。
    '--vn-choice-selected': 'rgba(110, 71, 54, 0.22)', // 旧变量：选项按钮选中背景。
    '--rust': 'var(--theme-accent)', // 旧变量：锈色强调色。
    '--rust-light': 'var(--theme-accent-soft)', // 旧变量：浅锈色强调色。
    '--rust-faded': 'rgba(110, 71, 54, 0.48)', // 旧变量：褪色锈色。
    '--stain': 'var(--theme-accent)', // 旧变量：污渍/装饰强调色。

    // 舞台：控制最底层背景氛围和暗角。
    '--theme-bg-gradient':
      'linear-gradient(to bottom, rgba(243,234,216,0.96), rgba(232,216,190,0.86), rgba(243,234,216,0.96))', // 舞台背景渐变。
    '--theme-stage-vignette': 'radial-gradient(ellipse at center, transparent 48%, rgba(47,36,31,0.24) 100%)', // 舞台四周暗角效果。

    // ========== 对话框主体（背景壳） ==========
    '--theme-dialogue-bg': 'rgba(20, 16, 28, 0)', // 对话框 CSS 背景；当前透明，主要依赖 dialogueBoxImage PNG。
    '--theme-dialogue-border': 'transparent', // 对话框 CSS 边框；当前透明，边框由 PNG 承担。
    '--theme-dialogue-radius': '0px', // 对话框圆角；图片外壳模式下一般保持 0。
    '--theme-dialogue-shadow': 'none', // 对话框阴影；图片自带阴影时可关闭。
    '--theme-dialogue-padding': '0px', // 对话框外层内边距。
    '--theme-dialogue-content-blur': '4px', // 对话框内部内容区域的背景模糊强度。
    '--theme-dialogue-content-saturate': '115%', // 对话框内部内容区域的饱和度滤镜。
    '--theme-dialogue-bottom': '0.05rem', // 对话框距离舞台底部的位置。
    '--theme-dialogue-portrait-padding-x': '1rem', // 对话框带立绘时，立绘区域左右预留空间。
    '--theme-dialogue-margin-x': '0rem', // 小屏下对话框左右外边距。
    '--theme-dialogue-margin-x-md': '0rem', // 中屏下对话框左右外边距。
    '--theme-dialogue-margin-x-lg': '0rem', // 大屏下对话框左右外边距。
    '--theme-dialogue-translate-x': '0.25rem', // 对话框整体水平微调，正值向右。
    '--theme-dialogue-translate-y': '0px', // 对话框整体垂直微调，正值向下。

    // 竖屏模式专用变量：基于 vmin 确保按比例缩放后依然有足够的绝对值
    '--theme-dialogue-bottom-portrait': '30vmin', // 竖屏模式下对话框距离舞台底部的位置
    '--theme-dialogue-margin-x-portrait': '0.5vmin', // 竖屏模式下对话框左右外边距
    '--theme-dialogue-min-height-portrait': '16vmin', // 竖屏模式下对话框最小高度

    // 横屏模式专用变量
    '--theme-dialogue-min-height': '10rem', // 横屏模式下对话框最小高度

    // ========== 头像壳 ==========
    // 使用 clamp(min, preferred, max) 实现响应式缩放，preferred 基于 vw 以便全屏时整体放大
    '--theme-dialogue-portrait-width': 'clamp(4rem, 14vw, 16rem)', // 头像壳宽度：最小4rem，优先14vw，全屏时自动放大
    '--theme-dialogue-portrait-height': 'clamp(4rem, 14vw, 16rem)', // 头像壳高度
    '--theme-dialogue-portrait-top': 'clamp(-8rem, -11vw, -10rem)', // 头像壳距离对话框顶部的位置（负值向上）
    '--theme-dialogue-portrait-left': 'clamp(2rem, 5vw, 6rem)', // 头像壳距离对话框左侧的位置
    // 竖屏模式专用：头像壳也基于 vmin 定位，与对话框的 vmin 高度保持比例同步
    '--theme-dialogue-portrait-bottom-portrait': 'calc(16vmin - 1vmin)', // 头像壳底部对齐对话框顶部，向上偏移（16vmin=对话框高度 + 3vmin=间距）
    '--theme-dialogue-portrait-left-portrait': '7vmin', // 竖屏模式头像壳距离对话框左侧的位置

    // ========== 名字框 ==========
    '--theme-dialogue-name-font-size': 'clamp(1rem, 2.2vw, 2rem)', // 名字文字大小
    '--theme-dialogue-name-top': 'clamp(-1.5rem, -2vw, -2rem)', // 名字框距离对话框顶部的位置
    '--theme-dialogue-name-left': 'clamp(6rem, 13vw, 14rem)', // 名字框距离对话框左侧的位置
    '--theme-dialogue-name-max-width': 'clamp(10rem, 22vw, 24rem)', // 名字框最大宽度
    '--theme-dialogue-name-align-items': 'flex-start', // 名字框内文字垂直对齐方式（flex-start 为顶部对齐）
    '--theme-dialogue-name-padding-left': 'clamp(4rem, 8vw, 9rem)', // 名字框内文字相对于名字框左侧的偏移
    '--theme-dialogue-name-padding-top': 'clamp(-0.8rem, -1vw, -1.2rem)', // 名字框内文字相对于名字框顶部的偏移

    // ========== 主文本框 ==========
    // padding 使用 vw 单位实现与视口宽度同步缩放，全屏时自动放大
    '--theme-dialogue-text-padding-top': 'clamp(2rem, 5vw, 6rem)', // 文本内容区距离对话框顶部的内缩
    '--theme-dialogue-text-padding-right': 'clamp(6rem, 11vw, 14rem)', // 文本内容区距离对话框右侧的内缩
    '--theme-dialogue-text-padding-bottom': 'clamp(1rem, 2vw, 2.5rem)', // 文本内容区距离对话框底部的内缩
    '--theme-dialogue-text-padding-left': 'clamp(5rem, 11vw, 13rem)', // 文本内容区距离对话框左侧的内缩
    '--theme-dialogue-text-max-height': 'clamp(4rem, 9vw, 12rem)', // 文本内容区最大高度，影响一屏能显示多少行
    '--theme-dialogue-text-font-size': 'clamp(1rem, 1.8vw, 1.8rem)', // 文本字体大小
    '--theme-dialogue-text-line-height': '1.75', // 文本行高（保持不变，与字号相关）
    '--theme-dialogue-text-letter-spacing': '0.05em', // 文本字间距（保持不变）
    '--theme-dialogue-text-color': '#2f241f', // 文本默认颜色

    // ========== 翻页按钮 ==========
    '--theme-dialogue-nav-width': 'clamp(3rem, 6vw, 8rem)', // 翻页按钮容器宽度
    '--theme-dialogue-nav-btn-size': 'clamp(2.5rem, 5vw, 6rem)', // 翻页 SVG 按钮尺寸（放大后的大小）
    '--theme-dialogue-nav-color': '#6e4736', // 翻页按钮 SVG 填充色
    '--theme-dialogue-nav-hover-color': '#8a5a45', // 翻页按钮悬停色
    '--theme-dialogue-nav-disabled-opacity': '0.2', // 翻页按钮禁用态透明度
    '--theme-dialogue-nav-prev-left': 'clamp(2rem, 4vw, 5rem)', // 左侧翻页按钮距离对话框左侧的位置
    '--theme-dialogue-nav-prev-top': '70%', // 左侧翻页按钮距离对话框顶部的位置
    '--theme-dialogue-nav-next-right': 'clamp(2rem, 4vw, 5rem)', // 右侧翻页按钮距离对话框右侧的位置
    '--theme-dialogue-nav-next-top': '70%', // 右侧翻页按钮距离对话框顶部的位置

    // 黑屏文字：控制黑屏过场、独白或转场文字的背景和提示箭头颜色。
    '--theme-blacktext-bg': '#000000', // 黑屏过场背景色。
    '--theme-blacktext-color': 'rgba(250, 248, 240, 0.95)', // 黑屏过场正文颜色。
    '--theme-blacktext-hint-color': 'rgba(255, 255, 255, 0.4)', // 黑屏过场提示文字颜色。
    '--theme-blacktext-arrow-color': 'rgba(255, 255, 255, 0.3)', // 黑屏过场继续箭头默认颜色。
    '--theme-blacktext-arrow-hover-color': 'rgba(255, 255, 255, 0.6)', // 黑屏过场继续箭头悬停颜色。

    // 通用按钮：控制普通按钮的透明度、边框、尺寸和内容滤镜。图片按钮主要依赖 components.button。
    '--theme-button-bg': 'rgba(20, 16, 28, 0)', // 按钮 CSS 背景；当前透明，主要依赖按钮 PNG。
    '--theme-button-border': 'transparent', // 按钮 CSS 边框；当前透明，边框由 PNG 承担。
    '--theme-button-radius': '0px', // 按钮圆角；图片外壳模式下一般保持 0。
    '--theme-button-min-width': 'auto', // 按钮最小宽度。
    '--theme-button-height': 'auto', // 按钮高度。
    '--theme-button-padding-y': '0.375rem', // 按钮文字上下内边距。
    '--theme-button-padding-x': '0.75rem', // 按钮文字左右内边距。
    '--theme-button-gap': '0.5rem', // 按钮内部图标和文字的间距。
    '--theme-button-justify-left': 'flex-start', // 左侧展开按钮内部内容的水平对齐方式。
    '--theme-button-justify-right': 'flex-end', // 右侧展开按钮内部内容的水平对齐方式；图二想靠右主要调这里。
    '--theme-button-content-blur': '0px', // 按钮内容区域背景模糊强度。
    '--theme-button-content-saturate': '115%', // 按钮内容区域饱和度滤镜。

    // ========== 选项面板 ==========
    // 控制选项列表浮层的位置、背景和整体排布。
    '--theme-choice-backdrop': 'rgba(26, 21, 32, 0.35)', // 选项出现时覆盖舞台的遮罩颜色。
    '--theme-choice-left': '50%', // 选项面板左侧定位基准。
    '--theme-choice-bottom': 'clamp(8rem, 18vw, 15rem)', // 选项面板距离舞台底部的位置。
    '--theme-choice-bottom-portrait': 'clamp(6rem, 14vw, 11rem)', // 竖屏模式选项面板距离舞台底部的位置。
    '--theme-choice-width': '100%', // 选项面板宽度。
    '--theme-choice-max-width': 'clamp(20rem, 42vw, 32rem)', // 选项面板最大宽度（单列）。
    '--theme-choice-two-col-max-width': 'clamp(20rem, 60vw, 64rem)', // 选项面板最大宽度（双列）。
    '--theme-choice-padding-x': 'clamp(0.5rem, 1.5vw, 1rem)', // 选项面板左右内边距。
    '--theme-choice-list-gap': 'clamp(0.25rem, 0.8vw, 0.6rem)', // 多个选项按钮之间的垂直间距。
    '--theme-choice-translate-x': '-50%', // 选项面板水平偏移。
    '--theme-choice-translate-y': '0px', // 选项面板垂直偏移。

    // ========== 单个选项按钮 ==========
    // 按钮外壳（固定高度，图片适应方式）
    '--theme-shell-object-fit': 'contain', // 图片适配方式：contain 完整显示不裁剪，cover 铺满裁剪。
    '--theme-choice-btn-shell-height': 'clamp(3.6rem, 8.4vw, 6.6rem)', // 按钮外壳固定高度（contain 模式下高度由图片宽高比决定）。
    '--theme-choice-btn-height': 'clamp(3.6rem, 8.4vw, 6.6rem)', // 按钮固定高度。
    '--theme-choice-btn-min-height': 'clamp(3rem, 7vw, 5.5rem)', // 按钮最小高度。
    // 序号与文字间距
    '--theme-choice-btn-inner-gap': '0.1rem', // 序号与文字之间的间距。
    // 序号区域左右内边距（决定序号与文字的距离）
    '--theme-choice-btn-inner-padding-left': '0.5rem', // 序号左侧内边距。
    '--theme-choice-btn-inner-padding-right': '0.25rem', // 序号右侧内边距。
    // 文字区域上下内边距（在按钮内垂直居中文字）
    '--theme-choice-btn-inner-padding-top': '0.5rem', // 文字区域上内边距。
    '--theme-choice-btn-inner-padding-bottom': '0.5rem', // 文字区域下内边距。
    // 文字区域高度（与按钮高度共同决定垂直居中效果）
    '--theme-choice-btn-text-area-height': '3rem', // 文字区域固定高度，超出滚动。
    // 按钮背景与边框（CSS 模式，与 PNG 叠加；PNG 外壳已承载视觉，可叠加半透明底色）
    '--theme-choice-btn-bg': 'rgba(243, 234, 216, 0.0)',
    '--theme-choice-btn-border': 'transparent',
    '--theme-choice-btn-shadow': 'none',
    '--theme-choice-btn-hover-bg': 'rgba(243, 234, 216, 0.0)',
    '--theme-choice-btn-hover-border': 'transparent',
    '--theme-choice-btn-hover-shadow': 'none',
    '--theme-choice-btn-selected-bg': 'rgba(243, 234, 216, 0.0)',
    '--theme-choice-btn-selected-border': 'transparent',
    '--theme-choice-btn-selected-shadow': 'none',
    // 选项序号
    '--theme-choice-letter-color': 'rgba(110, 71, 54, 0.85)', // 选项序号颜色。
    '--theme-choice-letter-color-hover': 'rgba(110, 71, 54, 1)', // 悬停时选项序号颜色。
    '--theme-choice-letter-font-size': 'clamp(0.9rem, 1.5vw, 1.1rem)', // 选项序号字体大小。
    '--theme-choice-letter-font-family': "'Noto Serif SC', 'Noto Serif', Georgia, serif", // 选项序号字体。
    '--theme-choice-letter-font-weight': '600', // 选项序号字重。
    // 选项文字
    '--theme-choice-text-color': 'rgba(47, 36, 31, 0.9)', // 选项文字颜色。
    '--theme-choice-text-color-hover': 'rgba(47, 36, 31, 1)', // 悬停时选项文字颜色。
    '--theme-choice-text-color-selected': 'rgba(47, 36, 31, 1)', // 选中时选项文字颜色。
    '--theme-choice-text-font-size': 'clamp(0.9rem, 1.5vw, 1.05rem)', // 选项文字字体大小。
    '--theme-choice-text-font-weight': '400', // 选项文字字重。
    '--theme-choice-text-font-family': "'Noto Serif SC', 'Noto Serif', Georgia, serif", // 选项文字字体。
    '--theme-choice-text-line-height': '1.5', // 选项文字行高。
    '--theme-choice-text-letter-spacing': '0.02em', // 选项文字字间距。
    '--theme-choice-text-placeholder-color': 'rgba(92, 76, 68, 0.45)', // 自定义输入占位符颜色。
    '--theme-choice-caret-color': 'var(--theme-accent, #6e4736)', // 自定义输入光标颜色。

    // 自由输入选项悬浮发送按钮
    '--theme-choice-send-btn-color': 'rgba(110, 70, 54, 0.7)',
    '--theme-choice-send-btn-hover-color': 'rgba(110, 70, 54, 1)',
    '--theme-choice-send-btn-disabled-color': 'rgba(160, 140, 130, 0.4)',

    // 输入面板
    '--theme-input-backdrop': 'rgba(26, 21, 32, 0.35)', // 输入面板遮罩颜色。
    '--theme-input-title-color': 'rgba(74, 50, 40, 0.9)', // "自由输入"标题颜色（深棕色，适合浅色背景）。
    '--theme-input-send-btn-bg': 'rgba(110, 70, 54, 0.85)', // 发送按钮背景色（偏棕）。
    '--theme-input-send-btn-border-color': 'rgba(110, 70, 54, 0.6)', // 发送按钮边框色。
    '--theme-input-send-btn-color': 'rgba(255, 250, 240, 0.95)', // 发送按钮文字色。
    '--theme-input-send-btn-disabled-bg': 'rgba(180, 165, 155, 0.3)', // 发送按钮禁用态背景。
    '--theme-input-send-btn-disabled-color': 'rgba(160, 140, 130, 0.5)', // 发送按钮禁用态文字色。
    '--theme-input-textarea-color': 'rgba(74, 50, 40, 0.9)', // 输入框文字颜色（深棕）。
    '--theme-input-textarea-bg': 'rgba(255, 252, 248, 0.1)', // 输入框背景（浅色半透明）。
    '--theme-input-textarea-border-color': 'rgba(110, 70, 54, 0.3)', // 输入框边框颜色。
    '--theme-input-textarea-border-width': '0.3px', // 输入框边框粗细。
    '--theme-input-textarea-min-height': '7.1rem', // 输入框最小高度（控制高度）。
    '--theme-input-textarea-padding-right': '0.5rem', // 输入框右侧内边距，为发送按钮留出空间。
    '--theme-input-textarea-placeholder-color': 'rgba(130, 110, 100, 0.45)', // 输入框占位符颜色。
    '--theme-input-send-btn-right': '1.1rem', // 发送按钮距输入区右侧的距离。
    '--theme-input-send-btn-bottom': '0.9rem', // 发送按钮距输入区底部的距离。
    '--theme-input-close-btn-color': 'rgba(130, 110, 100, 0.6)', // 关闭按钮颜色。
    '--theme-input-close-btn-hover-color': 'rgba(110, 70, 54, 0.9)', // 关闭按钮悬停颜色。

    // 弹窗面板（通用）：控制设置、历史、角色信息等弹窗的背景、遮罩、滤镜。
    '--theme-panel-bg': 'rgba(20, 16, 28, 0)', // 弹窗 CSS 背景；当前透明，主要依赖 PNG。
    '--theme-panel-border': 'transparent', // 弹窗 CSS 边框；当前透明，边框由 PNG 承担。
    '--theme-panel-radius': '0px', // 弹窗圆角；图片外壳模式下一般保持 0。
    '--theme-panel-backdrop': 'rgba(26, 21, 32, 0.52)', // 弹窗打开时覆盖舞台的遮罩颜色。
    '--theme-panel-backdrop-blur': '0px', // 弹窗遮罩背景模糊强度。
    '--theme-panel-content-blur': '0px', // 弹窗内容区域背景模糊强度。
    '--theme-panel-content-saturate': '115%', // 弹窗内容区域饱和度滤镜。

    // 角色信息面板：独立配置角色资料、立绘信息等弹窗的尺寸。
    '--theme-character-panel-shell-max-width': 'min(100%, 69rem)', // 角色面板 PNG 外壳的最大宽度。
    '--theme-character-panel-shell-max-height': '100%', // 角色面板 PNG 外壳的最大高度。

    // 设置面板：独立配置主题设置、音量、显示选项等弹窗的尺寸。
    '--theme-settings-panel-shell-max-width': 'min(100%, 42rem)', // 设置面板 PNG 外壳的最大宽度。
    '--theme-settings-panel-shell-max-height': '90%', // 设置面板 PNG 外壳的最大高度。

    // 历史记录面板：独立配置查看已播放文本或对话记录弹窗的尺寸。
    '--theme-history-panel-shell-max-width': 'min(100%, 42rem)', // 历史面板 PNG 外壳的最大宽度。
    '--theme-history-panel-shell-max-height': '90%', // 历史面板 PNG 外壳的最大高度。

    // 成就列表：独立配置成就通知条背景、边框等样式。
    '--theme-achievement-item-bg': 'rgba(171, 161, 150, 0.45)', // 成就条目默认背景色。
    '--theme-achievement-item-border': 'rgba(180, 165, 210, 0.3)', // 成就条目边框色。
    '--theme-achievement-item-bg-hover': 'rgba(103, 97, 90, 0.5)', // 成就条目悬停背景色。
    '--theme-achievement-item-bg-completed': 'rgba(188, 176, 168, 0.2)', // 成就条目已完成背景色。
    '--theme-achievement-item-border-completed': 'rgba(180, 165, 210, 0.2)', // 成就条目已完成边框色。

    // 通用弹窗面板尺寸（仅用于不支持独立配置的旧面板或 fallback）。
    '--theme-panel-shell-max-width': 'min(100%, 42rem)', // 弹窗 PNG 外壳的最大宽度。
    '--theme-panel-shell-max-height': '90%', // 弹窗 PNG 外壳的最大高度。
    '--theme-panel-max-height': '100%', // 弹窗内部内容占 PNG 外壳的最大高度。

    // 顶部快捷菜单：统一管理所有状态下的按钮间距（使用 clamp 实现响应式缩放）
    '--theme-quick-menu-top': 'clamp(0.5rem, 1.2vw, 0.85rem)', // 快捷菜单距离舞台顶部的位置。
    '--theme-quick-menu-left-top': 'clamp(0.5rem, 1.2vw, 0.85rem)', // 左侧快捷菜单距离舞台顶部的位置。
    '--theme-quick-menu-right-top': 'clamp(0.5rem, 1.2vw, 0.85rem)', // 右侧快捷菜单距离舞台顶部的位置。
    '--theme-quick-menu-left': 'clamp(0.4rem, 0.9vw, 0.65rem)', // 左侧快捷菜单距离舞台左侧的位置。
    '--theme-quick-menu-right': 'clamp(0.4rem, 0.9vw, 0.65rem)', // 右侧快捷菜单距离舞台右侧的位置。
    '--theme-quick-menu-gap': '0em', // 快捷菜单内所有按钮（收起/展开态）的垂直间距，统一控制

    // 收起态按钮尺寸（使用 clamp 实现响应式缩放）
    '--theme-quick-menu-left-collapsed-size': 'clamp(2.5rem, 5vw, 3.85rem)', // 左侧收起态 PNG 外壳尺寸。
    '--theme-quick-menu-right-collapsed-size': 'clamp(2.5rem, 5vw, 3.85rem)', // 右侧收起态 PNG 外壳尺寸。
    '--theme-quick-menu-left-collapsed-icon-size': 'clamp(0.8rem, 1.5vw, 1.12rem)', // 左侧收起态中间图标大小。
    '--theme-quick-menu-right-collapsed-icon-size': 'clamp(0.8rem, 1.5vw, 1.12rem)', // 右侧收起态中间图标大小。
    '--theme-quick-menu-left-collapsed-icon-translate-x': 'clamp(-5px, -0.8vw, -8px)', // 左侧收起态图标水平微调，正值向右。
    '--theme-quick-menu-left-collapsed-icon-translate-y': '0px', // 左侧收起态图标垂直微调，正值向下。
    '--theme-quick-menu-right-collapsed-icon-translate-x': 'clamp(-1px, 0.3vw, 0px)', // 右侧收起态图标水平微调，正值向右。
    '--theme-quick-menu-right-collapsed-icon-translate-y': '0px', // 右侧收起态图标垂直微调，正值向下。

    // 展开态外壳尺寸（1.2倍，使用 clamp 实现响应式缩放）
    '--theme-quick-menu-left-expanded-width': 'clamp(7rem, 15vw, 11.625rem)', // 左侧展开态 PNG 外壳宽度。
    '--theme-quick-menu-left-expanded-height': 'clamp(2.8rem, 6vw, 4.5rem)', // 左侧展开态 PNG 外壳高度。
    '--theme-quick-menu-right-expanded-width': 'clamp(7rem, 15vw, 11.625rem)', // 右侧展开态 PNG 外壳宽度。
    '--theme-quick-menu-right-expanded-height': 'clamp(2.8rem, 6vw, 4.5rem)', // 右侧展开态 PNG 外壳高度。
    // 展开态图标（使用 clamp 实现响应式缩放）
    '--theme-quick-menu-left-expanded-icon-size': 'clamp(0.8rem, 1.6vw, 1.2rem)', // 左侧展开态图标大小。
    '--theme-quick-menu-right-expanded-icon-size': 'clamp(0.8rem, 1.6vw, 1.2rem)', // 右侧展开态图标大小。
    '--theme-quick-menu-left-expanded-icon-translate-x': 'clamp(-2px, 0.3vw, 0px)', // 左侧展开态图标水平微调，正值向右。
    '--theme-quick-menu-left-expanded-icon-translate-y': 'clamp(-1px, 0.2vw, 0px)', // 左侧展开态图标垂直微调，正值向下。
    '--theme-quick-menu-right-expanded-icon-translate-x': 'clamp(0px, 0.4vw, 2px)', // 右侧展开态图标水平微调，正值向右。
    '--theme-quick-menu-right-expanded-icon-translate-y': 'clamp(-0.5px, 0.2vw, -0.2px)', // 右侧展开态图标垂直微调，正值向下。

    // 展开态文字（使用 clamp 实现响应式缩放）
    '--theme-quick-menu-left-expanded-text-size': 'clamp(1rem, 2vw, 1.5rem)', // 左侧展开态文字大小。
    '--theme-quick-menu-right-expanded-text-size': 'clamp(1rem, 2vw, 1.5rem)', // 右侧展开态文字大小。
    '--theme-quick-menu-left-expanded-text-translate-x': 'clamp(-2px, 0.3vw, 0px)', // 左侧展开态文字水平微调，正值向右。
    '--theme-quick-menu-left-expanded-text-translate-y': 'clamp(-3px, 0.4vw, -2px)', // 左侧展开态文字垂直微调，正值向下。
    '--theme-quick-menu-right-expanded-text-translate-x': 'clamp(-2px, 0.3vw, 0px)', // 右侧展开态文字水平微调，正值向右。
    '--theme-quick-menu-right-expanded-text-translate-y': 'clamp(-3px, 0.4vw, -2px)', // 右侧展开态文字垂直微调，正值向下。

    // Toast：控制右上角/浮层提示消息的外观。
    '--theme-toast-bg': 'rgba(246, 238, 225, 0.96)', // Toast 背景色。
    '--theme-toast-color': '#2f241f', // Toast 文字颜色。
    '--theme-toast-border': 'rgba(110, 71, 54, 0.32)', // Toast 边框颜色。
    '--theme-toast-radius': '4px', // Toast 圆角。
    '--theme-toast-shadow': '0 8px 24px rgba(0,0,0,0.45)', // Toast 阴影。
  },
  components: {
    // ========== 对话框主体背景 PNG 壳 ==========
    // 对话框整体背景图片，组件可以超出它，它只作为背景存在。
    dialogue: {
      shellImage: dialogueBoxImage,
      shellSize: { width: '100%', height: 'auto' },
      contentInset: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    },
    // ========== 头像壳 ==========
    // 显示玩家头像的 PNG 外框。
    dialoguePortrait: {
      shellImage: dialogueAvatarShellImage,
      shellSize: {
        width: 'var(--theme-dialogue-portrait-width, 4rem)',
        height: 'var(--theme-dialogue-portrait-height, 4rem)',
      },
      contentInset: {
        top: 'clamp(1.5rem, 3vw, 3.5rem)',
        right: 'clamp(1.5rem, 3vw, 3.5rem)',
        bottom: 'clamp(0.5rem, 1.5vw, 2rem)',
        left: 'clamp(0.75rem, 1.8vw, 2.5rem)',
      },
    },
    // ========== 名字框 ==========
    // 显示角色名字的 PNG 外框。
    dialogueName: {
      shellImage: dialogueNameTagImage,
      shellSize: { width: 'clamp(10rem, 20vw, 22rem)', height: 'auto' },
      contentInset: {
        top: 'clamp(0.15rem, 0.4vw, 0.6rem)',
        right: 'clamp(0.5rem, 1.5vw, 2rem)',
        bottom: 'clamp(0.1rem, 0.3vw, 0.5rem)',
        left: 'clamp(0.25rem, 0.8vw, 1.5rem)',
      },
    },
    // ========== 主文本框 ==========
    // 对话框内文字内容区，不含头像、名字、翻页按钮。
    dialogueText: {
      shellImage: null,
      shellSize: { width: '100%', height: 'auto' },
      contentInset: {
        top: 'var(--theme-dialogue-text-padding-top, 2.5rem)',
        right: 'var(--theme-dialogue-text-padding-right, 3.5rem)',
        bottom: 'var(--theme-dialogue-text-padding-bottom, 1.5rem)',
        left: 'var(--theme-dialogue-text-padding-left, 0.5rem)',
      },
    },
    // ========== 左侧翻页按钮（指向左，左右翻转自右侧 SVG） ==========
    dialogueNavPrev: {
      shellImage: DIALOGUE_NAV_SVG,
      shellSize: {
        width: 'var(--theme-dialogue-nav-btn-size, 2rem)',
        height: 'var(--theme-dialogue-nav-btn-size, 2rem)',
      },
      contentInset: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    },
    // ========== 右侧翻页按钮（指向右） ==========
    dialogueNavNext: {
      shellImage: DIALOGUE_NAV_SVG,
      shellSize: {
        width: 'var(--theme-dialogue-nav-btn-size, 2rem)',
        height: 'var(--theme-dialogue-nav-btn-size, 2rem)',
      },
      contentInset: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    },
    // 普通按钮的默认图片外壳。没有专门指定按钮皮肤时会使用它。
    button: {
      shellImage: rightExpandedButtonImage,
      shellSize: { width: '100%', height: '100%' },
      contentInset: {
        top: 'clamp(8px, 1.2vw, 16px)',
        right: 'clamp(14px, 2.5vw, 28px)',
        bottom: 'clamp(8px, 1.2vw, 16px)',
        left: 'clamp(14px, 2.5vw, 28px)',
      },
    },
    // 展开态按钮的图片外壳。常用于带文字、宽度较大的按钮。
    buttonExpanded: {
      shellImage: rightExpandedButtonImage,
      shellSize: { width: '100%', height: '100%' },
      contentInset: {
        top: 'clamp(10px, 1.5vw, 20px)',
        right: 'clamp(18px, 3vw, 36px)',
        bottom: 'clamp(10px, 1.5vw, 20px)',
        left: 'clamp(18px, 3vw, 36px)',
      },
    },
    // 分支选项列表。每个选项按钮独立用 choiceButtonImage 包裹，列表本身仅控制排布和间距。
    choicePanel: {
      shellImage: null,
      shellSize: { width: '100%', height: 'auto' },
      contentInset: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    },
    // 单个选项按钮的图片外壳。每个分支选项都用这张 PNG 包裹，object-cover 铺满固定高度。
    choiceButton: {
      shellImage: choiceButtonImage,
      shellSize: { width: '100%', height: 'var(--theme-choice-btn-shell-height, clamp(3rem, 7vw, 5.5rem))' },
      contentInset: { top: '15px', right: '30px', bottom: '0px', left: '35px' },
      states: {
        hover: choiceButtonImage,
        active: choiceButtonImage,
      },
    },
    // 自由输入面板的图片外壳。控制输入弹窗的背景图片。
    inputPanel: {
      shellImage: inputPanelImage,
      shellSize: { width: 'min(108vw, 38rem)', height: 'auto' },
      contentInset: {
        top: 'clamp(15px, 3vw, 30px)',
        right: 'clamp(10px, 2vw, 22.5px)',
        bottom: 'clamp(20px, 4vw, 40px)',
        left: 'clamp(10px, 2vw, 22.5px)',
      },
    },
    // 角色信息面板的图片外壳。一般用于查看角色资料、立绘信息等。
    characterPanel: {
      shellImage: characterPanelImage,
      shellSize: { width: 'min(100%, clamp(20rem, 85vw, 90rem))', height: 'auto' },
      contentInset: {
        top: 'clamp(50px, 10vw, 100px)',
        right: 'clamp(60px, 12vw, 120px)',
        bottom: 'clamp(50px, 10vw, 100px)',
        left: 'clamp(60px, 12vw, 120px)',
      },
    },
    // 设置面板的图片外壳。用于主题设置、音量、显示选项等设置类弹窗。
    settingsPanel: {
      shellImage: settingsPanelImage,
      shellSize: { width: 'min(100%, clamp(18rem, 80vw, 80rem))', height: 'auto' },
      contentInset: {
        top: 'clamp(30px, 6vw, 60px)',
        right: 'clamp(20px, 4vw, 45px)',
        bottom: 'clamp(30px, 6vw, 60px)',
        left: 'clamp(20px, 4vw, 45px)',
      },
    },
    // 历史记录面板的图片外壳。用于查看已经播放过的文本或对话记录。
    historyPanel: {
      shellImage: settingsPanelImage,
      shellSize: { width: 'min(100%, clamp(18rem, 60vw, 50rem))', height: 'auto' },
      contentInset: {
        top: 'clamp(30px, 6vw, 60px)',
        right: 'clamp(20px, 4vw, 45px)',
        bottom: 'clamp(30px, 6vw, 60px)',
        left: 'clamp(20px, 4vw, 45px)',
      },
    },
    // 舞台框架的图片外壳。当前 shellImage 为 null，表示舞台本体不额外叠 PNG 框。
    stageFrame: {
      shellImage: null,
      shellSize: { width: '100%', height: '100%' },
      contentInset: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    },
    // 左上快捷菜单收起态按钮外壳。通常显示为一个小按钮，点击后展开左侧菜单。
    quickMenuCollapsedLeft: {
      shellImage: leftCollapsedButtonImage,
      shellSize: {
        width: 'var(--theme-quick-menu-left-collapsed-size, var(--theme-quick-menu-collapsed-button-size, 68px))',
        height: 'var(--theme-quick-menu-left-collapsed-size, var(--theme-quick-menu-collapsed-button-size, 68px))',
      },
      contentInset: {
        top: 'clamp(6px, 0.8vw, 12px)',
        right: 'clamp(6px, 0.8vw, 12px)',
        bottom: 'clamp(6px, 0.8vw, 12px)',
        left: 'clamp(6px, 0.8vw, 12px)',
      },
      objectFit: 'contain',
    },
    // 右上快捷菜单收起态按钮外壳。通常显示为一个小按钮，点击后展开右侧菜单。
    quickMenuCollapsedRight: {
      shellImage: rightCollapsedButtonImage,
      shellSize: {
        width: 'var(--theme-quick-menu-right-collapsed-size, var(--theme-quick-menu-collapsed-button-size, 60px))',
        height: 'var(--theme-quick-menu-right-collapsed-size, var(--theme-quick-menu-collapsed-button-size, 60px))',
      },
      contentInset: {
        top: 'clamp(6px, 0.8vw, 12px)',
        right: 'clamp(6px, 0.8vw, 12px)',
        bottom: 'clamp(6px, 0.8vw, 12px)',
        left: 'clamp(6px, 0.8vw, 12px)',
      },
      objectFit: 'contain',
    },
    // 左上快捷菜单展开态外壳。控制展开后那条横向 PNG 菜单底图。
    quickMenuExpandedLeft: {
      shellImage: leftExpandedButtonImage,
      shellSize: {
        width: 'var(--theme-quick-menu-left-expanded-width, var(--theme-quick-menu-expanded-width, 168px))',
        height: 'var(--theme-quick-menu-left-expanded-height, var(--theme-quick-menu-expanded-height, 68px))',
      },
      contentInset: {
        top: 'clamp(6px, 1vw, 14px)',
        right: 'clamp(16px, 2.5vw, 32px)',
        bottom: 'clamp(6px, 1vw, 14px)',
        left: 'clamp(16px, 2.5vw, 32px)',
      },
      objectFit: 'contain',
    },
    // 右上快捷菜单展开态外壳。控制展开后那条横向 PNG 菜单底图。
    quickMenuExpandedRight: {
      shellImage: rightExpandedButtonImage,
      shellSize: {
        width: 'var(--theme-quick-menu-right-expanded-width, var(--theme-quick-menu-expanded-width, 168px))',
        height: 'var(--theme-quick-menu-right-expanded-height, var(--theme-quick-menu-expanded-height, 68px))',
      },
      contentInset: {
        top: 'clamp(6px, 1vw, 14px)',
        right: 'clamp(16px, 2.5vw, 32px)',
        bottom: 'clamp(6px, 1vw, 14px)',
        left: 'clamp(16px, 2.5vw, 32px)',
      },
      objectFit: 'contain',
    },
  },
};
