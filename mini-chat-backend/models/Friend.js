const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Friend = sequelize.define('Friend', {
  id: {
    type: DataTypes.STRING(128),
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户id'
  },
  friend_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '好友id'
  },
  remark: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '备注'
  },
  group_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    defaultValue: '0',
    comment: '分组id'
  },
  is_back: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否拉黑'
  },
  is_concern: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否特别关心'
  },
  status: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '状态'
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
  chat_background: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '聊天背景'
  }
}, {
  tableName: 'friend',
  timestamps: false,
  comment: '好友表'
});

module.exports = Friend;
