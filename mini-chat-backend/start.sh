#!/bin/bash

echo "正在启动Mini Chat后端服务..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未检测到Node.js，请先安装Node.js"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "错误: 依赖安装失败"
        exit 1
    fi
fi

# 设置环境变量
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=mini_chat
export DB_USER=root
export DB_PASSWORD=123456
export PORT=3000
export JWT_SECRET=your-super-secret-jwt-key-here
export NODE_ENV=development

echo "环境变量已设置"
echo "数据库: $DB_NAME@$DB_HOST:$DB_PORT"
echo "服务端口: $PORT"
echo

# 启动服务
echo "启动后端服务..."
node server.js
