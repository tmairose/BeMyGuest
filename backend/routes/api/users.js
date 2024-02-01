
const express = require('express');
const bcrypt = require('bcryptjs');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, requireAuth } = require('../../utils/auth');
const { User } = require('../../db/models');

const router = express.Router();

//newSection/ Sign Up


    //subSection/ Validate Signup
    const validateSignup = [
        check('email')
            .exists({ checkFalsy: true })
            .isEmail()
            .withMessage('Invalid email.'),
        check('username')
            .exists({ checkFalsy: true })
            .isLength({ min: 4 })
            .withMessage('Username is required'),
        check('username')
            .not()
            .isEmail()
            .withMessage('Username cannot be an email.'),
        check('password')
            .exists({ checkFalsy: true })
            .isLength({ min: 6 })
            // .withMessage('Password must be 6 characters or more.')
            ,
        check('firstName')
            .exists({ checkFalsy: true })
            .isAlpha()
            .withMessage('First Name is required'),
        check('lastName')
            .exists({ checkFalsy: true})
            .isAlpha()
            .withMessage('Last Name is required'),
        handleValidationErrors
    ];

router.post('/', validateSignup, async (req, res, next) => {
    const { email, password, username, firstName, lastName } = req.body;
    const hashedPassword = bcrypt.hashSync(password);
    let user;
    try {
        user = await User.create({ email, username, hashedPassword, firstName, lastName });    
    } catch (err) {
        // console.log("---CAUGHT ERROR:--- ", err.errors[0].path);
        const error = new Error();
        error.errors = {};
        error.message = "User already exists";
        error.status = 500;

        if (err.errors[0].path === 'username') {
            error.errors.username = "User with that username already exists"
        } else if (err.errors[0].path === 'email') {
            error.errors.email = "User with that email already exists"
        }

        return next(error);
    }

    const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
    };

    await setTokenCookie(res, safeUser);

    return res.json({
        user: safeUser
    });
});





module.exports = router;