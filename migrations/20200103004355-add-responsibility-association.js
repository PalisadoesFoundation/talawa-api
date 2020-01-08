'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return [
      await queryInterface.addColumn(
        'Responsibilities',
        'activityId',
        {
          allowNull: false,
          type: Sequelize.INTEGER,
          references: {
            model: 'Activities',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }
      ),
      await queryInterface.addColumn(
        'Responsibilities',
        'userId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: 'Users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        }
      ),
    ]
  },

  down: async (queryInterface, Sequelize) => {
    return [
      await queryInterface.removeColumn('Responsibilities', 'activityId'),
      await queryInterface.removeColumn('Responsibilities', 'userId'),
    ]
  }
};
