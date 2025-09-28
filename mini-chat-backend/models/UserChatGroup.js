const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserChatGroup = sequelize.define('UserChatGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  group_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'chat_group',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member',
    allowNull: false
  },
  join_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  create_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  update_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_chat_groups',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'group_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['group_id']
    }
  ]
});

module.exports = UserChatGroup;
