-- =============================================
-- 同城任务 - 拆分“订单大全”为“我的订单”目录
-- 说明：
-- 1. 将原有“订单大全”页面菜单（id=1005）改为目录菜单“我的订单”
-- 2. 新增“发布订单”和“接取订单”两个页面菜单（id=1031/1032）
-- 3. 保留原有订单按钮权限，默认挂载到“接取订单”菜单下
-- =============================================

USE `graduation_project`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `route_name`, `component`, `icon`, `permission_code`, `sort_no`, `visible`, `status`, `remark`)
VALUES
    (1005, 0, '我的订单', 1, '/trade/order', 'TradeOrder', NULL, 'Document', NULL, 3, 1, 1, '我的订单目录'),
    (1031, 1005, '发布订单', 2, '/trade/order/publish', 'TradeOrderPublish', 'trade/TradeOrder', 'Document', NULL, 1, 1, 1, '我发布的订单列表'),
    (1032, 1005, '接取订单', 2, '/trade/order/receive', 'TradeOrderReceive', 'trade/TradeOrder', 'Tickets', NULL, 2, 1, 1, '我接取的订单列表')
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

UPDATE `sys_menu`
SET `parent_id` = 1032
WHERE `id` IN (1024, 1025, 1026);

INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
VALUES
    (1, 1005),
    (1, 1031),
    (1, 1032),
    (2, 1005),
    (2, 1031),
    (2, 1032);

SET FOREIGN_KEY_CHECKS = 1;
