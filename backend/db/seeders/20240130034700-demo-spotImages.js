'use strict';

const { SpotImage } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await SpotImage.bulkCreate([
      {
        spotId: 1,
        imageUrl: 'This is test 1-1, preview = true',
        preview: true
      },
      {
        spotId: 1,
        imageUrl: 'This is test 1-2, preview = false',
        preview: false
      },
      {
        spotId: 2,
        imageUrl: 'This is test 2-1, preview = true',
        preview: true
      },
      {
        spotId: 2,
        imageUrl: 'This is test 2-2, preview = false',
        preview: false
      },{
        spotId: 3,
        imageUrl: 'This is test 3-1, preview = true',
        preview: true
      },
      {
        spotId: 3,
        imageUrl: 'This is test 3-2, preview = false',
        preview: false
      }
    ], { validate: true });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'SpotImages';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      spotId: { [Op.in]: [1, 2, 3] }
    }, {});
  }
};
