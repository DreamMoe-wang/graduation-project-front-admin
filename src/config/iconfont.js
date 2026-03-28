/**
 * IconFont 图标库配置
 * 请在 https://www.iconfont.cn/ 创建项目并生成 symbol 链接
 * 然后将下面的 URL 替换为你自己的项目链接
 */

// 方式一：使用 Symbol 方式（推荐）
// 1. 在 iconfont 创建项目后，查看"在线链接"中的 symbol 链接
// 2. 将链接复制到下面
export const ICONFONT_SYMBOL_URL = ''

// 方式二：如果已经有具体的图标 ID，可以直接使用
// 使用示例：<svg class="icon" aria-hidden="true"><use xlink:href="#icon-xxx"></use></svg>

/**
 * 常用图标映射（根据你的 iconfont 项目调整）
 * 这里先使用 Element Plus 图标作为默认方案
 */
export const iconMap = {
  // 菜单图标使用 Element Plus Icons
  home: 'HomeFilled',
  trade: 'ShoppingCart',
  publish: 'Edit',
  list: 'List',
  order: 'Document',
  chat: 'ChatDotRound',
  user: 'User',
  role: 'Avatar',
  menu: 'Menu',
  dict: 'Collection',
  notice: 'Bell',
  log: 'Notebook',
  setting: 'Setting'
}
