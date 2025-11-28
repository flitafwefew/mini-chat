module.experts={
    up: async(queryTnterface, Sequelize)=>{
        await queryTnterface.changeColumn('friends', 'friend_id', {
            type: Sequelize.STRING(128),
            allowNull: false,
    });
},
    down: async(queryTnterface, Sequelize)=>{
        await queryTnterface.changeColumn('friends', 'friend_id', {
            type: Sequelize.STRING(64),
            allowNull: false
    });
}
}