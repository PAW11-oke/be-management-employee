const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/UserControllers');

router.route('/signup').post(userController.signup);
router.route('/login').post(userController.login);
router.route('/forgotPassword').post(userController.forgotPassword);
router.route('/resetPassword/:token').patch(userController.resetPassword);

router.get('/protected', userController.protectedRoute);
router.get('/logout', userController.logout);''
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/protected');
    }
);

module.exports = router;