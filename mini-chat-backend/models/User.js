const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  account: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户账号'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '用户名'
  },
  portrait: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '头像'
  },
  password: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '密码'
  },
  sex: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '性别'
  },
  signature: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '签名'
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '邮箱'
  },
  last_opt_time: {
    type: DataTypes.DATE(3),
    allowNull: true,
    comment: '最后操作时间'
  },
  status: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '用户状态'
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否在线'
  },
  create_time: {
    type: DataTypes.DATE(3),
    allowNull: false,
    comment: '创建时间'
  },
  update_time: {
    type: DataTypes.DATE(3),
    allowNull: false,
    comment: '更新时间'
  },
  online_equipment: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '在线设备'
  }
}, {
  tableName: 'users',
  timestamps: false,
  comment: '用户表'
});

module.exports = User;