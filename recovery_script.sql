-- 数据恢复脚本
-- 从二进制日志中恢复用户数据

USE mini_chat;

-- 首先检查当前数据状态
SELECT 'Current user count:' as info, COUNT(*) as count FROM user;
SELECT 'Current message count:' as info, COUNT(*) as count FROM message;
SELECT 'Current chat_list count:' as info, COUNT(*) as count FROM chat_list;

