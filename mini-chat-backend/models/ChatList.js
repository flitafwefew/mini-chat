const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatList = sequelize.define('ChatList', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户id'
  },
  from_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '会话目标id'
  },
  is_top: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否置顶'
  },
  unread_num: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '未读消息数量'
  },
  last_msg_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最后消息内容'
  },
  type: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '聊天类型：private/group'
  },
  chat_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '聊天目标ID'
  },
  last_message_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '最后一条消息ID'
  },
  unread_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '未读消息数量'
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
  }
}, {
  tableName: 'chat_list',
  timestamps: false,
  comment: '聊天列表'
});

module.exports = ChatList;
