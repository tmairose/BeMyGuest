'use strict';

const { Booking } = require('../models');

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
    await Booking.bulkCreate([
      {
        userId: 1,
        spotId: 2,
        startDate: "2020-01-01",
        endDate: "2020-02-01"
      },
      {
        userId: 2,
        spotId: 3,
        startDate: "2020-03-01",
        endDate: "2020-04-01"
      },
      {
        userId: 3,
        spotId: 1,
        startDate: "2020-05-01",
        endDate: "2020-06-01"
      },
    ], { validate: true })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    options.tableName = 'Bookings';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      startDate: { [Op.in]: ["2020-01-01", "2020-03-01", "2020-05-01"] }
    }, {});
  }
};
