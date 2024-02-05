const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

//newSection/ Get all current User's Bookings

router.get('/current', requireAuth, async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    userId = user.id;

    let userBookings = await Booking.findAll({
        where: {
            userId: userId
        },
        include: {
            model: Spot,
            attributes: {
                exclude: ['createdAt', 'updatedAt']
            },
            include: {
                model: SpotImage
            }
        }
    })

    return res.json({Bookings: userBookings});
})

//newSection/ Edit a booking
router.put('/:bookingId', requireAuth, async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    let { bookingId } = req.params;
    bookingId = parseInt(bookingId);

    let findBooking = await Booking.findByPk(bookingId);
    if (!findBooking) {
        const error = new Error();
        error.message = "Booking couldn't be found"
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    if (findBooking.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    let { startDate, endDate } = req.body;
    let start = new Date(startDate);
    let end = new Date(endDate);

    if (start >= end || end <= start) {
        const error = new Error();
        error.message = "Bad Request";
        error.errors = { endDate: "endDate cannot be on or before startDate"}
        error.status = 400

        return next(error)
    }

    let bookingSpot = await Booking.findOne({
        where: {
            [Op.or]: [
                {
                    startDate: {
                        [Op.between]: [start, end]
                    }
                },
                {
                    endDate: {
                        [Op.between]: [start, end]
                    }
                },
                {
                    [Op.and]: {
                        startDate: {
                            [Op.lte]: start
                        },
                        endDate: {
                            [Op.gte]: end
                        } 
                    }
                }
            ]
        }
    })

    if (bookingSpot && bookingSpot.id !== findBooking.id) {
            const error = new Error();
            error.message = "Sorry, this spot is already booked for the specified dates";
            error.errors = [
                {startDate: "Start date conflicts with an existing booking"},
                {endDate: "End date conflicts with an existing booking"}
            ]
            error.status = 403

            return next(error)
    }

    await findBooking.update({
        startDate: start,
        endDate: end
    })

    return res.json(findBooking);

})

//newSection/ Delete a Booking
router.delete('/:bookingId', requireAuth, async (req, res, next) => {
    let {bookingId} = req.params;
    bookingId = parseInt(bookingId);

    const currDate = Date.now();

    let bookingToDelete = await Booking.findByPk(bookingId);
    if (!bookingToDelete) {
        const error = new Error();
        error.message = "Booking couldn't be found";
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (bookingToDelete.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    const bookingStart = new Date(bookingToDelete.startDate);
    const bookingEnd = new Date(bookingToDelete.endDate);
    //check booking is not currently active before deleting
    if (currDate >= bookingStart && currDate <= bookingEnd) {
        const error = new Error();
        error.message = "Bookings that have been started can't be deleted"
        error.status = 403;

        return next(error);
    }

    await bookingToDelete.destroy();

    return res.json({message: "Successfully deleted"});
})

module.exports = router;