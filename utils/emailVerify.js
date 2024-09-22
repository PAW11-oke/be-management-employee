const crypto = require('crypto');
const User = require('../models/UserModels');
const sendEmail = require('../config/nodemailer');

const sendEmailWithType = async (user, req, type) => {
  let subject, message;

  switch (type) {
    case 'verification':
      const verificationToken = crypto.randomBytes(32).toString('hex');
      user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
      await user.save({ validateBeforeSave: false });

      const verificationURL = `${req.protocol}://${req.get('host')}/user/verifyEmail/${verificationToken}`;
      subject = 'Your email verification link';
      message = `Click on the following link to verify your email: ${verificationURL}`;
      break;

    case 'forgotPassword':
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      await user.save({ validateBeforeSave: false });

      const resetURL = `${req.protocol}://${req.get('host')}/user/resetPassword/${resetToken}`;
      subject = 'Your password reset link';
      message = `Click on the following link to reset your password: ${resetURL}`;
      break;
      
    default:
      throw new Error('Invalid email type');
  }

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

exports.sendVerificationEmail = async (user, req) => {
  await sendEmailWithType(user, req, 'verification');
};

exports.sendForgotPasswordEmail = async (user, req) => {
  await sendEmailWithType(user, req, 'forgotPassword');
};

exports.verifyEmail = async (req, res, next) => {
    try {
      const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
      console.log("Token received from URL:", req.params.token); // Log token from URL
      console.log("Hashed token:", hashedToken); // Log hashed token
  
      const user = await User.findOne({ emailVerificationToken: hashedToken });
      console.log("User found:", user); // Log the user object
  
      if (!user) {
        return res.status(400).json({ message: 'Token is invalid or expired' });
      }
  
      user.isVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error("Error verifying email:", error); // Log the error
      res.status(500).json({ message: 'Error verifying email' });
    }
};
  