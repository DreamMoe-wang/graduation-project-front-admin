<template>
    <div class="tags-view">
        <el-scrollbar class="tags-scroll">
            <el-tag
                v-for="tag in visitedViews"
                :key="tag.path"
                :closable="!isAffix(tag)"
                :effect="isActive(tag) ? 'dark' : 'plain'"
                :type="isActive(tag) ? 'primary' : 'info'"
                class="tags-item"
                @click="handleClickTag(tag)"
                @close="handleCloseTag(tag)"
            >
                {{ tag.title }}
            </el-tag>
        </el-scrollbar>
    </div>
</template>

<script>
import { addCloseTagListener } from '@/utils/tags'
import { useSystemSettingStore } from '@/stores/systemSetting'

export default {
    name: 'TagsView',
    data() {
        return {
            visitedViews: [],
            removeCloseTagListener: null
        }
    },
    computed: {
        systemSettingStore() {
            return useSystemSettingStore()
        },
        currentLanguage() {
            return this.systemSettingStore.language
        }
    },
    watch: {
        $route() {
            this.addTags()
        },
        currentLanguage() {
            this.refreshTitles()
        }
    },
    mounted() {
        this.addTags()
        this.removeCloseTagListener = addCloseTagListener(this.handleExternalCloseTag)
    },
    beforeUnmount() {
        this.removeCloseTagListener?.()
    },
    methods: {
        isActive(route) {
            return route.path === this.$route.path
        },
        isAffix(tag) {
            return tag.affix
        },
        resolveTitle(route) {
            return this.systemSettingStore.translateByPath(route.path, route.meta?.title || route.name || route.path)
        },
        addTags() {
            const { name, path, meta } = this.$route
            if (meta && meta.title && !this.visitedViews.some(view => view.path === path)) {
                this.visitedViews.push({
                    title: this.resolveTitle(this.$route),
                    path,
                    name,
                    affix: meta.affix || false
                })
                return
            }

            this.refreshTitles()
        },
        refreshTitles() {
            this.visitedViews = this.visitedViews.map(tag => ({
                ...tag,
                title: this.systemSettingStore.translateByPath(tag.path, tag.title)
            }))
        },
        handleClickTag(tag) {
            this.$router.push(tag.path)
        },
        handleCloseTag(tag) {
            const index = this.visitedViews.findIndex(view => view.path === tag.path)
            if (index === -1) return

            this.visitedViews.splice(index, 1)

            if (tag.path === this.$route.path) {
                const prevTag = this.visitedViews[index - 1] || this.visitedViews[index]
                if (prevTag) {
                    this.$router.push(prevTag.path)
                } else {
                    this.$router.push('/')
                }
            }
        },
        handleExternalCloseTag(path) {
            if (!path) return

            const tag = this.visitedViews.find(view => view.path === path)
            if (!tag) return

            this.handleCloseTag(tag)
        }
    }
}
</script>

<style scoped>
.tags-view {
    height: 34px;
    background: var(--app-header-bg);
    border-bottom: 1px solid var(--app-border);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    padding: 4px 16px 0;
    display: flex;
    align-items: center;
}

.tags-scroll {
    width: 100%;
    white-space: nowrap;
}

.tags-item {
    margin-right: 8px;
    cursor: pointer;
    font-size: 12px;
    padding: 0 8px;
    height: 26px;
    line-height: 26px;
    border-radius: 3px;
    transition: all 0.3s;
}

.tags-item:hover {
    opacity: 0.82;
}

.tags-item.is-affix {
    padding-right: 8px;
}

.tags-item:not(.is-affix) {
    padding-right: 6px;
}

.tags-item .el-tag__close {
    right: 2px;
    width: 14px;
    height: 14px;
    font-size: 12px;
    line-height: 14px;
}

.tags-item .el-tag__close:hover {
    background-color: rgba(100, 116, 139, 0.9);
    color: white;
}
</style>
