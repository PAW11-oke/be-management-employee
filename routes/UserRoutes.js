const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserControllers');


router.route('/signup').post(userController.signup);
router.route('/login').post(userController.login);
router.route('/forgotPassword').post(userController.forgotPassword);
router.route('/resetPassword/:token').patch(userController.resetPassword);

module.exports = router;