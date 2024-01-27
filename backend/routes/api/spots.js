const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, SpotImage, Booking } = require('../../db/models');

const router = express.Router();


//newSection/ Get all Spots

router.get('/', async (req, res, next) => {
    const spots  = await Spot.findAll();

    return res.json(spots);
})


module.exports = router;