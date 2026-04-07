<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
:root {
  --app-font-size: 16px;
  --app-theme-color: #5b66f3;
  --app-theme-color-light: #aab0fa;
  --app-theme-color-dark: #4852c2;
  --app-theme-color-rgb: 91, 102, 243;
  --app-shell-bg: #edf2f7;
  --app-surface: #ffffff;
  --app-surface-soft: #f8fafc;
  --app-text: #172554;
  --app-text-secondary: #64748b;
  --app-border: #e2e8f0;
  --app-header-bg: #ffffff;
  --app-content-bg: #f0f2f5;
  --app-sidebar-start: #1a1c2e;
  --app-sidebar-end: #2d3142;
  --app-logo-bg: rgba(0, 0, 0, 0.2);
  --app-sidebar-text: rgba(255, 255, 255, 0.78);
  --app-sidebar-text-active: #ffffff;
  --app-card-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

:root[data-theme-mode='dark'] {
  --app-shell-bg: #0f172a;
  --app-surface: #111827;
  --app-surface-soft: #1f2937;
  --app-text: #e5eefc;
  --app-text-secondary: #94a3b8;
  --app-border: rgba(148, 163, 184, 0.18);
  --app-header-bg: #111827;
  --app-content-bg: #0f172a;
  --app-sidebar-start: #0f172a;
  --app-sidebar-end: #111827;
  --app-logo-bg: rgba(255, 255, 255, 0.06);
  --app-sidebar-text: rgba(226, 232, 240, 0.82);
  --app-sidebar-text-active: #ffffff;
  --app-card-shadow: 0 16px 36px rgba(2, 6, 23, 0.35);
  --el-bg-color: #111827;
  --el-bg-color-overlay: #1f2937;
  --el-card-bg-color: #111827;
  --el-fill-color-light: #1f2937;
  --el-fill-color-lighter: #273449;
  --el-fill-color-extra-light: #273449;
  --el-fill-color-blank: #111827;
  --el-border-color-light: rgba(148, 163, 184, 0.18);
  --el-border-color: rgba(148, 163, 184, 0.22);
  --el-border-color-lighter: rgba(148, 163, 184, 0.14);
  --el-border-color-extra-light: rgba(148, 163, 184, 0.12);
  --el-text-color-primary: #e5eefc;
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: #94a3b8;
  --el-text-color-placeholder: #94a3b8;
  --el-table-tr-bg-color: #111827;
  --el-table-header-bg-color: #1f2937;
  --el-table-border-color: rgba(148, 163, 184, 0.18);
  --el-mask-color: rgba(15, 23, 42, 0.72);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100vh;
}

html {
  font-size: var(--app-font-size);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: var(--app-font-size);
  background: var(--app-shell-bg);
  color: var(--app-text);
  transition: background 0.25s ease, color 0.25s ease;
}

a,
button,
input,
textarea,
select {
  font: inherit;
}

.el-card,
.el-dialog,
.el-table,
.el-table tr,
.el-table th.el-table__cell,
.el-table td.el-table__cell,
.el-input__wrapper,
.el-textarea__inner,
.el-select__wrapper,
.el-form-item__label,
.el-descriptions__body,
.el-pagination,
.el-empty__description p {
  transition: background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}

.common-page {
  color: var(--app-text);
}

.common-page .el-card {
  background: var(--app-surface);
  border-color: var(--app-border);
  box-shadow: var(--app-card-shadow);
}
</style>
