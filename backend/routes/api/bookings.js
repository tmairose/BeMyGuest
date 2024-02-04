const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

//newSection/ Get all current User's Bookings

router.get('/current', async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    userId = user.id;

    let userBookings = await Booking.findAll({
        where: {
            userId: userId
        }
    })

    return res.json(userBookings);
})




module.exports = router;