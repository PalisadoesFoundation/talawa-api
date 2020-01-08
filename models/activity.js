'use strict';
module.exports = (sequelize, DataTypes) => {
  const Activity = sequelize.define('Activity', {
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    date: DataTypes.DATE
  }, {});
  Activity.associate = function(models) {
    Activity.hasMany(models.UserActivity, {foreignKey: 'activityId', sourceKey: 'id'});
    Activity.hasMany(models.Responsibility, {foreignKey: 'activityId', sourceKey: 'id'});
  };
  return Activity;
};