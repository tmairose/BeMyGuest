const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

router.delete('/:spotImageId', requireAuth, async (req, res, next) => {
    let { spotImageId } = req.params;
    spotImageId = parseInt(spotImageId);

    let imageToDelete = await SpotImage.findByPk(spotImageId, {
        include: {
            model: Spot
        }
    });

    if (!imageToDelete) {
        const error = new Error();
        error.message = "Spot Image couldn't be found"
        error.status = 404;

        return next(error);
    }

    // console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", imageToDelete.toJSON().Spot.ownerId)
    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (imageToDelete.toJSON().Spot.ownerId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    await imageToDelete.destroy();

    return res.json({message: "Successfully deleted"});
})

module.exports = router;