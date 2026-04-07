import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './stores'
import { useSystemSettingStore } from './stores/systemSetting'
import permissionDirective from './directives/permission'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

async function bootstrap() {
  const systemSettingStore = useSystemSettingStore(pinia)
  systemSettingStore.initialize()

  try {
    await systemSettingStore.syncRemote()
  } catch (error) {
    console.error('Load system settings failed:', error)
  }

  const app = createApp(App)

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }

  app.use(ElementPlus)
  app.use(router)
  app.use(pinia)
  app.directive('permission', permissionDirective)
  app.mount('#app')
}

bootstrap()
