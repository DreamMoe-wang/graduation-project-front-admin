<template>
    <div class="trade-list">
        <div class="page-header">
            <h2>交易大全</h2>
            <p>浏览所有同城任务和服务</p>
        </div>

        <!-- 搜索栏 -->
        <el-card class="search-card">
            <el-form :inline="true" size="large">
                <el-form-item label="关键词">
                    <el-input v-model="searchForm.keyword" placeholder="搜索任务标题" clearable />
                </el-form-item>
                <el-form-item label="分类">
                    <el-select v-model="searchForm.category" placeholder="全部分类" clearable>
                        <el-option label="跑腿代办" value="errand" />
                        <el-option label="家政服务" value="housekeeping" />
                        <el-option label="维修服务" value="repair" />
                        <el-option label="搬运服务" value="moving" />
                        <el-option label="其他服务" value="other" />
                    </el-select>
                </el-form-item>
                <el-form-item label="类型">
                    <el-select v-model="searchForm.type" placeholder="全部类型" clearable>
                        <el-option label="我需要帮助" value="demand" />
                        <el-option label="我提供服务" value="service" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleSearch">搜索</el-button>
                    <el-button @click="handleReset">重置</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- 交易列表 -->
        <el-card class="list-card" v-for="item in tradeList" :key="item.id">
            <div class="trade-item">
                <div class="trade-header">
                    <el-tag :type="item.type === 'demand' ? 'danger' : 'success'" size="small">
                        {{ item.type === 'demand' ? '求帮助' : '提供服务' }}
                    </el-tag>
                    <el-tag effect="plain" size="small">{{ item.categoryName }}</el-tag>
                    <span class="trade-price">¥{{ item.price }}</span>
                </div>
                <h3 class="trade-title">{{ item.title }}</h3>
                <p class="trade-desc">{{ item.description }}</p>
                <div class="trade-footer">
                    <span class="trade-area">
                        <el-icon>
                            <Location />
                        </el-icon> {{ item.area }}
                    </span>
                    <span class="trade-time">
                        <el-icon>
                            <Clock />
                        </el-icon> {{ item.publishTime }}
                    </span>
                    <span class="trade-contact">
                        <el-icon>
                            <Phone />
                        </el-icon> {{ item.contact }}
                    </span>
                </div>
                <div class="trade-actions">
                    <el-button type="primary" size="small">立即接单</el-button>
                    <el-button size="small">联系 TA</el-button>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script>
export default {
    name: 'TradeList',
    data() {
        return {
            searchForm: {
                keyword: '',
                category: '',
                type: ''
            },
            tradeList: [
                {
                    id: 1,
                    type: 'demand',
                    categoryName: '跑腿代办',
                    title: '代取快递，送到宿舍楼下',
                    description: '需要帮忙取一下快递，有 3 个包裹，送到 XX 大学宿舍楼下，报酬 20 元',
                    price: 20,
                    area: '北京市海淀区',
                    publishTime: '10 分钟前',
                    contact: '138****1234'
                },
                {
                    id: 2,
                    type: 'service',
                    categoryName: '家政服务',
                    title: '专业保洁，上门打扫',
                    description: '提供专业家庭保洁服务，3 年经验，自带清洁工具，50 元/小时',
                    price: 50,
                    area: '北京市朝阳区',
                    publishTime: '30 分钟前',
                    contact: '139****5678'
                },
                {
                    id: 3,
                    type: 'demand',
                    categoryName: '维修服务',
                    title: '空调不制冷，需要维修',
                    description: '家里空调突然不制冷了，需要师傅上门维修，价格面议',
                    price: 0,
                    area: '北京市东城区',
                    publishTime: '1 小时前',
                    contact: '136****9012'
                }
            ]
        }
    },
    methods: {
        handleSearch() {
            console.log('搜索:', this.searchForm)
        },
        handleReset() {
            this.searchForm = {
                keyword: '',
                category: '',
                type: ''
            }
        }
    }
}
</script>

<style scoped>
.trade-list {
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

.search-card {
    margin-bottom: 20px;
}

.list-card {
    margin-bottom: 16px;
}

.trade-item {
    padding: 8px 0;
}

.trade-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
}

.trade-price {
    margin-left: auto;
    font-size: 20px;
    color: #f56c6c;
    font-weight: bold;
}

.trade-title {
    font-size: 18px;
    color: #333;
    margin-bottom: 8px;
}

.trade-desc {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 16px;
}

.trade-footer {
    display: flex;
    gap: 24px;
    color: #999;
    font-size: 13px;
    margin-bottom: 12px;
}

.trade-actions {
    display: flex;
    gap: 12px;
}
</style>
