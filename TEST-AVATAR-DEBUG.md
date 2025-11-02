# 头像加载问题诊断测试脚本

## 问题描述
前端尝试加载头像图片时出现 `500 Internal Server Error`。

错误URL: `http://localhost:5175/avatars/1f8fa90….jpeg`

## 测试脚本列表

### 1. 后端静态文件诊断脚本

#### `mini-chat-backend/test-static-files.js`
**用途**: 检查后端静态文件配置和文件系统状态

**运行方式**:
```bash
cd mini-chat-backend
node test-static-files.js
```

**检查内容**:
- 目录结构是否存在
- 测试文件是否存在
- 文件权限和可读性
- Express静态文件服务测试

#### `mini-chat-backend/test-avatar-route.js`
**用途**: 启动一个独立的测试服务器，验证静态文件路由

**运行方式**:
```bash
cd mini-chat-backend
node test-avatar-route.js
```

**功能**:
- 启动测试服务器在 3002 端口
- 自动测试头像文件访问
- 显示详细的请求/响应日志

#### `mini-chat-backend/public/test-avatar-access.js`
**用途**: 在浏览器控制台中运行的诊断脚本（需要后端服务器运行）

**运行方式**:
- 在后端服务器运行时，在浏览器控制台执行此脚本
- 或者用 Node.js 运行: `node mini-chat-backend/public/test-avatar-access.js`

### 2. 前端代理诊断脚本

#### `moni.chat/public/test-avatar-proxy.html`
**用途**: 测试前端代理配置和路径解析

**访问方式**:
1. 启动前端开发服务器: `cd moni.chat && npm run dev`
2. 在浏览器中访问: `http://localhost:5175/test-avatar-proxy.html`

**测试功能**:
- 环境信息显示
- 路径组合测试
- HTTP请求测试（直接访问、代理访问、后端访问）
- 图片加载测试
- 完整流程测试

#### `moni.chat/public/test-avatar-debug.html`
**用途**: 实时监控网络请求和图片加载

**访问方式**:
1. 启动前端开发服务器: `cd moni.chat && npm run dev`
2. 在浏览器中访问: `http://localhost:5175/test-avatar-debug.html`

**功能**:
- 自动拦截和监控所有头像相关的网络请求
- 实时显示请求日志
- 图片加载测试
- 统计信息显示

## 诊断流程

### 步骤 1: 检查后端文件系统
```bash
cd mini-chat-backend
node test-static-files.js
```

**预期结果**:
- ✓ public目录存在
- ✓ avatars目录存在
- ✓ 测试文件存在且可读
- ✓ Express静态文件服务正常

**如果失败**: 检查文件路径、权限、文件是否存在

### 步骤 2: 测试后端静态服务
```bash
cd mini-chat-backend
node test-avatar-route.js
```

在另一个终端测试:
```bash
curl http://localhost:3002/avatars/1f8fa9040a3156c8214e2a4f6b51dc3d.jpeg
```

**预期结果**: 返回200状态码和图片数据

### 步骤 3: 测试前端代理
1. 启动前端: `cd moni.chat && npm run dev`
2. 访问: `http://localhost:5175/test-avatar-proxy.html`
3. 点击"运行完整测试"

**检查项**:
- 代理访问是否成功
- 路径是否正确解析
- 响应状态码

### 步骤 4: 实时监控
1. 访问: `http://localhost:5175/test-avatar-debug.html`
2. 点击"测试所有路径"
3. 观察日志输出

## 常见问题排查

### 问题1: 文件不存在
**症状**: 404错误
**解决**: 
- 检查文件路径: `mini-chat-backend/public/avatars/1f8fa9040a3156c8214e2a4f6b51dc3d.jpeg`
- 确认文件名是否正确

### 问题2: 权限问题
**症状**: 403错误或无法读取
**解决**:
- 检查文件权限
- Windows: 确保文件未锁定
- Linux/Mac: `chmod 644 public/avatars/*.jpeg`

### 问题3: 代理配置错误
**症状**: 前端无法通过代理访问
**解决**:
- 检查 `moni.chat/vite.config.ts` 中的代理配置
- 确认后端服务器地址: `http://10.33.123.133:3002`

### 问题4: 路径解析错误
**症状**: 500错误
**解决**:
- 检查数据库中的头像路径格式
- 确认路径是否以 `/` 开头
- 检查 `ChatList.vue` 中的 `getChatAvatar` 函数

### 问题5: CORS问题
**症状**: CORS错误
**解决**:
- 检查后端 `server.js` 中的 CORS 配置
- 确认允许的源地址

## 预期正确配置

### 后端 (server.js)
```javascript
// 静态文件服务
app.use(express.static('public'));
```

### 前端 (vite.config.ts)
```javascript
proxy: {
  '/avatars': {
    target: 'http://10.33.123.133:3002',
    changeOrigin: true,
  },
}
```

### 数据库中的头像路径
- 格式: `/avatars/1f8fa9040a3156c8214e2a4f6b51dc3d.jpeg`
- 必须: 以 `/` 开头，相对路径

### 前端路径处理 (ChatList.vue)
- 如果路径不以 `/` 或 `http` 开头，自动添加 `/`
- 相对路径通过代理访问后端

## 下一步

运行这些测试脚本后，根据输出结果确定问题所在，然后进行相应的修复。

