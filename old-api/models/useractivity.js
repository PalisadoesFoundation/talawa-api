'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserActivity = sequelize.define('UserActivity', {
    userId: {
      primaryKey: true,
      type:DataTypes.INTEGER,
    },
    activityId: {
      primaryKey: true,
      type:DataTypes.INTEGER,
    },
    isAdmin: DataTypes.BOOLEAN
  }, {
    paranoid:false
  });
  UserActivity.associate = function(models) {
    UserActivity.belongsTo(models.User, {
      foreignKey: 'userId', 
      targetKey: 'id'
    });
    UserActivity.belongsTo(models.Activity, {
      foreignKey: 'activityId', 
      targetKey: 'id'
    });
  };
  return UserActivity;
};