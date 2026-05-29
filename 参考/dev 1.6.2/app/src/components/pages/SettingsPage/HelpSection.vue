<!--
  HelpSection 组件

  帮助 & FAQ 区域，展示常见问题和解答。

  功能：
  - 展示常见问题列表
  - 提供可折叠的问答内容

  Props:
  无

  Emits:
  无

  使用示例:
  ```vue
  <HelpSection />
  ```
-->
<template>
  <section class="settings-section">
    <h2 class="section-title">
      <i class="fas fa-question-circle"></i>
      帮助 & FAQ
    </h2>

    <div class="faq-list">
      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          什么是 AI 请求重试？
        </summary>
        <div class="faq-answer">
          当 AI 返回的数据格式不正确时，系统会自动重新发送请求。您可以设置最多重试多少次。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          数据处理重试是什么？
        </summary>
        <div class="faq-answer">
          当 AI 返回的数据无法正确解析或应用到游戏中时，系统会重新请求 AI 生成新的数据。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          如何优化 AI 响应速度？
        </summary>
        <div class="faq-answer">
          您可以适当降低重试次数和延迟时间，但这可能会降低成功率。建议保持默认设置。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          调试模式有什么用？
        </summary>
        <div class="faq-answer">
          启用调试模式后，系统会在浏览器控制台输出详细的运行日志，方便排查问题。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          如何选择合适的主题？
        </summary>
        <div class="faq-answer">
          系统提供了多种主题供您选择：默认主题、护眼模式、高对比度、冷色主题和暖色主题。护眼模式适合长时间使用，高对比度适合视力较弱的用户，冷色和暖色主题可根据个人喜好选择。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          显示主页标题有什么作用？
        </summary>
        <div class="faq-answer">
          控制主页顶部的标题区域是否显示。如果您希望获得更简洁的界面或更大的内容显示区域，可以关闭此选项。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          自动保存功能如何工作？
        </summary>
        <div class="faq-answer">
          启用自动保存后，系统会在您每次做出选择后自动保存游戏进度，无需手动保存。这样可以防止意外关闭页面导致进度丢失。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          图片生成服务有什么区别？
        </summary>
        <div class="faq-answer">
          系统支持两种图片生成服务：<br />
          • <strong>Pollinations.ai</strong>：在线服务，无需额外配置，但需要网络连接。<br />
          • <strong>ST-ChatU8</strong>：外部应用服务，需要在本地运行 ST-ChatU8
          应用，可离线使用，生成的图片会自动缓存。
        </div>
      </details>

      <details class="faq-item">
        <summary class="faq-question">
          <i class="fas fa-chevron-right"></i>
          ST-ChatU8 超时时间如何设置？
        </summary>
        <div class="faq-answer">
          当使用 ST-ChatU8
          服务生成图片时，系统会等待指定的超时时间。如果您的设备性能较好，可以适当降低超时时间；如果生成图片经常超时，建议增加超时时间。默认为
          30 秒，建议范围为 5-120 秒。
        </div>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
// 此组件无需任何逻辑，仅展示静态内容
</script>

<style scoped>
/* ========================================
   设置区域
   ======================================== */
.settings-section {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  border: 1px solid var(--border-color);
}

.section-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--primary-blue);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.section-title i {
  font-size: var(--text-lg);
}

/* ========================================
   FAQ 列表
   ======================================== */
.faq-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.faq-item {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.faq-question {
  padding: var(--spacing-md);
  background: var(--bg-primary);
  cursor: pointer;
  font-weight: var(--font-medium);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  transition: background-color 0.2s;
  user-select: none;
}

.faq-question:hover {
  background: var(--border-color);
}

.faq-question i {
  font-size: var(--text-xs);
  color: var(--primary-blue);
  transition: transform 0.2s;
}

.faq-item[open] .faq-question i {
  transform: rotate(90deg);
}

.faq-answer {
  padding: var(--spacing-md);
  color: var(--text-secondary);
  line-height: 1.6;
  border-top: 1px solid var(--border-color);
}

/* ========================================
   响应式设计
   ======================================== */
@media (max-width: 768px) {
  .settings-section {
    padding: var(--spacing-lg);
  }
}

@media (max-width: 480px) {
  .settings-section {
    padding: var(--spacing-md);
  }

  .section-title {
    font-size: var(--text-lg);
  }
}
</style>
