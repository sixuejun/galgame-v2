import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/index.css'
import { logger } from './utils/logger'
import { useSettingsStore } from './stores/settingsStore'

const app = createApp(App)
const pinia = createPinia()

// 安装 Pinia
app.use(pinia)

// 加载应用设置
const settingsStore = useSettingsStore()
settingsStore.loadSettings()

// 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  logger.error('全局错误:', err)
  logger.error('错误信息:', info)
  logger.error('组件实例:', instance)

  // 可以在这里上报错误到监控服务
  // reportErrorToService(err, info)
}

// 全局警告处理
app.config.warnHandler = (msg, _instance, trace) => {
  logger.warn('警告:', msg)
  logger.warn('追踪:', trace)
}

app.mount('#app')
