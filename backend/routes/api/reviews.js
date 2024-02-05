const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { Spot, User, Review, ReviewImage, SpotImage, Booking } = require('../../db/models');

const router = express.Router();

//newSection/ Get Reviews of Current User
router.get('/current', requireAuth, async (req, res, next) => {
    let { user } = req;
    user = user.toJSON();
    let userId = user.id;

    let userReviews = await Review.findAll({
        where: {
            userId: userId
        },
        include: [
            {
                model: User,
                attributes: {
                    exclude: ['username', 'email', 'hashedPassword', 'createdAt', 'updatedAt']
                }
            },
            {
                model: Spot,
                attributes: {
                    exclude: ['createdAt', 'updatedAt']
                },
                include: {
                    model: SpotImage,
                    attributes: {
                        exclude: ['id', 'spotId', 'preview', 'createdAt', 'updatedAt']
                    },
                    where: {
                        preview: true
                    }
                }
            },
            {
                model: ReviewImage,
                attributes: {
                    exclude: ['reviewId', 'createdAt', 'updatedAt']
                }
            }
        ]
    })

    return res.json(userReviews);
})



//newSection/ Create Image for a Review
router.post('/:reviewId/images', requireAuth, async (req, res, next) => {
    let { reviewId } = req.params;
    reviewId = parseInt(reviewId);

    let { url } = req.body;

    //! check if Review exists
    let review = await Review.findByPk(reviewId, {
        include: {
            model: ReviewImage
        }
    });
    
    if (review === null) {
        const error = new Error();
        error.message = "Review couldn't be found"
        error.status = 404;
        
        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (review.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }
    
    //! Max Review Images = 10
    review = review.toJSON();
    if (review.ReviewImages.length >= 10) {
        const error = new Error();
        error.message = "Maximum number of images for this resource was reached";
        error.status = 403;

        return next(error);
    }

    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@", review);

    let newImage = await ReviewImage.create({
        reviewId: reviewId,
        imageUrl: url
    })

    newImage = newImage.toJSON();
    delete newImage.reviewId;
    delete newImage.createdAt;
    delete newImage.updatedAt;
    
    return res.json(newImage);
})


//newSection/ Edit a Review

    //subSection/ Validate Review
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

router.put('/:reviewId', requireAuth, validateReview, async (req, res, next) => {
    let { reviewId } = req.params;
    reviewId = parseInt(reviewId);

    let { review, stars } = req.body;

    let findReview = await Review.findByPk(reviewId);
    if (findReview === null) {
        const error = new Error();
        error.message = "Review couldn't be found"
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (findReview.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    // findReview = findReview.toJSON();

    await Review.update({
        review: review,
        stars: stars
    },
    {
        where: {
            id: reviewId
        }
    })

    findReview = await Review.findByPk(reviewId);

    return res.json(findReview)

})

//newSection/ Delete a Review
router.delete('/:reviewId', requireAuth, async (req, res, next) => {
    let { reviewId } = req.params;
    reviewId = parseInt(reviewId);

    let reviewToDelete = await Review.findByPk(reviewId);
    if (!reviewToDelete) {
        const error = new Error();
        error.message = "Review couldn't be found"
        error.status = 404;

        return next(error);
    }

    //make sure User is also owner
    let { user } = req;
    user = user.toJSON();
    const userId = user.id;
    if (reviewToDelete.userId !== userId) {
        const error = new Error();
        error.message = "Forbidden"
        error.status = 403;

        return next(error);
    }

    await reviewToDelete.destroy();

    return res.json({message: "Successfully deleted"});
})




module.exports = router;