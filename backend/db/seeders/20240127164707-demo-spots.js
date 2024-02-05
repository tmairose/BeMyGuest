'use strict';

const { Spot } = require('../models');

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
    await Spot.bulkCreate([
      {
        ownerId: 1,
        address: '123 TestOne Ln.',
        city: 'TestOneCity',
        state: 'MT',
        country: 'USA',
        lat: 81.91,
        lng: 91.91,
        name: 'TestOne Spot',
        description: 'This is the TestOne Spot description.',
        price: 1
      },
      {
        ownerId: 2,
        address: '123 TestTwo Ln.',
        city: 'TestTwoCity',
        state: 'MT',
        country: 'USA',
        lat: 82.92,
        lng: 92.92,
        name: 'TestTwo Spot',
        description: 'This is the TestTwo Spot description.',
        price: 2
      },
      {
        ownerId: 3,
        address: '123 TestThree Ln.',
        city: 'TestThreeCity',
        state: 'MT',
        country: 'USA',
        lat: 83.93,
        lng: 93.93,
        name: 'TestThree Spot',
        description: 'This is the TestThree Spot description.',
        price: 3
      },
    ], { validate: true });

  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      name: { [Op.in]: ['TestOne Spot', 'TestTwo Spot', 'TestThree Spot'] }
    }, {});
  }
};
