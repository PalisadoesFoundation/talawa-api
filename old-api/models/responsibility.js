'use strict';
module.exports = (sequelize, DataTypes) => {
  const Responsibility = sequelize.define('Responsibility', {
    title: DataTypes.STRING,
    description: DataTypes.STRING,
    date: DataTypes.DATE,
    priority: DataTypes.INTEGER,
    isCompleted: DataTypes.BOOLEAN
  }, {});
  Responsibility.associate = function(models) {
    Responsibility.belongsTo(models.User, {foreignKey: 'userId'});
    Responsibility.belongsTo(models.Activity, {foreignKey: 'activityId'});
  };
  return Responsibility;
};