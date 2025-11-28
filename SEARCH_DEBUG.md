# 搜索功能排查步骤

## 1. 前端检查

### 1.1 检查 API 调用
- 文件：`moni.chat/src/api/friend.ts`
- 函数：`searchUsers(keyword: string)`
- 请求路径：`/api/v1/friend/search?keyword=${encodeURIComponent(keyword)}`
- ✅ 路径正确

### 1.2 检查请求拦截器
- 文件：`moni.chat/src/api/request.ts`
- Token 获取：`localStorage.getItem('x-token') || localStorage.getItem('token')`
- Token 发送：`config.headers['x-token'] = token`
- ✅ Token 处理正确

### 1.3 检查响应处理
- 文件：`moni.chat/src/components/AddFriend.vue`
- 响应检查：`response.code === 200`
- ✅ 响应处理正确

## 2. 后端检查

### 2.1 检查路由配置
- 文件：`mini-chat-backend/server.js`
- 路由注册：`app.use('/api/v1/friend', require('./routes/friend'))`
- ✅ 路由已注册

### 2.2 检查路由定义
- 文件：`mini-chat-backend/routes/friend.js`
- 搜索路由：`router.get('/search', asyncHandler(friendController.searchUsers))`
- 认证中间件：`router.use(authMiddleware)`
- ✅ 路由定义正确

### 2.3 检查认证中间件
- 文件：`mini-chat-backend/middleware/auth.js`
- Token 获取：`req.header('x-token')`
- Token 验证：`jwt.verify(token, ...)`
- 用户信息：`req.user = decoded`
- ✅ 认证中间件正确

### 2.4 检查 JWT Token 字段
- 文件：`mini-chat-backend/controllers/authController.js`
- Token 生成：`{ userId: user.id, account: user.account }`
- ✅ Token 包含 `userId` 字段

### 2.5 检查控制器实现
- 文件：`mini-chat-backend/controllers/friendController.js`
- 函数：`searchUsers`
- userId 获取：`req.user.userId || req.user.user_id || req.user.id`
- ✅ 控制器实现正确

## 3. 可能的问题

### 问题 1：Token 未正确发送
**检查方法：**
1. 打开浏览器开发者工具
2. 查看 Network 标签
3. 找到搜索请求
4. 检查 Request Headers 中是否有 `x-token`

**解决方案：**
- 确保登录后 token 已保存到 localStorage
- 检查 token 是否过期

### 问题 2：后端服务未运行
**检查方法：**
1. 检查后端服务是否在运行
2. 查看后端控制台是否有错误日志

**解决方案：**
- 启动后端服务：`cd mini-chat-backend && npm start`

### 问题 3：数据库连接问题
**检查方法：**
1. 查看后端控制台是否有数据库连接错误
2. 检查数据库配置是否正确

**解决方案：**
- 检查数据库配置
- 确保数据库服务正在运行

### 问题 4：认证失败
**检查方法：**
1. 查看后端控制台日志
2. 检查是否有 401 错误

**解决方案：**
- 重新登录获取新的 token
- 检查 JWT_SECRET 是否一致

### 问题 5：请求路径错误
**检查方法：**
1. 查看浏览器 Network 标签
2. 检查实际请求的 URL

**解决方案：**
- 检查 vite.config.ts 中的代理配置
- 检查 baseURL 配置

## 4. 调试步骤

### 步骤 1：检查前端请求
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 执行搜索操作
4. 查看请求详情：
   - 请求 URL
   - 请求方法
   - 请求头（特别是 x-token）
   - 请求参数
   - 响应状态码
   - 响应内容

### 步骤 2：检查后端日志
1. 查看后端控制台输出
2. 查找搜索相关的日志：
   - `=== 搜索用户开始 ===`
   - `req.user:`
   - `req.query:`
   - `搜索关键词:`
   - `userId:`
   - `=== 搜索用户结束 ===` 或 `=== 搜索用户失败 ===`

### 步骤 3：检查错误信息
1. 查看浏览器控制台错误
2. 查看后端控制台错误
3. 查看网络请求的错误响应

## 5. 常见错误及解决方案

### 错误 1：401 Unauthorized
**原因：** Token 无效或过期
**解决方案：** 重新登录

### 错误 2：500 Internal Server Error
**原因：** 服务器内部错误（可能是数据库连接问题）
**解决方案：** 查看后端日志，检查数据库连接

### 错误 3：Network Error
**原因：** 后端服务未运行或网络问题
**解决方案：** 检查后端服务是否运行，检查网络连接

### 错误 4：Request failed with status code 500
**原因：** 后端处理请求时出错
**解决方案：** 查看后端日志，检查具体错误信息

