<template>
    <div class="user-manage">
        <el-card class="page-card">
            <div class="page-header">
                <div>
                    <h2 class="page-title">用户管理</h2>
                    <p class="page-subtitle">将用户维护与角色配置整合到一个页面，集中处理新增、编辑、删除等常用操作。</p>
                </div>
                <div class="page-actions">
                    <el-button @click="refreshCurrentTab">刷新当前列表</el-button>
                    <el-button v-if="activeTab === 'users'" type="primary" v-permission="'user:manage'" @click="handleCreateUser">新增用户</el-button>
                    <el-button v-else-if="canManageRoles" type="primary" v-permission="'role:manage'" @click="handleCreateRole">新增角色</el-button>
                </div>
            </div>

            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-label">用户总数</div>
                    <div class="summary-value">{{ userPagination.total }}</div>
                    <div class="summary-meta">展示平台账号列表与基本信息</div>
                </div>
                <div class="summary-card accent">
                    <div class="summary-label">角色总数</div>
                    <div class="summary-value">{{ rolePagination.total }}</div>
                    <div class="summary-meta">统一维护角色名称、编码与状态</div>
                </div>
                <div class="summary-card muted">
                    <div class="summary-label">管理说明</div>
                    <div class="summary-inline">新增用户后会按后端默认规则绑定基础角色。</div>
                </div>
            </div>

            <el-tabs v-model="activeTab" class="manage-tabs">
                <el-tab-pane v-if="canManageUsers || !canManageRoles" label="用户列表" name="users">
                    <div class="tab-panel">
                        <div class="panel-tip">
                            <span class="panel-tip-dot" />
                            用户新增、编辑、删除都在这里完成，表格会同步展示基础联系方式与当前角色。
                        </div>

                        <el-table v-loading="userLoading" :data="userTableData" border stripe class="manage-table" empty-text="暂无用户数据">
                            <el-table-column label="用户信息" min-width="220">
                                <template #default="{ row }">
                                    <div class="user-cell">
                                        <el-avatar :size="38" :src="row.avatar">
                                            {{ (row.nickname || row.username || '用').slice(0, 1) }}
                                        </el-avatar>
                                        <div class="user-cell-main">
                                            <div class="user-cell-name">{{ row.nickname || row.username || '未命名用户' }}</div>
                                            <div class="user-cell-sub">{{ row.username || '-' }}</div>
                                        </div>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="phone" label="手机号" width="150" />
                            <el-table-column prop="email" label="邮箱" min-width="220" show-overflow-tooltip />
                            <el-table-column label="角色" min-width="180">
                                <template #default="{ row }">
                                    <div class="role-badges" v-if="row.roleNames.length">
                                        <el-tag v-for="roleName in row.roleNames" :key="`${row.id}-${roleName}`" size="small" effect="plain" type="primary">
                                            {{ roleName }}
                                        </el-tag>
                                    </div>
                                    <span v-else class="table-placeholder">未获取到角色信息</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="状态" width="110" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="lastLoginTime" label="最近登录" width="180">
                                <template #default="{ row }">
                                    {{ formatDateTime(row.lastLoginTime) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="170" fixed="right" align="center">
                                <template #default="{ row }">
                                    <el-button link type="primary" v-permission="'user:manage'" @click="handleEditUser(row)">编辑</el-button>
                                    <el-button link type="danger" v-permission="'user:manage'" @click="handleDeleteUser(row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="pagination-wrap">
                            <el-pagination
                                v-model:current-page="userPagination.currentPage"
                                v-model:page-size="userPagination.pageSize"
                                :page-sizes="[5, 10, 20, 50]"
                                layout="total, sizes, prev, pager, next, jumper"
                                :total="userPagination.total"
                                @size-change="handleUserSizeChange"
                                @current-change="handleUserCurrentChange"
                            />
                        </div>
                    </div>
                </el-tab-pane>

                <el-tab-pane v-if="canManageRoles || !canManageUsers" label="角色配置" name="roles">
                    <div class="tab-panel">
                        <div class="panel-tip">
                            <span class="panel-tip-dot" />
                            角色在这里统一维护，删除时如果角色已绑定用户，后端会阻止删除并提示原因。
                        </div>

                        <el-table v-loading="roleLoading" :data="roleTableData" border stripe class="manage-table" empty-text="暂无角色数据">
                            <el-table-column prop="roleName" label="角色名称" min-width="180" show-overflow-tooltip />
                            <el-table-column prop="roleCode" label="角色编码" width="180" show-overflow-tooltip />
                            <el-table-column label="状态" width="110" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="remark" label="备注" min-width="260" show-overflow-tooltip>
                                <template #default="{ row }">
                                    {{ row.remark || '暂无备注' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="updateTime" label="更新时间" width="180">
                                <template #default="{ row }">
                                    {{ formatDateTime(row.updateTime) }}
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="170" fixed="right" align="center">
                                <template #default="{ row }">
                                    <el-button link type="primary" v-permission="'role:manage'" @click="handleEditRole(row)">编辑</el-button>
                                    <el-button link type="danger" v-permission="'role:manage'" @click="handleDeleteRole(row)">删除</el-button>
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="pagination-wrap">
                            <el-pagination
                                v-model:current-page="rolePagination.currentPage"
                                v-model:page-size="rolePagination.pageSize"
                                :page-sizes="[5, 10, 20, 50]"
                                layout="total, sizes, prev, pager, next, jumper"
                                :total="rolePagination.total"
                                @size-change="handleRoleSizeChange"
                                @current-change="handleRoleCurrentChange"
                            />
                        </div>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </el-card>

        <el-dialog v-model="userEditorVisible" :title="userEditorMode === 'create' ? '新增用户' : '编辑用户'" width="680px" destroy-on-close @closed="resetUserEditor">
            <el-form ref="userEditorFormRef" :model="userEditorForm" :rules="userEditorRules" label-width="92px">
                <el-row :gutter="18">
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model="userEditorForm.username" maxlength="20" placeholder="请输入用户名" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="昵称" prop="nickname">
                            <el-input v-model="userEditorForm.nickname" maxlength="50" placeholder="请输入昵称" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="角色信息" prop="roleIds">
                    <el-select
                        v-model="userEditorForm.roleIds"
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        placeholder="请选择角色"
                        style="width: 100%"
                    >
                        <el-option
                            v-for="role in roleOptions"
                            :key="role.id"
                            :label="role.roleName"
                            :value="role.id"
                        />
                    </el-select>
                </el-form-item>

                <el-row :gutter="18">
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="密码" prop="password">
                            <el-input v-model="userEditorForm.password" type="password" show-password maxlength="100" placeholder="请输入登录密码" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="状态" prop="status">
                            <el-radio-group v-model="userEditorForm.status">
                                <el-radio :value="1">正常</el-radio>
                                <el-radio :value="0">禁用</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="18">
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="手机号" prop="phone">
                            <el-input v-model="userEditorForm.phone" maxlength="20" placeholder="请输入手机号" />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model="userEditorForm.email" maxlength="100" placeholder="请输入邮箱" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item label="头像地址" prop="avatar">
                    <el-input v-model="userEditorForm.avatar" maxlength="255" placeholder="可选，填写头像图片地址" />
                </el-form-item>

                <div class="editor-note">当前后端更新用户时也要求传入密码，因此编辑用户时需要重新填写一次密码。</div>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="userEditorVisible = false">取消</el-button>
                    <el-button type="primary" :loading="userSaving" @click="handleSubmitUser">{{ userEditorMode === 'create' ? '创建用户' : '保存修改' }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="roleEditorVisible" :title="roleEditorMode === 'create' ? '新增角色' : '编辑角色'" width="860px" destroy-on-close @closed="resetRoleEditor">
            <el-form ref="roleEditorFormRef" :model="roleEditorForm" :rules="roleEditorRules" label-width="92px">
                <el-form-item label="角色名称" prop="roleName">
                    <el-input v-model="roleEditorForm.roleName" maxlength="50" placeholder="请输入角色名称" />
                </el-form-item>
                <el-form-item label="角色编码" prop="roleCode">
                    <el-input v-model="roleEditorForm.roleCode" maxlength="50" placeholder="请输入角色编码，如 ADMIN" />
                </el-form-item>
                <el-form-item label="状态" prop="status">
                    <el-radio-group v-model="roleEditorForm.status">
                        <el-radio :value="1">启用</el-radio>
                        <el-radio :value="0">停用</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="备注" prop="remark">
                    <el-input v-model="roleEditorForm.remark" type="textarea" :rows="4" maxlength="255" show-word-limit placeholder="请输入角色说明" />
                </el-form-item>
                <el-form-item label="菜单权限">
                    <div class="permission-block">
                        <div class="permission-toolbar">
                            <span>勾选页面可控制访问，勾选按钮可控制新增、编辑、删除。按钮权限会自动补齐父级菜单。</span>
                            <el-button link type="primary" @click="loadMenuTree(true)">刷新权限树</el-button>
                        </div>
                        <el-tree
                            ref="rolePermissionTreeRef"
                            v-loading="rolePermissionTreeLoading"
                            :data="menuTreeData"
                            node-key="id"
                            show-checkbox
                            default-expand-all
                            :props="{ label: 'name', children: 'children' }"
                            class="permission-tree"
                            empty-text="暂无菜单资源"
                        >
                            <template #default="{ data }">
                                <div class="permission-node">
                                    <span class="permission-node-name">{{ data.name }}</span>
                                    <div class="permission-meta">
                                        <el-tag size="small" effect="plain" :type="resolveMenuTypeTagType(data.menuType)">
                                            {{ resolveMenuTypeLabel(data.menuType) }}
                                        </el-tag>
                                        <span v-if="data.permissionCode" class="permission-code">{{ data.permissionCode }}</span>
                                    </div>
                                </div>
                            </template>
                        </el-tree>
                    </div>
                </el-form-item>
            </el-form>

            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="roleEditorVisible = false">取消</el-button>
                    <el-button type="primary" :loading="roleSaving" @click="handleSubmitRole">{{ roleEditorMode === 'create' ? '创建角色' : '保存修改' }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
import { nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getMenuTree } from '@/api/menu'
import { createUser, deleteUser, getUserDetail, getUserPage, updateUser } from '@/api/user'
import { createRole, deleteRole, getRoleDetail, getRolePage, updateRole } from '@/api/role'

function createPagination(pageSize = 10) {
    return {
        currentPage: 1,
        pageSize,
        total: 0
    }
}

function createDefaultUserForm() {
    return {
        id: null,
        username: '',
        password: '',
        nickname: '',
        roleIds: [],
        phone: '',
        email: '',
        avatar: '',
        status: 1
    }
}

function createDefaultRoleForm() {
    return {
        id: null,
        roleName: '',
        roleCode: '',
        status: 1,
        remark: '',
        menuIds: []
    }
}

function formatDateTime(value) {
    if (!value) return '-'
    const source = String(value)
    return source.length > 19 ? source.slice(0, 19) : source
}

export default {
    name: 'UserManage',
    data() {
        return {
            activeTab: 'users',
            userLoading: false,
            roleLoading: false,
            userSaving: false,
            roleSaving: false,
            rolePermissionTreeLoading: false,
            userTableData: [],
            roleTableData: [],
            roleOptions: [],
            menuTreeData: [],
            userPagination: createPagination(),
            rolePagination: createPagination(),
            userEditorVisible: false,
            roleEditorVisible: false,
            userEditorMode: 'create',
            roleEditorMode: 'create',
            userEditorForm: createDefaultUserForm(),
            roleEditorForm: createDefaultRoleForm(),
            userEditorRules: {
                username: [
                    { required: true, message: '请输入用户名', trigger: 'blur' },
                    { min: 3, max: 20, message: '用户名长度应为 3-20 个字符', trigger: 'blur' }
                ],
                password: [
                    { required: true, message: '请输入密码', trigger: 'blur' },
                    { min: 6, max: 100, message: '密码长度应为 6-100 个字符', trigger: 'blur' }
                ],
                nickname: [
                    { max: 50, message: '昵称不能超过 50 个字符', trigger: 'blur' }
                ],
                email: [
                    { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] }
                ],
                roleIds: [
                    { type: 'array', required: true, message: '请至少选择一个角色', trigger: 'change' }
                ],
                status: [
                    { required: true, message: '请选择用户状态', trigger: 'change' }
                ]
            },
            roleEditorRules: {
                roleName: [
                    { required: true, message: '请输入角色名称', trigger: 'blur' },
                    { max: 50, message: '角色名称不能超过 50 个字符', trigger: 'blur' }
                ],
                roleCode: [
                    { required: true, message: '请输入角色编码', trigger: 'blur' },
                    { max: 50, message: '角色编码不能超过 50 个字符', trigger: 'blur' }
                ],
                status: [
                    { required: true, message: '请选择角色状态', trigger: 'change' }
                ],
                remark: [
                    { max: 255, message: '备注不能超过 255 个字符', trigger: 'blur' }
                ]
            }
        }
    },
    computed: {
        authStore() {
            return useAuthStore()
        },
        canManageUsers() {
            return this.authStore.hasPermission('user:manage')
        },
        canManageRoles() {
            return this.authStore.hasPermission('role:manage')
        }
    },
    mounted() {
        if (!this.canManageUsers && this.canManageRoles) {
            this.activeTab = 'roles'
        }

        if (this.canManageUsers || !this.canManageRoles) {
            this.fetchUserData()
        }
        if (this.canManageRoles || !this.canManageUsers) {
            this.fetchRoleData()
        }
        this.fetchRoleOptions()
    },
    methods: {
        formatDateTime,
        normalizeUserRow(item = {}, detail = null) {
            const roleNames = Array.isArray(detail?.roleNames)
                ? detail.roleNames
                : Array.isArray(detail?.roles)
                    ? detail.roles
                    : []

            return {
                id: item.id ?? detail?.id ?? detail?.userId ?? null,
                username: item.username || detail?.username || '',
                nickname: item.nickname || detail?.nickname || '',
                roleIds: Array.isArray(detail?.roleIds) ? detail.roleIds : [],
                phone: item.phone || detail?.phone || '',
                email: item.email || detail?.email || '',
                avatar: item.avatar || detail?.avatar || '',
                status: Number(item.status ?? 1),
                lastLoginTime: item.lastLoginTime || '',
                createTime: item.createTime || '',
                updateTime: item.updateTime || '',
                roleNames
            }
        },
        normalizeRoleRow(item = {}) {
            return {
                id: item.id || null,
                roleName: item.roleName || '',
                roleCode: item.roleCode || '',
                status: Number(item.status ?? 1),
                remark: item.remark || '',
                menuIds: Array.isArray(item.menuIds) ? item.menuIds : [],
                createTime: item.createTime || '',
                updateTime: item.updateTime || item.createTime || ''
            }
        },
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
                permissionCode: item.permissionCode || '',
                children: this.normalizeMenuTree(item.children || [])
            }))
        },
        async loadMenuTree(preserveChecked = false) {
            const checkedKeys = preserveChecked ? this.collectRoleMenuIds() : []
            this.rolePermissionTreeLoading = true

            try {
                const tree = await getMenuTree({ silent: true })
                this.menuTreeData = this.normalizeMenuTree(tree)
                await nextTick()
                if (checkedKeys.length) {
                    this.syncRolePermissionTree(checkedKeys)
                }
            } catch (error) {
                this.menuTreeData = []
                console.error('获取菜单权限树失败:', error)
            } finally {
                this.rolePermissionTreeLoading = false
            }
        },
        syncRolePermissionTree(menuIds = []) {
            const treeRef = this.$refs.rolePermissionTreeRef
            if (!treeRef) return
            treeRef.setCheckedKeys(Array.isArray(menuIds) ? menuIds : [])
        },
        collectRoleMenuIds() {
            const treeRef = this.$refs.rolePermissionTreeRef
            if (!treeRef) return []

            const checkedKeys = Array.isArray(treeRef.getCheckedKeys()) ? treeRef.getCheckedKeys() : []
            const halfCheckedKeys = Array.isArray(treeRef.getHalfCheckedKeys()) ? treeRef.getHalfCheckedKeys() : []
            return Array.from(new Set([...checkedKeys, ...halfCheckedKeys]))
        },
        async fetchRoleOptions() {
            try {
                const pageData = await getRolePage({
                    pageNum: 1,
                    pageSize: 200
                }, { silent: true })

                const records = Array.isArray(pageData?.records) ? pageData.records : []
                this.roleOptions = records.map(this.normalizeRoleRow)
            } catch (error) {
                this.roleOptions = []
                console.error('获取角色选项失败:', error)
            }
        },
        async fetchUserData(options = {}) {
            const { silent = false } = options

            if (!silent) {
                this.userLoading = true
            }

            try {
                const pageData = await getUserPage({
                    pageNum: this.userPagination.currentPage,
                    pageSize: this.userPagination.pageSize
                }, { silent })

                const records = Array.isArray(pageData?.records) ? pageData.records : []
                const detailResults = await Promise.allSettled(
                    records.map(item => (
                        item?.id
                            ? getUserDetail(item.id, { silent: true })
                            : Promise.resolve(null)
                    ))
                )

                this.userTableData = records.map((item, index) => this.normalizeUserRow(
                    item,
                    detailResults[index]?.status === 'fulfilled' ? detailResults[index].value : null
                ))
                this.userPagination.total = Number(pageData?.total || 0)
            } catch (error) {
                this.userTableData = []
                this.userPagination.total = 0
                console.error('获取用户列表失败:', error)
            } finally {
                this.userLoading = false
            }
        },
        async fetchRoleData(options = {}) {
            const { silent = false } = options

            if (!silent) {
                this.roleLoading = true
            }

            try {
                const pageData = await getRolePage({
                    pageNum: this.rolePagination.currentPage,
                    pageSize: this.rolePagination.pageSize
                }, { silent })

                const records = Array.isArray(pageData?.records) ? pageData.records : []
                this.roleTableData = records.map(this.normalizeRoleRow)
                this.rolePagination.total = Number(pageData?.total || 0)
            } catch (error) {
                this.roleTableData = []
                this.rolePagination.total = 0
                console.error('获取角色列表失败:', error)
            } finally {
                this.roleLoading = false
            }
        },
        refreshCurrentTab() {
            if (this.activeTab === 'roles') {
                this.fetchRoleData()
                return
            }

            this.fetchUserData()
        },
        handleCreateUser() {
            this.userEditorMode = 'create'
            this.userEditorForm = createDefaultUserForm()
            const defaultRole = this.roleOptions.find(item => item.roleCode === 'USER') || this.roleOptions[0]
            if (defaultRole?.id) {
                this.userEditorForm.roleIds = [defaultRole.id]
            }
            this.userEditorVisible = true
        },
        async handleEditUser(row) {
            this.userEditorMode = 'edit'
            this.userEditorVisible = true

            try {
                const detail = await getUserDetail(row.id, { silent: true })
                this.userEditorForm = {
                    id: row.id,
                    username: detail?.username || row.username || '',
                    password: '',
                    nickname: detail?.nickname || row.nickname || '',
                    roleIds: Array.isArray(detail?.roleIds) ? detail.roleIds : [],
                    phone: detail?.phone || row.phone || '',
                    email: detail?.email || row.email || '',
                    avatar: detail?.avatar || row.avatar || '',
                    status: Number(row.status ?? 1)
                }
            } catch (error) {
                this.userEditorVisible = false
                console.error('加载用户详情失败:', error)
            }
        },
        async handleDeleteUser(row) {
            try {
                await this.$confirm(`确定要删除用户“${row.username || row.nickname || row.id}”吗？`, '删除确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await deleteUser(row.id)

                if (this.userTableData.length === 1 && this.userPagination.currentPage > 1) {
                    this.userPagination.currentPage -= 1
                }

                this.$message.success('用户已删除')
                await this.fetchUserData()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除用户失败:', error)
                }
            }
        },
        async handleSubmitUser() {
            const formRef = this.$refs.userEditorFormRef
            if (!formRef) return

            try {
                await formRef.validate()
            } catch (error) {
                return
            }

            this.userSaving = true

            try {
                const payload = {
                    username: this.userEditorForm.username.trim(),
                    password: this.userEditorForm.password,
                    nickname: this.userEditorForm.nickname.trim(),
                    roleIds: Array.isArray(this.userEditorForm.roleIds) ? this.userEditorForm.roleIds : [],
                    phone: this.userEditorForm.phone.trim(),
                    email: this.userEditorForm.email.trim(),
                    avatar: this.userEditorForm.avatar.trim(),
                    status: Number(this.userEditorForm.status)
                }

                if (this.userEditorMode === 'create') {
                    await createUser(payload)
                    this.$message.success('用户创建成功')
                } else {
                    await updateUser(this.userEditorForm.id, payload)
                    this.$message.success('用户修改成功')
                }

                this.userEditorVisible = false
                await this.fetchUserData()
            } catch (error) {
                console.error('保存用户失败:', error)
            } finally {
                this.userSaving = false
            }
        },
        resetUserEditor() {
            this.userEditorForm = createDefaultUserForm()
            this.userSaving = false
            this.$refs.userEditorFormRef?.resetFields()
        },
        handleUserSizeChange(pageSize) {
            this.userPagination.pageSize = pageSize
            this.userPagination.currentPage = 1
            this.fetchUserData()
        },
        handleUserCurrentChange(currentPage) {
            this.userPagination.currentPage = currentPage
            this.fetchUserData()
        },
        async handleCreateRole() {
            this.roleEditorMode = 'create'
            this.roleEditorForm = createDefaultRoleForm()
            this.roleEditorVisible = true
            await this.loadMenuTree()
            await nextTick()
            this.syncRolePermissionTree([])
        },
        async handleEditRole(row) {
            this.roleEditorMode = 'edit'

            try {
                await this.loadMenuTree()
                const detail = await getRoleDetail(row.id, { silent: true })
                const normalized = this.normalizeRoleRow(detail)
                this.roleEditorForm = {
                    id: normalized.id,
                    roleName: normalized.roleName,
                    roleCode: normalized.roleCode,
                    status: normalized.status,
                    remark: normalized.remark,
                    menuIds: normalized.menuIds
                }
                this.roleEditorVisible = true
                await nextTick()
                this.syncRolePermissionTree(normalized.menuIds)
            } catch (error) {
                this.roleEditorVisible = false
                console.error('加载角色详情失败:', error)
            }
        },
        async handleDeleteRole(row) {
            try {
                await this.$confirm(`确定要删除角色“${row.roleName}”吗？`, '删除确认', {
                    type: 'warning',
                    confirmButtonText: '确定',
                    cancelButtonText: '取消'
                })

                await deleteRole(row.id)

                if (this.roleTableData.length === 1 && this.rolePagination.currentPage > 1) {
                    this.rolePagination.currentPage -= 1
                }

                this.$message.success('角色已删除')
                await this.fetchRoleData()
                await this.fetchRoleOptions()
            } catch (error) {
                if (error !== 'cancel' && error !== 'close') {
                    console.error('删除角色失败:', error)
                }
            }
        },
        async handleSubmitRole() {
            const formRef = this.$refs.roleEditorFormRef
            if (!formRef) return

            try {
                await formRef.validate()
            } catch (error) {
                return
            }

            this.roleSaving = true

            try {
                const payload = {
                    roleName: this.roleEditorForm.roleName.trim(),
                    roleCode: this.roleEditorForm.roleCode.trim(),
                    status: Number(this.roleEditorForm.status),
                    remark: this.roleEditorForm.remark.trim(),
                    menuIds: this.collectRoleMenuIds()
                }

                if (this.roleEditorMode === 'create') {
                    await createRole(payload)
                    this.$message.success('角色创建成功')
                } else {
                    await updateRole(this.roleEditorForm.id, payload)
                    this.$message.success('角色修改成功')
                }

                this.roleEditorVisible = false
                await this.fetchRoleData()
                await this.fetchRoleOptions()
            } catch (error) {
                console.error('保存角色失败:', error)
            } finally {
                this.roleSaving = false
            }
        },
        resetRoleEditor() {
            this.roleEditorForm = createDefaultRoleForm()
            this.menuTreeData = []
            this.rolePermissionTreeLoading = false
            this.roleSaving = false
            this.$refs.rolePermissionTreeRef?.setCheckedKeys([])
            this.$refs.roleEditorFormRef?.resetFields()
        },
        handleRoleSizeChange(pageSize) {
            this.rolePagination.pageSize = pageSize
            this.rolePagination.currentPage = 1
            this.fetchRoleData()
        },
        handleRoleCurrentChange(currentPage) {
            this.rolePagination.currentPage = currentPage
            this.fetchRoleData()
        }
    }
}
</script>

<style scoped>
.user-manage {
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

.summary-meta,
.summary-inline {
    margin-top: 10px;
    color: var(--app-text-secondary);
    font-size: 0.88rem;
    line-height: 1.65;
}

.manage-tabs {
    margin-top: 8px;
}

.tab-panel {
    padding-top: 8px;
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

.manage-table {
    border-radius: 14px;
    overflow: hidden;
}

.user-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-cell-main {
    min-width: 0;
}

.user-cell-name {
    color: var(--app-text);
    font-size: 0.95rem;
    font-weight: 700;
}

.user-cell-sub {
    margin-top: 4px;
    color: var(--app-text-secondary);
    font-size: 0.82rem;
}

.role-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.table-placeholder {
    color: var(--app-text-secondary);
    font-size: 0.88rem;
}

.pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
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

.permission-block {
    width: 100%;
    border: 1px solid rgba(var(--app-theme-color-rgb), 0.12);
    border-radius: 16px;
    background: rgba(var(--app-theme-color-rgb), 0.04);
    padding: 14px;
}

.permission-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
    color: var(--app-text-secondary);
    font-size: 0.88rem;
    line-height: 1.6;
}

.permission-tree {
    border-radius: 14px;
    background: #fff;
    padding: 10px 12px;
    max-height: 320px;
    overflow: auto;
}

.permission-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding-right: 8px;
}

.permission-node-name {
    color: var(--app-text);
    font-size: 0.92rem;
}

.permission-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.permission-code {
    color: var(--app-text-secondary);
    font-size: 0.8rem;
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

    .permission-toolbar,
    .permission-node {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
