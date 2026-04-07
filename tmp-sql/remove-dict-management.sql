USE `graduation_project`;

SET NAMES utf8mb4;

DELETE FROM `sys_role_menu`
WHERE `menu_id` = 1010;

DELETE FROM `sys_menu`
WHERE `id` = 1010
   OR `path` = '/dict'
   OR `permission_code` = 'dict:manage';

DELETE FROM `sys_module_item`
WHERE `module_name` = 'dict';
