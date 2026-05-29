console.info('[galgame-v2] 脚本文件已加载，版本:', Date.now());

import { createApp } from 'vue';
import { mountStreamingMessages } from '@util/streaming';
import App from './App.vue';
import { pinia } from './stores';

$(() => {
  console.info('[galgame-v2] 脚本开始加载...');

  const { unmount } = mountStreamingMessages(
    () => createApp(App).use(pinia),
    { host: 'div' },
  );

  console.info('[galgame-v2] 流式界面挂载成功');

  $(window).on('pagehide', () => unmount());
});
