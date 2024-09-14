const User = require('../models/UserModels');
const asyncErrorHandler = require('../utils/AsyncErrorHandler');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');

const signToken = (id) => { 
  return jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); 
};

exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = new User.create(req.body);

  const token = signToken(newUser._id);

  req.status(201).json({
    status: 'success',
    token,
  });
});

exports.login = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new Error('Please provide email and password'));
  }

  const user = await User.findOne({ email }).select('+password');
  const token = signToken(user._id);

  req.status(200).json({
    status: 'success',
    token,
  });

  if (!user || !(await user.comparePasswordToDB(password, user.password))) {
    const error = new Error('Incorrect email or password');
    return next(error);
  }
});

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new Error('There is no user with that email address'));
  }

  const resetToken = user.createResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = "Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!";

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message: resetToken,
    });

    req.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch(error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new Error('There was an error sending the email. Try again later!'));
  }

});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {

});
