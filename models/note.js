'use strict';
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    senderId: DataTypes.INTEGER,
    activityId: DataTypes.INTEGER,
    body: DataTypes.STRING,
    status: DataTypes.ENUM('pending', 'sent', 'delivered')
  }, {});
  Note.associate = function(models) {
    Note.belongsTo(models.User, {foreignKey: 'userId'});
    Note.belongsTo(models.Activity, {foreignKey: 'activityId'});
  };
  return Note;
};