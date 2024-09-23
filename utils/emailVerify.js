const crypto = require('crypto');
const User = require('../models/UserModels');
const sendEmail = require('../config/nodemailer');

const emailVerify = async (user, req, type) => {
  let subject, message, tokenField, tokenExpiryField;

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

  switch (type) {
    case 'signup':
      tokenField = 'VerificationToken';
      tokenExpiryField = 'VerificationExpires';
      subject = 'Please verify your email';
      message = `Click on the following link to verify your email: ${req.protocol}://${req.get('host')}/user/verifyEmail/${verificationToken}`;
      break;

    case 'forgotPassword':
      tokenField = 'VerificationToken';
      tokenExpiryField = 'VerificationExpires';
      subject = 'Password Reset Request';
      message = `Click on the following link to reset your password: ${req.protocol}://${req.get('host')}/user/resetPassword/${verificationToken}`;
      break;

    default:
      throw new Error('Invalid email verification type');
  }

  user[tokenField] = hashedToken;
  user[tokenExpiryField] = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user.email,
    subject,
    message,
  });
};

module.exports = emailVerify;