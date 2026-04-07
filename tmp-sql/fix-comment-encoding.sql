SET NAMES utf8mb4;
UPDATE sys_role
SET role_name = '管理员',
    remark = '平台管理员，负责审核与后台管理'
WHERE id = 1
  AND (role_name LIKE '%?%' OR remark LIKE '%?%');

UPDATE sys_role
SET role_name = '普通用户',
    remark = '平台普通用户，可发布、聊天、接单'
WHERE id = 2
  AND (role_name LIKE '%?%' OR remark LIKE '%?%');