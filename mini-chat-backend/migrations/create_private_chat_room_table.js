const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('private_chat_room', {
      id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false,
        comment: '私聊房间ID'
      },
      user1_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '用户1的ID',
        references: {
          model: 'user',
          key: 'id'
        }
      },
      user2_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '用户2的ID',
        references: {
          model: 'user',
          key: 'id'
        }
      },
      last_message_id: {
        type: DataTypes.STRING(64),
        allowNull: true,
        comment: '最后一条消息ID',
        references: {
          model: 'message',
          key: 'id'
        }
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
    });

    // 添加索引
    await queryInterface.addIndex('private_chat_room', ['user1_id', 'user2_id'], {
      unique: true,
      name: 'unique_user_pair'
    });
    
    await queryInterface.addIndex('private_chat_room', ['user1_id'], {
      name: 'idx_user1_id'
    });
    
    await queryInterface.addIndex('private_chat_room', ['user2_id'], {
      name: 'idx_user2_id'
    });
    
    await queryInterface.addIndex('private_chat_room', ['update_time'], {
      name: 'idx_update_time'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('private_chat_room');
  }
};
