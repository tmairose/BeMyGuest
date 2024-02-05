const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

//newSection/ Create a new Spot

    //subSection/ Validate new Spot form submission
    const validateNewSpot = [
        check('address')
            .exists({ checkFalsy: true })
            .withMessage('Street address is required'),
        check('city')
            .exists({ checkFalsy: true })
            .withMessage('City is required'),
        check('state')
            .exists({ checkFalsy: true })
            .withMessage('State is required'),
        check('country')
            .exists({ checkFalsy: true })
            .withMessage('Country is required'),
        check('lat')
            .exists({ checkFalsy: true })
            .isFloat({min: -90, max: 90})
            .withMessage('Latitude is not valid'),
        check('lng')
            .exists({ checkFalsy: true })
            .isFloat({min:-180, max: 180})
            .withMessage('Longitude is not valid'),
        check('name')
            .exists({ checkFalsy: true })
            .isLength({min: 0, max: 50})
            .withMessage('Name must be less than 50 characters'),
        check('description')
            .exists({ checkFalsy: true })
            .withMessage('Description is required'),
        check('price')
            .exists({ checkFalsy: true })
            .isFloat({ min: 0 })
            .withMessage('Price per day is required'),
        handleValidationErrors
    ]

router.post('/', requireAuth, validateNewSpot, async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    const { 
        address, 
        city, 
        state, 
        country, 
        lat, 
        lng, 
        name, 
        description, 
        price } = req.body;

    const newSpot = await Spot.create({
        ownerId: userId,
        address: address,
        city: city,
        state: state,
        country: country,
        lat: lat,
        lng: lng,
        name: name,
        description: description,
        price: price
    });

    res.statusCode = 201;
    return res.json(newSpot)

});

//newSection/ Create Image for a Spot

router.post('/:spotId/images', requireAuth, async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    
    const checkValidSpot = await Spot.findByPk(spotId);
    if (checkValidSpot === null) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;
        
        return next(error);
    }
    
    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (checkValidSpot.ownerId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    const { url, preview } = req.body;

    let spotImage = await SpotImage.create({
        spotId: spotId,
        imageUrl: url,
        preview: preview
    });

    delete spotImage.dataValues.spotId;
    delete spotImage.dataValues.createdAt;
    delete spotImage.dataValues.updatedAt;

    return res.json(spotImage);
});


//newSection/ Get all Spots of Current User

router.get('/current', requireAuth, async(req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    let userId = user.id;
    
    let userSpots = await Spot.findAll({
        where: {
            ownerId: userId
        },
        include: [
            {
                model: SpotImage,
                where: {
                    preview: true
                },
                attributes: ["imageUrl"]
            },
            {
                model: Review,
                attributes: ["stars"]
            }
        ]
    }) 

    userSpots = userSpots.map((userSpot)=> {
        let avgRating = 0;
        const jsonSpot = userSpot.toJSON();
        jsonSpot.Reviews.forEach((review)=> {
            avgRating += review.stars
        })
        avgRating = avgRating / jsonSpot.Reviews.length
        jsonSpot.avgRating = avgRating;
        delete jsonSpot.Reviews
        return jsonSpot
    })

    return res.json({Spots: userSpots});
})


//newSection/ Get Spot by Id

router.get('/:spotId', async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    let checkValidSpot = await Spot.findByPk(spotId, {
        include: [
            {
                model: SpotImage,
                attributes: {
                    include: ['id', 'imageUrl', 'preview'],
                    exclude: ['spotId', 'createdAt', 'updatedAt']
                }
            },
            {
                model: User,
                attributes: {
                    include: ['id', 'firstName', 'lastName'],
                    exclude: ['username', 'email', 'hashedPassword', 'createdAt', 'updatedAt']
                }
            },
            {
                model: Review,
                attributes: ['stars']
            }
        ]
    });

    //check exists
    if (checkValidSpot === null) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }


    //alias User as Owner
    checkValidSpot = checkValidSpot.toJSON();
    checkValidSpot.Owner = checkValidSpot.User
    delete checkValidSpot.User;

    //get Number of Reviews and avgStarRating
    checkValidSpot.numReviews = checkValidSpot.Reviews.length;

    let avgRating = 0;
    checkValidSpot.Reviews.forEach((review) => {
        avgRating += review.stars
    })
    avgRating = avgRating / checkValidSpot.Reviews.length;
    checkValidSpot.avgStarRating = avgRating;

    delete checkValidSpot.Reviews;

    return res.json(checkValidSpot);

})

//newSection/ Edit Spot by Id

router.put('/:spotId', requireAuth, validateNewSpot, async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);
    let { address, city, state, country, lat, lng, name, description, price } = req.body;

    let spotToEdit = await Spot.findByPk(spotId);

    //check exists
    if (spotToEdit === null) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (spotToEdit.ownerId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    await Spot.update({
        address: address,
        city: city,
        state: state,
        country: country,
        lat: lat,
        lng: lng,
        name: name,
        description: description,
        price: price
    },
    {
        where: {
            id: spotId
        }
    });

    spotToEdit = await Spot.findByPk(spotId);

    return res.json(spotToEdit);
})



//newSection/ Get all Spots

    //subSection/ Validate req.query
    const validateQuery = [
        check('page')
            .optional()
            .isInt({min: 1, max: 10})
            .withMessage("Page must be greater than or equal to 1"),
        check('size')
            .optional()
            .isInt({min: 1, max: 20})
            .withMessage("Size must be greater than or equal to 1"),
        check('minLat')
            .optional()
            .isFloat({min: -90, max: 90})
            .withMessage("Minimum latitude is invalid"),
        check('maxLat')
            .optional()
            .isFloat({min: -90, max: 90})
            .withMessage("Maximum latitude is invalid"),
        check('minLng')
            .optional()
            .isFloat({min: -180, max: 180})
            .withMessage("Minimum latitude is invalid"),
        check('maxLng')
            .optional()
            .isFloat({min: -180, max: 180})
            .withMessage("Maximum latitude is invalid"),
        check('minPrice')
            .optional()
            .isFloat({min: 0})
            .withMessage("Minimum price must be greater than or equal to 0"),
        check('maxPrice')
            .optional()
            .isFloat({min: 0})
            .withMessage("Maximum price must be greater than or equal to 0"),
        handleValidationErrors
    ]

router.get('/', validateQuery, async (req, res, next) => {

    let { page, size, minLat, maxLat, minLng, maxLng, minPrice, maxPrice } = req.query;

    const pagination = {};
    if (page) pagination.limit = parseInt(size);
    if (size) pagination.offset = parseInt(size) * (parseInt(page) - 1);

    const where = {};
    if (minLat && maxLat) {
        where.lat = { [Op.between]: [minLat, maxLat] };
    } else {
        if (minLat) where.lat = { [Op.gte]: parseInt(minLat) };
        if (maxLat) where.lat = { [Op.lte]: parseInt(maxLat) };
    }

    if (minLng && maxLng) {
        where.lng = { [Op.between]: [minLng, maxLng] };
    } else {
        if (minLng) where.lng = { [Op.gte]: parseInt(minLng) };
        if (maxLng) where.lng = { [Op.lte]: parseInt(maxLng) };
    }

    if (minPrice && maxPrice) {
        where.price = { [Op.between]: [minPrice, maxPrice] };
    } else {
        if (minPrice) where.price = { [Op.gte]: parseInt(minPrice) };
        if (maxPrice) where.price = { [Op.lte]: parseInt(maxPrice) };
    }

    let spots  = await Spot.findAll({
        where: where,
        include: [
        {
            model: SpotImage,
            where: {
                preview: true
            },
            attributes: ["imageUrl"]
        },
        {
            model: Review,
            attributes: ["stars"]
        }
    ],
    ...pagination
    });

    spots = spots.map((spot)=> {
        let avgRating = 0;
        const jsonSpot = spot.toJSON();
        jsonSpot.Reviews.forEach((review)=> {
            avgRating += review.stars
        })
        avgRating = avgRating / jsonSpot.Reviews.length
        jsonSpot.avgRating = avgRating;
        delete jsonSpot.Reviews
        return jsonSpot
    })


    return res.json(spots);
})

//newSection/ Get Reviews by Spot
router.get('/:spotId/reviews', async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);



    let spotReviews = await Review.findAll({
        where: {
            spotId: spotId
        },
        include:[
            {
            model: User,
            attributes: {
                exclude: ['username', 'email', 'hashedPassword', 'createdAt', 'updatedAt']
                }
            },
            {
                model: ReviewImage,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                }
            }
    ]
    })

    if (!spotReviews.length) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    return res.json({Reviews: spotReviews})
})

//newSection/ Create new Review


    //subSection/ Validate User Input
    const validateReview = [
        check('review')
            .exists({ checkFalsy: true })
            .withMessage("Review text is required"),
        check('stars')
            .exists({ checkFalsy: true })
            .isFloat({min: 1, max: 5})
            .withMessage("Stars must be an integer from 1 to 5"),
        handleValidationErrors
    ]

router.post("/:spotId/reviews", requireAuth, validateReview, async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    const { review, stars } = req.body;

    
    let validateSpot = await Spot.findByPk(spotId, {
        attributes: {
            include: ['id'],
            exclude: ['address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt']
        },
        include: {
            model: Review,
            attributes: {
                include: ['userId', 'stars'],
                exclude: ['createdAt', 'updatedAt']
            }
        }
    })



    //! invalid spotId
    if (validateSpot === null) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    validateSpot = validateSpot.toJSON()

    //! already reviewed
    if (validateSpot.Reviews.length) {
        const error = new Error();
        error.message = "User already has a review for this spot"

        return next(error)
    }
    
    console.log("########### ", validateSpot, " ############");


    let newReview = await Review.create({
        userId: userId,
        spotId: spotId,
        review: review,
        stars: stars
    })

    res.statusCode = 201;
    return res.json(newReview)

})


//newSection/ Create Booking using spotId
router.post('/:spotId/bookings', requireAuth, async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    let { spotId } = req.params;
    spotId = parseInt(spotId);

    let findSpot = await Spot.findByPk(spotId);
    if (!findSpot) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    if (findSpot.toJSON().ownerId === userId) {
        const error = new Error();
        error.errors = "Forbidden"
        error.message = "Cannot create a booking at your own Spot"
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
            spotId: spotId,
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

    if (bookingSpot) {
            const error = new Error();
            error.message = "Sorry, this spot is already booked for the specified dates";
            error.errors = [
                {startDate: "Start date conflicts with an existing booking"},
                {endDate: "End date conflicts with an existing booking"}
            ]
            error.status = 403

            return next(error)
    }

    let newBooking = await Booking.create({
        userId: userId,
        spotId: spotId,
        startDate: start,
        endDate: end
    });

    return res.json(newBooking);

})

//newSection/ Get all Bookings for spot by spotId
router.get('/:spotId/bookings', requireAuth, async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    let { user } = req;
    if (user) {
        user = user.toJSON();
        userId = user.id;
    }

    
    let getSpotBookings = await Booking.findAll({
        where: {
            spotId: spotId
        },
        include: [
            {
            model: User,
            attributes: {
                exclude: ['username', 'email', 'updatedAt', 'createdAt', 'hashedPassword']
                }
            },
            {
                model: Spot,
                attributes: {
                    exclude: ['id', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'description', 'price', 'createdAt', 'updatedAt']
                }
            }
        ]
    })

    if (!getSpotBookings.length) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    const spotBookings = []
    getSpotBookings.forEach((booking) => {
        let currBooking = booking.toJSON();
        spotBookings.push(currBooking)
    })

    const getBookingsNonOwner = [];
    if (userId !== spotBookings[0].Spot.ownerId) {
        spotBookings.forEach((booking) => {
            const genBookingInfo = {};
            genBookingInfo.spotId = booking.spotId;
            genBookingInfo.startDate = booking.startDate;
            genBookingInfo.endDate = booking.endDate;

            getBookingsNonOwner.push(genBookingInfo);
        })

        return res.json({Bookings: getBookingsNonOwner});
    }

    const getBookingsOwner = [];
    spotBookings.forEach((booking) => {
        delete booking.Spot;
        getBookingsOwner.push(booking);
    })

    return res.json({Bookings: getBookingsOwner});

})


//newSection/ Delete a Spot
router.delete('/:spotId', requireAuth, async (req, res, next) => {
    let {spotId} = req.params;
    spotId = parseInt(spotId);

    let spotToDelete = await Spot.findByPk(spotId);
    if (!spotToDelete) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (spotToDelete.ownerId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    await spotToDelete.destroy();

    return res.json({message: "Successfully deleted"});
})

module.exports = router;