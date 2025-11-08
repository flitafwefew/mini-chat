@echo off
echo ========================================
echo 启动后端服务器
echo ========================================
echo.
cd /d %~dp0
echo 当前目录: %CD%
echo.
echo 正在启动服务器...
echo 控制台输出将显示在此窗口中
echo 按 Ctrl+C 可以停止服务器
echo.
echo ========================================
echo.
npm start
pause

