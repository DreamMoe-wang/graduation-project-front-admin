<template>
    <div class="common-page">
        <el-card>
            <el-empty :description="`正在开发：${pageTitle}`" />
        </el-card>
    </div>
</template>

<script>
export default {
    name: 'CommonPage',
    computed: {
        pageTitle() {
            return this.$route.meta.title || '页面'
        }
    }
}
</script>

<style scoped>
.common-page {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.el-card {
    width: 100%;
    max-width: 600px;
}
</style>
