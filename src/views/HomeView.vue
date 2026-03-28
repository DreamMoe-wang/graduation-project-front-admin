<template>
    <div class="home-container">
        <div class="welcome-card">
            <h1 class="welcome-text">你好</h1>
            <p class="subtitle">欢迎来到 Vue3 管理后台系统</p>
            <div class="stats-grid">
                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <TrendCharts />
                    </el-icon>
                    <div class="stat-value">0</div>
                    <div class="stat-label">总访问量</div>
                </div>
                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <UserFilled />
                    </el-icon>
                    <div class="stat-value">0</div>
                    <div class="stat-label">用户数</div>
                </div>
                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <Document />
                    </el-icon>
                    <div class="stat-value">0</div>
                    <div class="stat-label">订单数</div>
                </div>
                <div class="stat-card">
                    <el-icon :size="48" class="stat-icon">
                        <Money />
                    </el-icon>
                    <div class="stat-value">¥0</div>
                    <div class="stat-label">销售额</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HomeView'
}
</script>

<style scoped>
.home-container {
    min-height: 100%;
}

.welcome-card {
    background: white;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.welcome-text {
    font-size: 3rem;
    color: #1a1c2e;
    margin-bottom: 12px;
    font-weight: bold;
}

.subtitle {
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 40px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 24px;
}

.stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    color: white;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.stat-icon {
    font-size: 2.5rem;
    margin-bottom: 12px;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 8px;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.9;
}
</style>
