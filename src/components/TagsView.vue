<template>
    <div class="tags-view">
        <el-scrollbar class="tags-scroll">
            <el-tag v-for="tag in visitedViews" :key="tag.path" :closable="!isAffix(tag)"
                :effect="isActive(tag) ? 'dark' : 'plain'" :type="isActive(tag) ? 'primary' : 'info'" class="tags-item"
                @click="handleClickTag(tag)" @close="handleCloseTag(tag)">
                {{ tag.title }}
            </el-tag>
        </el-scrollbar>
    </div>
</template>

<script>
export default {
    name: 'TagsView',
    data() {
        return {
            visitedViews: []
        }
    },
    watch: {
        $route() {
            this.addTags()
        }
    },
    mounted() {
        this.addTags()
    },
    methods: {
        isActive(route) {
            return route.path === this.$route.path
        },
        isAffix(tag) {
            return tag.affix
        },
        addTags() {
            const { name, path, meta } = this.$route
            if (meta && meta.title && !this.visitedViews.some(v => v.path === path)) {
                this.visitedViews.push({
                    title: meta.title,
                    path,
                    name,
                    affix: meta.affix || false
                })
            }
        },
        handleClickTag(tag) {
            this.$router.push(tag.path)
        },
        handleCloseTag(tag) {
            const index = this.visitedViews.findIndex(v => v.path === tag.path)
            if (index === -1) return

            this.visitedViews.splice(index, 1)

            // 如果关闭的是当前标签，跳转到前一个标签或首页
            if (tag.path === this.$route.path) {
                const prevTag = this.visitedViews[index - 1] || this.visitedViews[index]
                if (prevTag) {
                    this.$router.push(prevTag.path)
                } else {
                    this.$router.push('/')
                }
            }
        }
    }
}
</script>

<style scoped>
.tags-view {
    height: 34px;
    background: #fff;
    border-bottom: 1px solid #e6e6e6;
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
    opacity: 0.8;
}

/* 固定标签不显示关闭按钮 */
.tags-item.is-affix {
    padding-right: 8px;
}

/* 可关闭的标签增加右侧内边距 */
.tags-item:not(.is-affix) {
    padding-right: 6px;
}

/* 自定义关闭按钮样式 */
.tags-item .el-tag__close {
    right: 2px;
    width: 14px;
    height: 14px;
    font-size: 12px;
    line-height: 14px;
}

.tags-item .el-tag__close:hover {
    background-color: #999;
    color: white;
}
</style>
