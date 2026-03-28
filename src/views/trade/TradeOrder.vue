<template>
    <div class="trade-order">
        <div class="page-header">
            <h2>订单大全</h2>
            <p>管理您的所有交易订单</p>
        </div>

        <!-- 订单统计 -->
        <el-row :gutter="20" class="stats-row">
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-label">全部订单</div>
                        <div class="stat-value">12</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-label">待接单</div>
                        <div class="stat-value stat-pending">3</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-label">进行中</div>
                        <div class="stat-value stat-progress">5</div>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="6">
                <el-card shadow="hover" class="stat-card">
                    <div class="stat-item">
                        <div class="stat-label">已完成</div>
                        <div class="stat-value stat-success">4</div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 订单列表 -->
        <el-card class="order-card" v-for="item in orderList" :key="item.id">
            <div class="order-header">
                <span class="order-no">订单号：{{ item.orderNo }}</span>
                <el-tag :type="getStatusType(item.status)" size="small">
                    {{ item.statusText }}
                </el-tag>
            </div>
            <div class="order-content">
                <div class="order-left">
                    <h3 class="order-title">{{ item.title }}</h3>
                    <p class="order-info">
                        <span><el-icon>
                                <Location />
                            </el-icon> {{ item.area }}</span>
                        <span><el-icon>
                                <Clock />
                            </el-icon> {{ item.createTime }}</span>
                    </p>
                </div>
                <div class="order-right">
                    <div class="order-price">¥{{ item.price }}</div>
                </div>
            </div>
            <div class="order-actions">
                <el-button v-if="item.status === 'pending'" type="primary" size="small">
                    去接单
                </el-button>
                <el-button v-if="item.status === 'progress'" type="success" size="small">
                    完成任务
                </el-button>
                <el-button v-if="item.status === 'pending'" type="danger" size="small" plain>
                    取消订单
                </el-button>
                <el-button size="small" plain>查看详情</el-button>
                <el-button size="small" plain>联系对方</el-button>
            </div>
        </el-card>
    </div>
</template>

<script>
export default {
    name: 'TradeOrder',
    data() {
        return {
            orderList: [
                {
                    id: 1,
                    orderNo: 'TR202603280001',
                    title: '代取快递，送到宿舍楼下',
                    area: '北京市海淀区',
                    createTime: '2026-03-28 10:30',
                    price: 20,
                    status: 'pending',
                    statusText: '待接单'
                },
                {
                    id: 2,
                    orderNo: 'TR202603280002',
                    title: '专业保洁，上门打扫',
                    area: '北京市朝阳区',
                    createTime: '2026-03-28 09:15',
                    price: 150,
                    status: 'progress',
                    statusText: '进行中'
                },
                {
                    id: 3,
                    orderNo: 'TR202603270003',
                    title: '电脑维修，无法开机',
                    area: '北京市东城区',
                    createTime: '2026-03-27 16:20',
                    price: 100,
                    status: 'success',
                    statusText: '已完成'
                }
            ]
        }
    },
    methods: {
        getStatusType(status) {
            const typeMap = {
                pending: 'warning',
                progress: 'primary',
                success: 'success',
                cancel: 'info'
            }
            return typeMap[status] || ''
        }
    }
}
</script>

<style scoped>
.trade-order {
    padding: 20px;
}

.page-header {
    margin-bottom: 24px;
}

.page-header h2 {
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
}

.page-header p {
    color: #666;
    font-size: 14px;
}

.stats-row {
    margin-bottom: 20px;
}

.stat-card {
    text-align: center;
}

.stat-item {
    padding: 20px 0;
}

.stat-label {
    color: #999;
    font-size: 14px;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #333;
}

.stat-pending {
    color: #e6a23c;
}

.stat-progress {
    color: #409eff;
}

.stat-success {
    color: #67c23a;
}

.order-card {
    margin-bottom: 16px;
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.order-no {
    color: #999;
    font-size: 13px;
}

.order-content {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
}

.order-title {
    font-size: 16px;
    color: #333;
    margin-bottom: 8px;
}

.order-info {
    color: #666;
    font-size: 13px;
    display: flex;
    gap: 16px;
}

.order-price {
    font-size: 24px;
    color: #f56c6c;
    font-weight: bold;
}

.order-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid #eee;
}
</style>
