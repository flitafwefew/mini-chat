const { Sequelize } = require('sequelize');

// 从环境变量读取配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'mini_chat',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: false
    },
    pool: {
      max: 10, // 最大连接数
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;