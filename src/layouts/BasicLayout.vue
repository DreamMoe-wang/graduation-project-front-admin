<template>
    <div class="layout-container">
        <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
            <div class="logo">
                <img :src="sidebarLogo" alt="同城任务" class="logo-image">
                <span v-if="!sidebarCollapsed" class="logo-text">同城任务</span>
            </div>

            <nav class="menu">
                <template v-for="item in normalizedMenus" :key="item.id || item.path">
                    <div v-if="item.children && item.children.length > 0" class="menu-group">
                        <div class="menu-item group-title" @click="toggleGroup(item.path)">
                            <el-icon class="icon" :size="20">
                                <component :is="item.icon || 'Menu'" />
                            </el-icon>
                            <span v-if="!sidebarCollapsed" class="menu-name">{{ item.name }}</span>
                            <el-icon
                                v-if="!sidebarCollapsed"
                                class="arrow"
                                :class="{ rotated: expandedGroups.includes(item.path) }"
                            >
                                <ArrowRight />
                            </el-icon>
                        </div>
                        <div v-show="!sidebarCollapsed && expandedGroups.includes(item.path)" class="submenu">
                            <router-link
                                v-for="child in item.children"
                                :key="child.id || child.path"
                                :to="child.path"
                                class="menu-item submenu-item"
                                active-class="active"
                            >
                                <el-icon class="icon" :size="18">
                                    <component :is="child.icon || 'Document'" />
                                </el-icon>
                                <span class="menu-name">{{ child.name }}</span>
                            </router-link>
                        </div>
                    </div>

                    <router-link
                        v-else
                        :to="item.path"
                        class="menu-item"
                        active-class="active"
                    >
                        <el-icon class="icon" :size="20">
                            <component :is="item.icon || 'Document'" />
                        </el-icon>
                        <span v-if="!sidebarCollapsed" class="menu-name">{{ item.name }}</span>
                    </router-link>
                </template>

                <el-empty
                    v-if="!normalizedMenus.length"
                    description="暂无菜单权限"
                    :image-size="72"
                    class="menu-empty"
                />
            </nav>
        </aside>

        <div class="main-container" :class="{ collapsed: sidebarCollapsed }">
            <header class="header">
                <el-button class="toggle-btn" @click="toggleSidebar" link>
                    <el-icon :size="20">
                        <Fold v-if="!sidebarCollapsed" />
                        <Expand v-else />
                    </el-icon>
                </el-button>
                <div class="header-right">
                    <el-dropdown trigger="click" @command="handleCommand">
                        <div class="user-entry">
                            <el-avatar :size="32" :src="currentUser?.avatar">
                                {{ displayInitial }}
                            </el-avatar>
                            <span class="username">{{ displayName }}</span>
                            <el-icon class="user-arrow">
                                <ArrowDown />
                            </el-icon>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </header>

            <TagsView />

            <main class="content">
                <router-view />
            </main>
        </div>
    </div>
</template>

<script>
import TagsView from '@/components/TagsView.vue'
import { useAuthStore } from '@/stores/auth'
import { ArrowDown, Fold, Expand, ArrowRight } from '@element-plus/icons-vue'
import sidebarLogo from '@/assets/login-logo.jpg'

function normalizeMenuTree(menus = []) {
    return (menus || [])
        .filter(item => item && item.menuType !== 3 && item.visible !== 0 && item.status !== 0 && item.path)
        .map(item => ({
            id: item.id,
            path: item.path,
            name: item.name,
            icon: item.icon,
            routeName: item.routeName,
            children: normalizeMenuTree(item.children || [])
        }))
}

function collectExpandedGroups(menus, currentPath, groups = []) {
    for (const item of menus) {
        if (!item.children || !item.children.length) continue

        const childMatched = item.children.some(child => currentPath === child.path || currentPath.startsWith(`${child.path}/`))
        if (childMatched) {
            groups.push(item.path)
        }

        collectExpandedGroups(item.children, currentPath, groups)
    }

    return groups
}

export default {
    name: 'BasicLayout',
    components: {
        TagsView,
        Fold,
        Expand,
        ArrowRight,
        ArrowDown
    },
    data() {
        return {
            sidebarCollapsed: false,
            sidebarLogo,
            expandedGroups: []
        }
    },
    computed: {
        authStore() {
            return useAuthStore()
        },
        currentUser() {
            return this.authStore.currentUser
        },
        displayName() {
            return this.authStore.displayName
        },
        displayInitial() {
            return this.displayName ? this.displayName.charAt(0) : '管'
        },
        normalizedMenus() {
            return normalizeMenuTree(this.authStore.currentMenus)
        }
    },
    watch: {
        '$route.path': {
            handler(path) {
                this.syncExpandedGroups(path)
            },
            immediate: true
        },
        normalizedMenus: {
            handler() {
                this.syncExpandedGroups(this.$route.path)
            },
            deep: true
        }
    },
    methods: {
        toggleSidebar() {
            this.sidebarCollapsed = !this.sidebarCollapsed
        },
        toggleGroup(path) {
            const index = this.expandedGroups.indexOf(path)
            if (index > -1) {
                this.expandedGroups.splice(index, 1)
            } else {
                this.expandedGroups.push(path)
            }
        },
        syncExpandedGroups(currentPath) {
            const nextGroups = collectExpandedGroups(this.normalizedMenus, currentPath, [])
            this.expandedGroups = Array.from(new Set(nextGroups))
        },
        async handleCommand(command) {
            if (command !== 'logout') return

            try {
                await this.$confirm('确认退出当前登录状态吗？', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                })

                this.authStore.logout()
                this.$router.replace('/login')
                this.$message.success('已退出登录')
            } catch (error) {
                if (error !== 'cancel') {
                    console.error('退出登录失败:', error)
                }
            }
        }
    }
}
</script>

<style scoped>
.layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
}

.sidebar {
    width: 240px;
    background: linear-gradient(180deg, #1a1c2e 0%, #2d3142 100%);
    transition: width 0.3s ease;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar.collapsed {
    width: 64px;
}

.logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: white;
    font-size: 1.4rem;
    font-weight: 700;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    padding: 0 12px;
}

.logo-image {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
}

.logo-text {
    white-space: nowrap;
}

.menu {
    padding: 8px 0;
    overflow-y: auto;
    flex: 1;
}

.menu-empty {
    margin-top: 48px;
}

.menu::-webkit-scrollbar {
    width: 4px;
}

.menu::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
}

.menu-item {
    display: flex;
    align-items: center;
    padding: 14px 24px;
    margin: 4px 8px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.3s;
    cursor: pointer;
    border-radius: 8px;
    position: relative;
}

.menu-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateX(4px);
}

.menu-item.active {
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.4) 0%, rgba(102, 126, 234, 0.1) 100%);
    color: #667eea;
    font-weight: 500;
}

.menu-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: #667eea;
    border-radius: 0 2px 2px 0;
}

.icon {
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: margin 0.3s;
    color: currentColor;
}

.menu-name {
    white-space: nowrap;
    opacity: 1;
    transition: opacity 0.3s;
    flex: 1;
}

.group-title {
    justify-content: space-between;
}

.group-title .arrow {
    transition: transform 0.3s;
}

.group-title .arrow.rotated {
    transform: rotate(90deg);
}

.submenu {
    padding-left: 20px;
}

.submenu-item {
    padding-left: 44px;
    font-size: 0.95rem;
}

.submenu-item .icon {
    font-size: 1.1rem;
}

.sidebar.collapsed .menu-item {
    justify-content: center;
    padding: 14px;
    margin: 4px 8px;
}

.sidebar.collapsed .logo {
    gap: 0;
    padding: 0;
}

.sidebar.collapsed .logo-image {
    width: 34px;
    height: 34px;
}

.sidebar.collapsed .icon {
    margin-right: 0;
}

.sidebar.collapsed .menu-name {
    display: none;
}

.sidebar.collapsed .menu-item.active::before {
    height: 60%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 60%;
    border-radius: 2px;
}

.main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header {
    height: 64px;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 10;
}

.toggle-btn {
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.3s;
    color: #333;
}

.toggle-btn:hover {
    background: #f5f5f5;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-entry {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 999px;
    transition: background 0.3s ease;
}

.user-entry:hover {
    background: #f5f7fb;
}

.username {
    color: #666;
    font-size: 0.95rem;
}

.user-arrow {
    color: #909399;
}

.content {
    flex: 1;
    overflow-y: auto;
    background: #f0f2f5;
    padding: 24px;
}

.content::-webkit-scrollbar {
    width: 6px;
}

.content::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}
</style>
