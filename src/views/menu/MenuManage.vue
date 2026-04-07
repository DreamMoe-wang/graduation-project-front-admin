<template>
    <div class="menu-manage">
        <el-card class="page-card">
            <div class="page-header">
                <div>
                    <h2 class="page-title">菜单管理</h2>
                    <p class="page-subtitle">统一维护目录、页面菜单和按钮权限。当前最小可用版只收口 4 个菜单权限码：menu:view、menu:create、menu:edit、menu:delete。</p>
                </div>
                <div class="page-actions">
                    <el-button @click="fetchMenuTree">刷新菜单树</el-button>
                    <el-button type="primary" v-permission="'menu:create'" @click="handleCreateRoot">新增资源</el-button>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-label">资源总数</div>
                    <div class="summary-value">{{ menuStats.total }}</div>
                    <div class="summary-meta">目录、菜单、按钮统一作为权限资源管理。</div>
                </div>
                <div class="summary-card accent">
                    <div class="summary-label">页面菜单</div>
                    <div class="summary-value">{{ menuStats.pages }}</div>
                    <div class="summary-meta">可控制页面访问，按钮权限会挂在页面或目录节点下。</div>
                </div>
                <div class="summary-card muted">
                    <div class="summary-label">按钮权限</div>
                    <div class="summary-value">{{ menuStats.buttons }}</div>
                    <div class="summary-meta">适合控制新增、编辑、删除等细粒度动作。</div>
                </div>
            </div>

            <div class="panel-tip">
                <span class="panel-tip-dot" />
                新增页面菜单时，需要保证前端已有对应路由和组件；当前版本主要用于维护已有页面的显示、排序和按钮级权限。
            </div>

            <el-table
                v-loading="loading"
                :data="menuTableData"
                row-key="id"
                border
                stripe
                default-expand-all
                class="menu-table"
                empty-text="暂无菜单资源"
            >
                <el-table-column label="菜单名称" min-width="280">
                    <template #default="{ row }">
                        <div class="menu-name-cell">
                            <div class="menu-name-main">
                                <span class="menu-name-text">{{ row.name || '未命名资源' }}</span>
                                <el-tag size="small" effect="plain" :type="resolveMenuTypeTagType(row.menuType)">
                                    {{ resolveMenuTypeLabel(row.menuType) }}
                                </el-tag>
                            </div>
                            <div class="menu-name-sub">ID: {{ row.id }}</div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="路径 / 权限标识" min-width="240">
                    <template #default="{ row }">
                        <div class="route-block">
                            <div>{{ row.path || '-' }}</div>
                            <div class="route-meta">{{ row.permissionCode || '无权限标识' }}</div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="routeName" label="路由名称" width="150" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ row.routeName || '-' }}
                    </template>
                </el-table-column>
                <el-table-column prop="component" label="组件路径" min-width="180" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ row.component || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="显示" width="90" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.visible === 1 ? 'success' : 'info'">{{ row.menuType === 3 ? '按钮隐藏' : row.visible === 1 ? '显示' : '隐藏' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="状态" width="90" align="center">
                    <template #default="{ row }">
                        <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="sortNo" label="排序" width="90" align="center" />
                <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip>
                    <template #default="{ row }">
                        {{ row.remark || '-' }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="220" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button v-if="row.menuType !== 3" link type="primary" v-permission="'menu:create'" @click="handleCreateChild(row)">
                            新增子级
                        </el-button>
                        <el-button link type="warning" v-permission="'menu:edit'" @click="handleEdit(row)">编辑</el-button>
                        <el-button link type="danger" v-permission="'menu:delete'" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-card>

        <el-dialog
            v-model="editorVisible"
            :title="editorMode === 'create' ? '新增资源' : '编辑资源'"
            width="720px"
            destroy-on-close
            @closed="resetEditor"
        >
            <el-form ref="editorFormRef" :model="editorForm" :rules="editorRules" label-width="100px">
                <el-form-item label="父级节点">
                    <el-input :model-value="editorForm.parentName || '顶级节点'" disabled />
                </el-form-item>
                <el-form-item label="资源类型" prop="menuType">
                    <el-select v-model="editorForm.menuType" class="full-width" @change="handleMenuTypeChange">
                        <el-option
                            v-for="item in currentMenuTypeOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value"
                            :disabled="item.disabled"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="资源名称" prop="menuName">
                    <el-input v-model="editorForm.menuName" maxlength="100" placeholder="请输入资源名称" />
                </el-form-item>
                <el-form-item v-if="editorForm.menuType !== 3" label="路由路径">
                    <el-input v-model="editorForm.path" maxlength="255" placeholder="例如 /menu 或 /trade/list" />
                </el-form-item>
                <el-form-item v-if="editorForm.menuType === 2" label="路由名称">
                    <el-input v-model="editorForm.routeName" maxlength="100" placeholder="例如 MenuManage" />
                </el-form-item>
                <el-form-item v-if="editorForm.menuType === 2" label="组件路径">
                    <el-input v-model="editorForm.component" maxlength="255" placeholder="例如 menu/MenuManage" />
                </el-form-item>
                <el-form-item v-if="editorForm.menuType !== 3" label="图标">
                    <el-input v-model="editorForm.icon" maxlength="100" placeholder="例如 Menu、User、Setting" />
                </el-form-item>
                <el-form-item label="权限标识">
                    <el-input
                        v-model="editorForm.permissionCode"
                        maxlength="100"
                        :placeholder="editorForm.menuType === 3 ? '例如 menu:create' : '可选，例如 menu:view'"
                    />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="排序号">
                            <el-input-number v-model="editorForm.sortNo" :min="0" :max="9999" class="full-width" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="状态">
                            <el-radio-group v-model="editorForm.status">
                                <el-radio :value="1">启用</el-radio>
                                <el-radio :value="0">停用</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item v-if="editorForm.menuType !== 3" label="是否显示">
                    <el-radio-group v-model="editorForm.visible">
                        <el-radio :value="1">显示</el-radio>
                        <el-radio :value="0">隐藏</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注">
                    <el-input v-model="editorForm.remark" type="textarea" :rows="3" maxlength="255" show-word-limit placeholder="可选，补充说明资源用途" />
                </el-form-item>
                <div class="editor-note">
                    页面菜单只负责菜单与权限资源维护，不会自动生成新路由。新增页面前，请先确认 [router/index.js] 中已存在对应页面实现。
                </div>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="editorVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="handleSubmit">
                        {{ editorMode === 'create' ? '创建资源' : '保存修改' }}
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'
import { createMenu, deleteMenu, getMenuDetail, getMenuTree, updateMenu } from '@/api/menu'

function createDefaultEditorForm() {
    return {
        id: null,
        parentId: 0,
        parentName: '顶级节点',
        parentMenuType: 0,
        menuName: '',
        menuType: 2,
        path: '',
        routeName: '',
        component: '',
        icon: '',
        permissionCode: '',
        sortNo: 0,
        visible: 1,
        status: 1,
        remark: ''
    }
}

function trimText(value) {
    return typeof value === 'string' ? value.trim() : ''
}

export default {
    name: 'MenuManage',
    data() {
        return {
            loading: false,
            saving: false,
            menuTableData: [],
            parentNodeMap: {},
            editorVisible: false,
            editorMode: 'create',
            editorForm: createDefaultEditorForm(),
            editorRules: {
                menuName: [
                    { required: true, message: '请输入资源名称', trigger: 'blur' }
                ],
                menuType: [
                    { required: true, message: '请选择资源类型', trigger: 'change' }
                ]
            }
        }
    },
    computed: {
        authStore() {
            return useAuthStore()
        },
        menuStats() {
            const stats = {
                total: 0,
                directories: 0,
                pages: 0,
                buttons: 0
            }

            this.walkMenuTree(this.menuTableData, item => {
                stats.total += 1
                if (item.menuType === 1) stats.directories += 1
                if (item.menuType === 2) stats.pages += 1
                if (item.menuType === 3) stats.buttons += 1
            })

            return stats
        },
        currentMenuTypeOptions() {
            const isRoot = !this.editorForm.parentId
            return [
                { value: 1, label: '目录', disabled: false },
                { value: 2, label: '菜单', disabled: false },
                { value: 3, label: '按钮', disabled: isRoot }
            ]
        }
    },
    mounted() {
        this.fetchMenuTree()
    },
    methods: {
        resolveMenuTypeLabel(menuType) {
            if (menuType === 1) return '目录'
            if (menuType === 2) return '菜单'
            if (menuType === 3) return '按钮'
            return '未知'
        },
        resolveMenuTypeTagType(menuType) {
            if (menuType === 1) return 'info'
            if (menuType === 2) return 'success'
            if (menuType === 3) return 'warning'
            return 'info'
        },
        normalizeMenuTree(items = []) {
            return (Array.isArray(items) ? items : []).map(item => ({
                id: item.id ?? null,
                parentId: item.parentId ?? 0,
                name: item.name || '',
                menuType: Number(item.menuType ?? 2),
                path: item.path || '',
                routeName: item.routeName || '',
                component: item.component || '',
                icon: item.icon || '',
                permissionCode: item.permissionCode || '',
                sortNo: Number(item.sortNo ?? 0),
                visible: Number(item.visible ?? 1),
                status: Number(item.status ?? 1),
                remark: item.remark || '',
                children: this.normalizeMenuTree(item.children || [])
            }))
        },
        walkMenuTree(items = [], callback) {
            ;(Array.isArray(items) ? items : []).forEach(item => {
                callback(item)
                if (Array.isArray(item.children) && item.children.length) {
                    this.walkMenuTree(item.children, callback)
                }
            })
        },
        rebuildParentNodeMap() {
            const nextMap = {}

            this.walkMenuTree(this.menuTableData, item => {
                nextMap[item.id] = {
                    id: item.id,
                    name: item.name,
                    menuType: item.menuType,
                    parentId: item.parentId
                }
            })

            this.parentNodeMap = nextMap
        },
        async fetchMenuTree() {
            this.loading = true

            try {
                const tree = await getMenuTree()
                this.menuTableData = this.normalizeMenuTree(tree)
                this.rebuildParentNodeMap()
            } catch (error) {
                this.menuTableData = []
                this.parentNodeMap = {}
                console.error('获取菜单树失败:', error)
            } finally {
                this.loading = false
            }
        },
        handleCreateRoot() {
            this.editorMode = 'create'
            this.editorForm = createDefaultEditorForm()
            this.editorVisible = true
        },
        handleCreateChild(row) {
            this.editorMode = 'create'
            this.editorForm = {
                ...createDefaultEditorForm(),
                parentId: row.id,
                parentName: row.name || '未命名节点',
                parentMenuType: Number(row.menuType ?? 0),
                menuType: Number(row.menuType) === 2 ? 3 : 2,
                visible: Number(row.menuType) === 2 ? 0 : 1
            }
            this.editorVisible = true
        },
        async handleEdit(row) {
            this.editorMode = 'edit'

            try {
                const detail = await getMenuDetail(row.id)
                const parentNode = this.parentNodeMap[detail?.parentId] || null
                this.editorForm = {
                    id: detail?.id ?? row.id ?? null,
                    parentId: detail?.parentId ?? row.parentId ?? 0,
                    parentName: parentNode?.name || (detail?.parentId ? `节点 ${detail.parentId}` : '顶级节点'),
                    parentMenuType: parentNode?.menuType ?? 0,
                    menuName: detail?.name || row.name || '',
                    menuType: Number(detail?.menuType ?? row.menuType ?? 2),
                    path: detail?.path || '',
                    routeName: detail?.routeName || '',
                    component: detail?.component || '',
                    icon: detail?.icon || '',
                    permissionCode: detail?.permissionCode || '',
                    sortNo: Number(detail?.sortNo ?? row.sortNo ?? 0),
                    visible: Number(detail?.visible ?? row.visible ?? 1),
                    status: Number(detail?.status ?? row.status ?? 1),
                    remark: detail?.remark || ''
                }
                this.editorVisible = true
            } catch (error) {
                console.error('加载菜单详情失败:', error)
            }
        },
        handleMenuTypeChange(menuType) {
            if (Number(menuType) === 3) {
                this.editorForm.path = ''
                this.editorForm.routeName = ''
                this.editorForm.component = ''
                this.editorForm.icon = ''
                this.editorForm.visible = 0
                return
            }

            if (Number(menuType) === 1) {
                this.editorForm.routeName = ''
                this.editorForm.component = ''
            }

            if (this.editorForm.visible == null) {
                this.editorForm.visible = 1
            }
        },
        validateDynamicFields() {
            if (this.editorForm.menuType !== 3 && !trimText(this.editorForm.path)) {
                this.$message.warning('目录和菜单必须填写路由路径')
                return false
            }
            if (this.editorForm.menuType === 2 && !trimText(this.editorForm.routeName)) {
                this.$message.warning('页面菜单必须填写路由名称')
                return false
            }
            if (this.editorForm.menuType === 2 && !trimText(this.editorForm.component)) {
                this.$message.warning('页面菜单必须填写组件路径')
                return false
            }
            if (this.editorForm.menuType === 3 && !trimText(this.editorForm.permissionCode)) {
                this.$message.warning('按钮权限必须填写权限标识')
                return false
            }
            return true
        },
        async handleSubmit() {
            const formRef = this.$refs.editorFormRef
            if (!formRef) return

            try {
                await formRef.validate()
            } catch (error) {
                return
            }

            if (!this.validateDynamicFields()) {
                return
            }

            this.saving = true

            try {
                const payload = {
                    parentId: Number(this.editorForm.parentId ?? 0),
                    menuName: trimText(this.editorForm.menuName),
                    menuType: Number(this.editorForm.menuType),
                    path: trimText(this.editorForm.path),
                    routeName: trimText(this.editorForm.routeName),
                    component: trimText(this.editorForm.component),
                    icon: trimText(this.editorForm.icon),
                    permissionCode: trimText(this.editorForm.permissionCode),
                    sortNo: Number(this.editorForm.sortNo ?? 0),
                    visible: this.editorForm.menuType === 3 ? 0 : Number(this.editorForm.visible ?? 1),
                    status: Number(this.editorForm.status ?? 1),
                    remark: trimText(this.editorForm.remark)
                }

                if (this.editorMode === 'create') {
                    await createMenu(payload)
                    this.$message.success('菜单资源创建成功')
                } else {
                    await updateMenu(this.editorForm.id, payload)
                    this.$message.success('菜单资源修改成功')
                }

                this.editorVisible = false
                await this.fetchMenuTree()
                await this.refreshCurrentSessionMenus()
            } catch (error) {
                console.error('保存菜单资源失败:', error)
            } finally {
                this.saving = false
            }
        },
        async handleDelete(row) {
            try {
                await this.$confirm(`确定要删除“${row.name || row.id}”吗？删除前请确认该节点没有子级。`, '删除确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await deleteMenu(row.id)
                this.$message.success('菜单资源已删除')
                await this.fetchMenuTree()
                await this.refreshCurrentSessionMenus()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除菜单资源失败:', error)
                }
            }
        },
        async refreshCurrentSessionMenus() {
            try {
                await this.authStore.restoreSession()
            } catch (error) {
                console.error('刷新当前登录态菜单失败:', error)
            }
        },
        resetEditor() {
            this.editorForm = createDefaultEditorForm()
            this.saving = false
            this.$refs.editorFormRef?.resetFields()
        }
    }
}
</script>

<style scoped>
.menu-manage {
    min-height: 100%;
}

.page-card {
    border-radius: 18px;
    border: none;
    background: var(--app-surface);
    box-shadow: var(--app-card-shadow);
}

.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 20px;
}

.page-title {
    margin: 0;
    color: var(--app-text);
    font-size: 1.7rem;
    font-weight: 800;
    letter-spacing: -0.03em;
}

.page-subtitle {
    margin: 8px 0 0;
    color: var(--app-text-secondary);
    font-size: 0.95rem;
    line-height: 1.7;
}

.page-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 18px;
}

.summary-card {
    padding: 18px 20px;
    border-radius: 18px;
    background: linear-gradient(145deg, rgba(var(--app-theme-color-rgb), 0.1) 0%, rgba(255, 255, 255, 0.98) 72%);
    border: 1px solid rgba(var(--app-theme-color-rgb), 0.12);
}

.summary-card.accent {
    background: linear-gradient(145deg, rgba(76, 172, 254, 0.14) 0%, rgba(255, 255, 255, 0.98) 78%);
}

.summary-card.muted {
    background: linear-gradient(145deg, rgba(98, 114, 164, 0.08) 0%, rgba(255, 255, 255, 0.98) 78%);
}

.summary-label {
    color: var(--app-text-secondary);
    font-size: 0.9rem;
}

.summary-value {
    margin-top: 10px;
    color: var(--app-text);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.04em;
}

.summary-meta {
    margin-top: 10px;
    color: var(--app-text-secondary);
    font-size: 0.88rem;
    line-height: 1.65;
}

.panel-tip {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(var(--app-theme-color-rgb), 0.06);
    color: var(--app-text-secondary);
    font-size: 0.9rem;
}

.panel-tip-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--app-theme-color);
    flex-shrink: 0;
}

.menu-table {
    border-radius: 14px;
    overflow: hidden;
}

.menu-name-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.menu-name-main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.menu-name-text {
    color: var(--app-text);
    font-weight: 700;
}

.menu-name-sub,
.route-meta {
    color: var(--app-text-secondary);
    font-size: 0.82rem;
}

.route-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.editor-note {
    margin-top: 8px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(245, 158, 11, 0.08);
    color: #9a6b16;
    font-size: 0.88rem;
    line-height: 1.65;
}

.full-width {
    width: 100%;
}

@media (max-width: 1200px) {
    .summary-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .page-header {
        flex-direction: column;
    }

    .page-actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
