const WebSocket = require('ws');

// 测试直接连接到后端
console.log('测试直接连接到后端 WebSocket...');
const ws1 = new WebSocket('ws://localhost:3002?token=test');

ws1.on('open', () => {
  console.log('✅ 直接连接后端成功');
  ws1.close();
});

ws1.on('error', (error) => {
  console.log('❌ 直接连接后端失败:', error.message);
});

// 测试通过Vite代理连接
setTimeout(() => {
  console.log('测试通过Vite代理连接...');
  const ws2 = new WebSocket('ws://localhost:5175/ws?token=test');

  ws2.on('open', () => {
    console.log('✅ 通过Vite代理连接成功');
    ws2.close();
  });

  ws2.on('error', (error) => {
    console.log('❌ 通过Vite代理连接失败:', error.message);
  });
}, 1000);

