const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatGroup = sequelize.define('ChatGroup', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '创建用户id'
  },
  portrait: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '群头像'
  },
  name: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '群名名称'
  },
  notice: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '群公告'
  },
  member_num: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '成员数'
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
  chat_group_number: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '群号'
  }
}, {
  tableName: 'chat_group',
  timestamps: false,
  comment: '聊天群表'
});

module.exports = ChatGroup;
