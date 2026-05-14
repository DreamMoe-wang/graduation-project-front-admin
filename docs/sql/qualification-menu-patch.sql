-- =============================================
-- 资格认证菜单与权限补丁
-- 说明：
-- 1. 新增“资格认证”页面菜单，放在首页下方且位于交易集市上方
-- 2. 普通用户可提交和修改自己的认证资料
-- 3. 管理员仅负责审核通过/驳回
-- =============================================

USE `graduation_project`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `route_name`, `component`, `icon`, `permission_code`, `sort_no`, `visible`, `status`, `remark`)
VALUES
    (1040, 0, '资格认证', 2, '/qualification', 'QualificationManage', 'qualification/QualificationManage', 'Medal', 'qualification:view', 2, 1, 1, '用户资格认证与管理员审核页面'),
    (1041, 1040, '发起认证按钮', 3, NULL, NULL, NULL, NULL, 'qualification:create', 1, 0, 1, '资格认证页-发起认证按钮'),
    (1042, 1040, '修改认证按钮', 3, NULL, NULL, NULL, NULL, 'qualification:edit', 2, 0, 1, '资格认证页-修改认证按钮'),
    (1043, 1040, '保存草稿按钮', 3, NULL, NULL, NULL, NULL, 'qualification:save', 3, 0, 1, '认证表单页-保存草稿按钮'),
    (1044, 1040, '提交审核按钮', 3, NULL, NULL, NULL, NULL, 'qualification:submit', 4, 0, 1, '认证表单页-提交审核按钮'),
    (1045, 1040, '认证审核按钮', 3, NULL, NULL, NULL, NULL, 'qualification:review', 5, 0, 1, '管理员认证审核按钮')
ON DUPLICATE KEY UPDATE
    `parent_id` = VALUES(`parent_id`),
    `menu_name` = VALUES(`menu_name`),
    `menu_type` = VALUES(`menu_type`),
    `path` = VALUES(`path`),
    `route_name` = VALUES(`route_name`),
    `component` = VALUES(`component`),
    `icon` = VALUES(`icon`),
    `permission_code` = VALUES(`permission_code`),
    `sort_no` = VALUES(`sort_no`),
    `visible` = VALUES(`visible`),
    `status` = VALUES(`status`),
    `remark` = VALUES(`remark`);

INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
VALUES
    (1, 1040),
    (1, 1041),
    (1, 1042),
    (1, 1043),
    (1, 1044),
    (1, 1045),
    (2, 1040),
    (2, 1041),
    (2, 1042),
    (2, 1043),
    (2, 1044);

SET FOREIGN_KEY_CHECKS = 1;
