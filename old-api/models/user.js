'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {});
  User.associate = function(models) {
    User.hasMany(models.UserActivity, {foreignKey: 'userId', sourceKey: 'id'});
    User.hasMany(models.Responsibility, {foreignKey: 'userId', sourceKey: 'id'});
  };
  return User;
};