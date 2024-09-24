const express = require('express');
const router = express.Router();
const passport = require('passport');
const userController = require('../controllers/UserControllers');
const protect = require('../middlewares/protect');

router.route('/signup').post(userController.signup);
router.route('/login').post(userController.login);

router.route('/forgotPassword').post(userController.forgotPassword);
router.route('/resetPassword/:token').patch(userController.resetPassword);
router.route('/verifyEmail/:token').get(userController.verifyEmail);
router.get('/protected', protect, userController.getProtectedData);

router.get('/dashboard', userController.protectedRoute);
router.get('/logout', userController.logout);
router.route('/delete').delete(userController.deleteUser);

router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/user/dashboard'); 
    }
);

module.exports = router;