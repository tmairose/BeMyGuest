'use strict';

/** @type {import('sequelize-cli').Migration} */

const { User } = require('../models');
const bcrypt = require("bcryptjs");

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}

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
   await User.bulkCreate([
    {
      email: 'userOne@user.io',
      username: 'UserOne',
      firstName: 'firstNameOne',
      lastName: 'lastNameOne',
      hashedPassword: bcrypt.hashSync('password')
    },
    {
      email: 'userTwo@user.io',
      username: 'UserTwo',
      firstName: 'firstNameTwo',
      lastName: 'lastNameTwo',
      hashedPassword: bcrypt.hashSync('password2')
    },
    {
      email: 'UserThree@user.io',
      username: 'UserThree',
      firstName: 'firstNameThree',
      lastName: 'lastNameThree',
      hashedPassword: bcrypt.hashSync('password3')
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
    options.tableName = 'Users';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      username: { [Op.in]: ['UserOne', 'UserTwo', 'UserThree'] }
    }, {});
  }
};

