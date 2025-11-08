const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UserChatGroup = sequelize.define('UserChatGroup', {
  user_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'user',
      key: 'id'
    }
  },
  group_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'chat_group',
      key: 'id'
    }
  }
}, {
  tableName: 'user_chat_groups',
  timestamps: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['group_id']
    }
  ]
});

module.exports = UserChatGroup;
