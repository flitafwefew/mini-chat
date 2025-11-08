/**
 * 错误诊断工具
 * 用于检查可能导致 500 错误的常见问题
 */

const sequelize = require('./config/db');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('开始错误诊断...');
console.log('='.repeat(80));

const checks = [];

// 1. 检查数据库连接
async function checkDatabase() {
  try {
    await sequelize.authenticate();
    checks.push({ name: '数据库连接', status: '✅ 通过', details: '数据库连接正常' });
  } catch (error) {
    checks.push({ 
      name: '数据库连接', 
      status: '❌ 失败', 
      details: `错误: ${error.message}`,
      suggestion: '请检查数据库配置和数据库服务是否运行'
    });
  }
}

// 2. 检查环境变量
function checkEnvVars() {
  const requiredVars = ['JWT_SECRET'];
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length === 0) {
    checks.push({ name: '环境变量', status: '✅ 通过', details: '必需的环境变量已设置' });
  } else {
    checks.push({ 
      name: '环境变量', 
      status: '⚠️  警告', 
      details: `缺少环境变量: ${missing.join(', ')}`,
      suggestion: '某些功能可能无法正常工作，建议设置 .env 文件'
    });
  }
}

// 3. 检查必要的目录
function checkDirectories() {
  const requiredDirs = [
    'public',
    'public/avatars',
    'controllers',
    'routes',
    'models',
    'middleware'
  ];
  
  const missing = [];
  requiredDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      missing.push(dir);
    }
  });
  
  if (missing.length === 0) {
    checks.push({ name: '目录结构', status: '✅ 通过', details: '所有必需目录存在' });
  } else {
    checks.push({ 
      name: '目录结构', 
      status: '❌ 失败', 
      details: `缺少目录: ${missing.join(', ')}`,
      suggestion: '请检查项目结构是否完整'
    });
  }
}

// 4. 检查必要的文件
function checkFiles() {
  const requiredFiles = [
    'server.js',
    'config/db.js',
    'middleware/auth.js',
    'models/associations.js'
  ];
  
  const missing = [];
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      missing.push(file);
    }
  });
  
  if (missing.length === 0) {
    checks.push({ name: '核心文件', status: '✅ 通过', details: '所有核心文件存在' });
  } else {
    checks.push({ 
      name: '核心文件', 
      status: '❌ 失败', 
      details: `缺少文件: ${missing.join(', ')}`,
      suggestion: '请检查项目文件是否完整'
    });
  }
}

// 5. 检查端口占用
function checkPort() {
  const net = require('net');
  const port = 3002;
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        checks.push({ name: '端口检查', status: '✅ 通过', details: `端口 ${port} 可用` });
        resolve();
      });
      server.close();
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        checks.push({ 
          name: '端口检查', 
          status: '❌ 失败', 
          details: `端口 ${port} 已被占用`,
          suggestion: `请停止占用端口 ${port} 的其他服务，或修改 server.js 中的端口号`
        });
      } else {
        checks.push({ 
          name: '端口检查', 
          status: '⚠️  警告', 
          details: `检查端口时出错: ${err.message}`
        });
      }
      resolve();
    });
  });
}

// 6. 检查 Node.js 版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion >= 14) {
    checks.push({ name: 'Node.js 版本', status: '✅ 通过', details: `当前版本: ${nodeVersion}` });
  } else {
    checks.push({ 
      name: 'Node.js 版本', 
      status: '⚠️  警告', 
      details: `当前版本: ${nodeVersion}`,
      suggestion: '建议使用 Node.js 14 或更高版本'
    });
  }
}

// 运行所有检查
async function runDiagnostics() {
  await checkDatabase();
  checkEnvVars();
  checkDirectories();
  checkFiles();
  await checkPort();
  checkNodeVersion();
  
  // 输出结果
  console.log('\n诊断结果:');
  console.log('='.repeat(80));
  
  checks.forEach(check => {
    console.log(`${check.status} ${check.name}`);
    console.log(`   详情: ${check.details}`);
    if (check.suggestion) {
      console.log(`   建议: ${check.suggestion}`);
    }
    console.log('');
  });
  
  const failed = checks.filter(c => c.status.includes('❌'));
  const warnings = checks.filter(c => c.status.includes('⚠️'));
  
  console.log('='.repeat(80));
  if (failed.length === 0 && warnings.length === 0) {
    console.log('✅ 所有检查通过！');
  } else {
    if (failed.length > 0) {
      console.log(`❌ 发现 ${failed.length} 个严重问题，需要修复`);
    }
    if (warnings.length > 0) {
      console.log(`⚠️  发现 ${warnings.length} 个警告，建议修复`);
    }
  }
  console.log('='.repeat(80));
  
  // 关闭数据库连接
  await sequelize.close();
}

runDiagnostics().catch(error => {
  console.error('诊断过程出错:', error);
  process.exit(1);
});

