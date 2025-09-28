@echo off
echo 正在启动Mini Chat后端服务...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

REM 设置环境变量
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=mini_chat
set DB_USER=root
set DB_PASSWORD=123456
set PORT=3000
set JWT_SECRET=your-super-secret-jwt-key-here
set NODE_ENV=development

echo 环境变量已设置
echo 数据库: %DB_NAME@%DB_HOST%:%DB_PORT%
echo 服务端口: %PORT%
echo.

REM 启动服务
echo 启动后端服务...
node server.js

pause
