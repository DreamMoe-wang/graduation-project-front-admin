-- =============================================
-- 同城供需任务匹配平台 - 按钮权限补丁
-- 说明：
-- 1. 与当前前端 v-permission 使用的权限码保持一致
-- 2. 管理员角色（role_id = 1）授予全部按钮权限
-- 3. 普通用户角色（role_id = 2）授予发布、接取、聊天、订单操作相关按钮权限
-- 4. 普通用户不授予交易大全中的导出/编辑/删除权限
-- =============================================

USE `graduation_project`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `route_name`, `component`, `icon`, `permission_code`, `sort_no`, `visible`, `status`, `remark`)
VALUES
    (1015, 1003, '创建交易按钮', 3, NULL, NULL, NULL, NULL, 'trade:publish:create', 1, 0, 1, '交易发布页-创建交易按钮'),
    (1016, 1003, '编辑交易按钮', 3, NULL, NULL, NULL, NULL, 'trade:publish:edit', 2, 0, 1, '交易发布页-编辑交易按钮'),
    (1017, 1003, '删除交易按钮', 3, NULL, NULL, NULL, NULL, 'trade:publish:delete', 3, 0, 1, '交易发布页-删除交易按钮'),
    (1018, 1003, '保存草稿按钮', 3, NULL, NULL, NULL, NULL, 'trade:publish:save', 4, 0, 1, '交易表单页-保存草稿按钮'),
    (1019, 1003, '提交审核按钮', 3, NULL, NULL, NULL, NULL, 'trade:publish:submit', 5, 0, 1, '交易表单页-提交待审核按钮'),
    (1020, 1004, '导出交易按钮', 3, NULL, NULL, NULL, NULL, 'trade:list:export', 1, 0, 1, '交易大全页-导出按钮'),
    (1021, 1004, '交易大全编辑按钮', 3, NULL, NULL, NULL, NULL, 'trade:list:edit', 2, 0, 1, '交易大全页-编辑按钮'),
    (1022, 1004, '交易大全删除按钮', 3, NULL, NULL, NULL, NULL, 'trade:list:delete', 3, 0, 1, '交易大全页-删除按钮'),
    (1023, 1004, '接取交易按钮', 3, NULL, NULL, NULL, NULL, 'trade:list:take', 4, 0, 1, '交易大全页-接取按钮'),
    (1024, 1005, '订单接单按钮', 3, NULL, NULL, NULL, NULL, 'trade:order:receive', 1, 0, 1, '订单大全页-接单按钮'),
    (1025, 1005, '订单完成按钮', 3, NULL, NULL, NULL, NULL, 'trade:order:complete', 2, 0, 1, '订单大全页-完成任务按钮'),
    (1026, 1005, '订单取消按钮', 3, NULL, NULL, NULL, NULL, 'trade:order:cancel', 3, 0, 1, '订单大全页-取消订单按钮'),
    (1027, 1006, '联系对方按钮', 3, NULL, NULL, NULL, NULL, 'chat:contact', 1, 0, 1, '交易/订单页-联系对方按钮')
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
    (1, 1015),
    (1, 1016),
    (1, 1017),
    (1, 1018),
    (1, 1019),
    (1, 1020),
    (1, 1021),
    (1, 1022),
    (1, 1023),
    (1, 1024),
    (1, 1025),
    (1, 1026),
    (1, 1027);

INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
VALUES
    (2, 1015),
    (2, 1016),
    (2, 1017),
    (2, 1018),
    (2, 1019),
    (2, 1023),
    (2, 1024),
    (2, 1025),
    (2, 1026),
    (2, 1027);

SET FOREIGN_KEY_CHECKS = 1;
