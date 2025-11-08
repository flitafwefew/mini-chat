-- 修复 friend 表 id 字段长度
-- 如果 Sequelize 的 alter 模式无法自动修改，可以手动执行此 SQL

ALTER TABLE `friend` MODIFY COLUMN `id` VARCHAR(128) NOT NULL;

