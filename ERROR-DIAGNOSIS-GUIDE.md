# 🔍 错误诊断指南

## 概述

当遇到 "Internal Server Error" (500 错误) 时，使用本指南来定位和解决问题。

## 🚀 快速开始

### 1. 运行错误诊断工具

```bash
cd mini-chat-backend
node diagnose-errors.js
```

这个工具会自动检查：
- ✅ 数据库连接
- ✅ 环境变量配置
- ✅ 目录结构
- ✅ 核心文件
- ✅ 端口占用
- ✅ Node.js 版本

### 2. 查看后端控制台日志

重启后端服务器后，所有错误都会输出详细的日志：

```bash
cd mini-chat-backend
node server.js
```

现在错误日志会包含：
- 📅 错误发生时间
- 🔗 请求路径和方法
- 📋 请求头和请求体
- 💬 错误消息和堆栈
- 🏷️ 错误类型

## 📊 错误日志格式

改进后的错误日志格式如下：

```
================================================================================
服务器错误发生时间: 2024-01-01T12:00:00.000Z
请求路径: POST /api/v1/user/search
请求头: {
  "x-token": "...",
  "content-type": "application/json"
}
请求体: {
  "keyword": "test"
}
错误消息: Cannot read property 'id' of undefined
错误名称: TypeError
错误堆栈: TypeError: Cannot read property 'id' of undefined
    at searchUsers (friendController.js:123:45)
    ...
================================================================================
```

## 🔧 常见错误类型及解决方案

### 1. 数据库连接错误

**错误信息**: `SequelizeConnectionError` 或 `ECONNREFUSED`

**可能原因**:
- 数据库服务未启动
- 数据库配置错误（用户名、密码、主机、端口）
- 数据库不存在

**解决方案**:
1. 检查 MySQL 服务是否运行
2. 检查 `mini-chat-backend/.env` 文件中的数据库配置
3. 确认数据库名称是否正确

### 2. 认证错误

**错误信息**: `TokenExpiredError` 或 `JsonWebTokenError`

**可能原因**:
- JWT token 过期
- JWT_SECRET 未设置或配置错误
- token 格式不正确

**解决方案**:
1. 检查 `.env` 文件中的 `JWT_SECRET` 配置
2. 重新登录获取新的 token
3. 检查前端是否正确发送 token

### 3. 模型关联错误

**错误信息**: `SequelizeAssociationError` 或 `Cannot find module`

**可能原因**:
- 模型文件缺失
- 关联配置错误
- 循环依赖

**解决方案**:
1. 检查 `models/associations.js` 文件
2. 确认所有模型文件都存在
3. 检查模型之间的关联配置

### 4. 路由错误

**错误信息**: `Cannot GET/POST /api/...` 或路由未定义

**可能原因**:
- 路由文件未正确引入
- 路由路径配置错误
- 中间件顺序问题

**解决方案**:
1. 检查 `server.js` 中的路由引入
2. 确认路由文件存在且正确导出
3. 检查路由路径是否匹配

### 5. 文件操作错误

**错误信息**: `ENOENT` (文件不存在) 或 `EACCES` (权限不足)

**可能原因**:
- 文件路径错误
- 目录不存在
- 文件权限不足

**解决方案**:
1. 检查文件路径是否正确
2. 确认目录存在（如 `public/avatars`）
3. 检查文件权限

## 📝 调试步骤

### 步骤 1: 运行诊断工具

```bash
cd mini-chat-backend
node diagnose-errors.js
```

### 步骤 2: 查看详细错误日志

重启后端服务器，触发错误，然后查看控制台输出。

### 步骤 3: 检查特定文件

根据错误信息，检查相关的 controller、model 或 route 文件。

### 步骤 4: 使用开发模式

设置环境变量以获取更详细的错误信息：

```bash
# Windows PowerShell
$env:NODE_ENV="development"
node server.js

# Linux/Mac
NODE_ENV=development node server.js
```

在开发模式下，API 响应会包含详细的错误堆栈信息。

## 🎯 错误定位技巧

### 1. 查看错误堆栈

错误堆栈会显示错误发生的具体文件和行号：
```
at searchUsers (friendController.js:123:45)
```
这表示错误在 `friendController.js` 的第 123 行。

### 2. 检查请求参数

查看错误日志中的"请求体"，确认前端发送的参数是否正确。

### 3. 检查数据库查询

如果是数据库相关错误，检查：
- SQL 查询是否正确
- 表结构是否匹配
- 数据是否存在

### 4. 检查异步操作

确保所有异步操作都正确使用了 `await` 或 `.then()`。

## 🔍 高级调试

### 启用 Sequelize 日志

在 `config/db.js` 中添加日志配置：

```javascript
const sequelize = new Sequelize(..., {
  // ... 其他配置
  logging: console.log, // 或使用自定义日志函数
});
```

### 使用 Node.js 调试器

```bash
node --inspect server.js
```

然后在 Chrome 中打开 `chrome://inspect` 进行调试。

## 📞 获取帮助

如果问题仍然无法解决：

1. **收集信息**:
   - 完整的错误日志
   - 诊断工具的输出
   - 相关的代码文件

2. **检查日志文件**:
   - 如果有日志文件，检查最新的日志

3. **查看 GitHub Issues**:
   - 搜索类似的问题
   - 创建新的 issue 并提供详细信息

## ✅ 预防措施

1. **定期运行诊断工具**: 在部署前运行 `diagnose-errors.js`
2. **使用环境变量**: 不要硬编码配置信息
3. **错误处理**: 确保所有异步操作都有错误处理
4. **日志记录**: 在关键操作处添加日志
5. **测试**: 编写单元测试和集成测试

---

**最后更新**: 2024-01-01

