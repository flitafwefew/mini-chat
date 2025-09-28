-- 创建多个测试用户
-- 密码都是 123456 (加密后: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi)

-- 插入多个测试用户
INSERT INTO `user` VALUES 
('user-001', 'alice', '爱丽丝', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '女', '1995-03-15 00:00:00.000', 'Hello, I am Alice!', '13800138001', 'alice@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-002', 'bob', '鲍勃', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '男', '1992-07-22 00:00:00.000', 'Nice to meet you!', '13800138002', 'bob@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-003', 'charlie', '查理', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '男', '1998-11-08 00:00:00.000', 'Let\'s chat!', '13800138003', 'charlie@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-004', 'diana', '黛安娜', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '女', '1996-05-12 00:00:00.000', 'Welcome to our chat!', '13800138004', 'diana@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-005', 'eve', '夏娃', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '女', '1994-09-30 00:00:00.000', 'Hello everyone!', '13800138005', 'eve@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-006', 'frank', '弗兰克', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '男', '1991-12-03 00:00:00.000', 'How are you doing?', '13800138006', 'frank@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-007', 'grace', '格蕾丝', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '女', '1997-01-18 00:00:00.000', 'Nice to see you here!', '13800138007', 'grace@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-008', 'henry', '亨利', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '男', '1993-06-25 00:00:00.000', 'Good day!', '13800138008', 'henry@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-009', 'iris', '艾瑞斯', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '女', '1999-04-14 00:00:00.000', 'Hope you have a great day!', '13800138009', 'iris@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL),
('user-010', 'jack', '杰克', NULL, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '男', '1990-10-07 00:00:00.000', 'Welcome to the chat room!', '13800138010', 'jack@example.com', NULL, NULL, 'active', b'0', NOW(), NOW(), NULL);

-- 显示创建的用户
SELECT id, account, name, sex, phone, email, signature, create_time FROM user WHERE account IN ('alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry', 'iris', 'jack') ORDER BY account;
