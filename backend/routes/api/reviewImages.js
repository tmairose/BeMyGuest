const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

router.delete('/:reviewImageId', requireAuth, async (req, res, next) => {
    let { reviewImageId } = req.params;
    reviewImageId = parseInt(reviewImageId);

    let imageToDelete = await ReviewImage.findByPk(reviewImageId, {
        include: {
            model: Review
        }
    });
    if (!imageToDelete) {
        const error = new Error();
        error.message = "Review Image couldn't be found"
        error.status = 404;

        return next(error);
    }

    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (imageToDelete.toJSON().Review.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    await imageToDelete.destroy();

    return res.json({message: "Successfully deleted"});
})



module.exports = router;