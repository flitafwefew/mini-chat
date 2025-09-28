const User = require('./User');
const Message = require('./Message');
const ChatList = require('./ChatList');
const ChatGroup = require('./ChatGroup');
const Friend = require('./Friend');
const UserChatGroup = require('./UserChatGroup');
const PrivateChatRoom = require('./PrivateChatRoom');

// 定义模型关联
// User 和 Message 的关联
User.hasMany(Message, { 
  foreignKey: 'from_id', 
  as: 'sentMessages' 
});
User.hasMany(Message, { 
  foreignKey: 'to_id', 
  as: 'receivedMessages' 
});
Message.belongsTo(User, { 
  foreignKey: 'from_id', 
  as: 'fromUser' 
});
Message.belongsTo(User, { 
  foreignKey: 'to_id', 
  as: 'toUser' 
});
// Message.belongsTo(User, { 
//   foreignKey: 'sender_id', 
//   as: 'sender' 
// });

// User 和 ChatList 的关联
User.hasMany(ChatList, { 
  foreignKey: 'user_id', 
  as: 'userChatLists' 
});
ChatList.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});

// ChatList 和 User 的关联（用于私聊）
ChatList.belongsTo(User, { 
  foreignKey: 'from_id', 
  as: 'fromUser' 
});

// ChatList 和 ChatGroup 的关联（用于群聊）
ChatList.belongsTo(ChatGroup, { 
  foreignKey: 'from_id', 
  as: 'groupInfo' 
});

// User 和 Friend 的关联
User.hasMany(Friend, { 
  foreignKey: 'user_id', 
  as: 'userFriends' 
});
User.hasMany(Friend, { 
  foreignKey: 'friend_id', 
  as: 'friendOf' 
});
Friend.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});
Friend.belongsTo(User, { 
  foreignKey: 'friend_id', 
  as: 'friendUser' 
});

// User 和 ChatGroup 的多对多关联
User.belongsToMany(ChatGroup, { 
  through: 'user_chat_groups', 
  foreignKey: 'user_id', 
  otherKey: 'group_id',
  as: 'chatGroups' 
});
ChatGroup.belongsToMany(User, { 
  through: 'user_chat_groups', 
  foreignKey: 'group_id', 
  otherKey: 'user_id',
  as: 'members' 
});

// UserChatGroup 关联
User.hasMany(UserChatGroup, { 
  foreignKey: 'user_id', 
  as: 'userChatGroups' 
});
ChatGroup.hasMany(UserChatGroup, { 
  foreignKey: 'group_id', 
  as: 'userChatGroups' 
});
UserChatGroup.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user' 
});
UserChatGroup.belongsTo(ChatGroup, { 
  foreignKey: 'group_id', 
  as: 'group' 
});

// PrivateChatRoom 关联
User.hasMany(PrivateChatRoom, { 
  foreignKey: 'user1_id', 
  as: 'privateChatRoomsAsUser1' 
});
User.hasMany(PrivateChatRoom, { 
  foreignKey: 'user2_id', 
  as: 'privateChatRoomsAsUser2' 
});
PrivateChatRoom.belongsTo(User, { 
  foreignKey: 'user1_id', 
  as: 'user1' 
});
PrivateChatRoom.belongsTo(User, { 
  foreignKey: 'user2_id', 
  as: 'user2' 
});

module.exports = {
  User,
  Message,
  ChatList,
  ChatGroup,
  Friend,
  UserChatGroup,
  PrivateChatRoom
};
