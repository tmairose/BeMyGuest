
const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotsRouter = require('./spots.js');
const reviewsRouter = require('./reviews.js');
const bookingsRouter = require('./bookings.js');
const reviewImagesRouter = require('./reviewImages.js');
const spotImagesRouter = require('./spotImage.js');
const { restoreUser } = require('../../utils/auth.js');
const { setTokenCookie } = require('../../utils/auth.js');
const { requireAuth } = require('../../utils/auth.js');
const { User } = require('../../db/models');

router.use(restoreUser);
router.use('/session', sessionRouter);
router.use('/users', usersRouter);
router.use('/spots', spotsRouter);
router.use('/reviews', reviewsRouter);
router.use('/bookings', bookingsRouter);
router.use('/review-images', reviewImagesRouter);
router.use('/spot-images', spotImagesRouter);


router.get('/restore-user', (req, res) => {
    return res.json(req.user);
});

router.get('/require-auth', (req, res) => {
    return res.json(req.user);
});

//Info/ For Testing
// router.get('/set-token-cookie', async (_req, res) => {
//     const user = await User.findOne({
//         where: {
//             username: 'Demo-lition'
//         }
//     });
//     setTokenCookie(res, user);
//     return res.json({ user: user });
// });


router.post('/test', function(req, res) {
    res.json({ requestBody: req.body });
});


module.exports = router;