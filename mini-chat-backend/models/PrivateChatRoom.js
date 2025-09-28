const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PrivateChatRoom = sequelize.define('PrivateChatRoom', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false,
    comment: '私聊房间ID'
  },
  user1_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户1的ID'
  },
  user2_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户2的ID'
  },
  last_message_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '最后一条消息ID'
  },
  last_message_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最后一条消息内容'
  },
  last_message_time: {
    type: DataTypes.DATE(3),
    allowNull: true,
    comment: '最后一条消息时间'
  },
  user1_unread_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '用户1未读消息数'
  },
  user2_unread_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '用户2未读消息数'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '房间是否活跃'
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
  tableName: 'private_chat_room',
  timestamps: false,
  comment: '私聊房间表',
  indexes: [
    {
      unique: true,
      fields: ['user1_id', 'user2_id']
    },
    {
      fields: ['user1_id']
    },
    {
      fields: ['user2_id']
    }
  ]
});

module.exports = PrivateChatRoom;
