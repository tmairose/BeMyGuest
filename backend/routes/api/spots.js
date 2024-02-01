const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, SpotImage, Booking } = require('../../db/models');

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

router.post('/',validateNewSpot, async (req, res, next) => {
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

    return res.json(newSpot)

});

//newSection/ Create Image for a Spot

router.post('/:spotId/images', async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    const checkValidSpot = await Spot.findByPk(spotId);
    if (checkValidSpot === null) {
        const error = new Error();
        error.message = "Spot couldn't be found"
        error.status = 404;

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

router.get('/current', async(req, res, next) => {
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

    return res.json(userSpots);
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

router.put('/:spotId', validateNewSpot, async (req, res, next) => {
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

    return res.json(spotToEdit);

})



//newSection/ Get all Spots

router.get('/', async (req, res, next) => {

    let spots  = await Spot.findAll({
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
    });

    //console.log(spots[0].Reviews[0].dataValues.stars)

    //For each Spot =>
    //  For Each Review =>
    //      AvgRating += dataValues.stars

    //! Probably need protections against having no reviews at a spot

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

//newSection/ Create new Review
router.post("/:spotId/reviews", async (req, res, next) => {
    let { spotId } = req.params;
    spotId = parseInt(spotId);

    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    const { review, stars } = req.body;

    let spotReviews = await Review.findAll({
        where: {
            [Op.and]: {
                userId: userId,
                spotId: spotId
            }
        }
    })
    
    
    //check user already reviewed
    if (spotReviews.length >= 1) {
        const error = new Error();
        error.message = "User has already reviewed this spot"
        error.status = 404;

        return next(error);
    }


    let newReview = await Review.create({
        userId: userId,
        spotId: spotId,
        review: review,
        stars: stars
    })

    newReview = newReview.toJSON();

    console.log("################## ", newReview, " ##########################");


    // return res.json(newReview);
})


module.exports = router;