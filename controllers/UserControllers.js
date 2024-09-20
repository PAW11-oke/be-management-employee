const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require("crypto");
const User = require('../models/UserModels');
const sendEmail = require('../config/nodemailer');
const { verifyCaptcha } = require('../config/captcha');
const bcrypt = require('bcryptjs');

const signToken = (id) => { 
  return jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); 
};

exports.signup = async (req, res, next) => {
  try {
    // 1. Buat user baru
    const newUser = await User.create(req.body);

    // 2. Buat token verifikasi email
    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await newUser.save({ validateBeforeSave: false });

    // 3. Kirim email verifikasi
    const verificationURL = `${req.protocol}://${req.get('host')}/api/v1/auth/verifyEmail/${verificationToken}`;
    const message = `Click on the following link to verify your email: ${verificationURL}`;

    await sendEmail({
      email: newUser.email,
      subject: 'Your email verification link',
      message,
    });

    // 4. Berikan response sukses
    res.status(201).json({
      status: 'success',
      message: 'Signup successful! Please verify your email.',
    });
  } catch (error) {
    // Menampilkan lebih banyak detail error
    console.error('Error during signup:', error);

    // Menambahkan penanganan error khusus untuk kasus-kasus umum
    if (error.code === 11000) {  // Error untuk duplicate key (misal, email sudah terdaftar)
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already registered!',
      });
    }

    // Jika error berasal dari validasi Mongoose
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid data submitted during signup',
        error: error.message,
      });
    }

    // Default error handler
    res.status(500).json({
      status: 'error',
      message: 'Error signing up user',
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password, captchaToken, twoFactorToken } = req.body;

  // Memanggil middleware verifyCaptcha sebelum melanjutkan
  if (!req.cookies.trustedDevice) {
    if (!captchaToken) {
      return res.status(400).json({ message: 'Captcha is required' });
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      return res.status(400).json({ message: 'Invalid captcha' });
    }
  }

  const user = await User.findOne({ email }).select('+password +isTwoFactorEnabled +twoFactorSecret');

  if (!user) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }

  if (user.isLocked()) {
    const lockoutEnd = new Date(user.lockoutTime);
    const waitTime = Math.ceil((lockoutEnd - Date.now()) / 60000);

    return res.status(423).json({
      message: `Too many failed login attempts. Please try again after ${waitTime} minute(s).`
    });
  }

  const isPasswordCorrect = await user.comparePasswordToDB(password, user.password);
  if (!isPasswordCorrect) {
    user.incrementLoginAttempts();

    if (user.loginAttempts >= 3) {
      user.lockoutTime = Date.now() + 10 * 60 * 1000;
      await user.save({ validateBeforeSave: false });

      return res.status(423).json({
        message: 'Too many failed login attempts. Please try again in 10 minutes.'
      });
    }

    await user.save({ validateBeforeSave: false });

    return res.status(401).json({ message: 'Incorrect email or password' });
  }

  user.resetLoginAttempts();
  await user.save({ validateBeforeSave: false });

  // Set cookie for trusted device
  res.cookie('trustedDevice', true, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });

  // Generate token for successful login
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
  });
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new Error('There is no user with that email address'));
  }

  const resetToken = user.createResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}. If you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new Error('There was an error sending the email. Try again later!'));
  }
};

exports.resetPassword = async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new Error('User not found'));
  }

  if (!(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ status: 'fail', message: 'Passwords do not match' });
  }

  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully!',
  });
};

exports.googleOAuthLogin = (req, res, next) => {
  if (req.cookies && req.cookies.authCookie) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  } else {
    const captchaToken = req.body.captchaToken; 
    verifyCaptcha(captchaToken)
      .then(isValid => {
        if (isValid) {
          passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
        } else {
          return res.status(400).json({ status: 'fail', message: 'Invalid captcha' });
        }
      })
      .catch(error => {
        return res.status(500).json({ status: 'fail', message: 'Captcha verification failed', error });
      });
  }
};

exports.googleOAuthCallback = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ status: 'fail', message: 'Google authentication failed' });
    }
    const token = signToken(user._id);
    res.status(200).json({ status: 'success', token });
  })(req, res, next);
};