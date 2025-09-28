const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  from_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '消息发送方id'
  },
  to_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '消息接受方id'
  },
  type: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '消息类型'
  },
  is_show_time: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
    comment: '是否显示时间'
  },
  msg_content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '消息内容'
  },
  status: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '消息状态'
  },
  source: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '消息源'
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
  from_forward_msgId: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '转发消息的id'
  },
  sender_id: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '发送者ID'
  }
}, {
  tableName: 'message',
  timestamps: false,
  comment: '消息表'
});

module.exports = Message;