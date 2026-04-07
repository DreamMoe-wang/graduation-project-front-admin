-- =============================================
-- 菜单管理最小可用权限补丁
-- 目标：
-- 1. 将菜单管理页面权限统一收口为 menu:view
-- 2. 补齐菜单管理的 3 个按钮权限：menu:create、menu:edit、menu:delete
-- 3. 默认授予管理员角色（role_id = 1）
-- =============================================

USE `graduation_project`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `route_name`, `component`, `icon`, `permission_code`, `sort_no`, `visible`, `status`, `remark`)
VALUES
    (1009, 0, '菜单管理', 2, '/menu', 'MenuManage', 'menu/MenuManage', 'Menu', 'menu:view', 6, 1, 1, '菜单管理页面'),
    (1031, 1009, '新增菜单', 3, NULL, NULL, NULL, NULL, 'menu:create', 1, 0, 1, '菜单管理-新增按钮'),
    (1032, 1009, '编辑菜单', 3, NULL, NULL, NULL, NULL, 'menu:edit', 2, 0, 1, '菜单管理-编辑按钮'),
    (1033, 1009, '删除菜单', 3, NULL, NULL, NULL, NULL, 'menu:delete', 3, 0, 1, '菜单管理-删除按钮')
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
    (1, 1009),
    (1, 1031),
    (1, 1032),
    (1, 1033);

SET FOREIGN_KEY_CHECKS = 1;
