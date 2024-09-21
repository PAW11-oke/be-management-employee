const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require("crypto");
const User = require('../models/UserModels');
const sendEmail = require('../config/nodemailer');
const captcha = require('../config/captcha');
const { verifyCaptcha } = require('../config/captcha');

const signToken = (id) => { 
  return jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); 
};

exports.renderAuthForm = (req, res) => {
  const captchaUrl = captcha.generateCaptcha();
  res.type('html');
  res.end(`
    <h2>Authentication Test</h2>
    <h3>Manual Signup</h3>
    <img src="${captchaUrl}"/>
    <form action="/signup" method="post">
      <input type="email" name="email" placeholder="Email" required/>
      <input type="password" name="password" placeholder="Password" required/>
      <input type="text" name="captchaToken" placeholder="Enter captcha"/>
      <input type="submit" value="Signup"/>
    </form>

    <h3>Manual Login</h3>
    <form action="/login" method="post">
      <input type="email" name="email" placeholder="Email" required/>
      <input type="password" name="password" placeholder="Password" required/>
      <input type="text" name="captchaToken" placeholder="Enter captcha"/>
      <input type="submit" value="Login"/>
    </form>

    <h3>Google OAuth</h3>
    <a href="/auth/google">Login/Signup with Google</a>

    <h3>2FA Test</h3>
    <form action="/enable2fa" method="post">
      <input type="submit" value="Enable 2FA"/>
    </form>
  `);
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    newUser.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    await newUser.save({ validateBeforeSave: false });

    const verificationURL = `${req.protocol}://${req.get('host')}/user/verifyEmail/${verificationToken}`;
    const message = `Click on the following link to verify your email: ${verificationURL}`;

    await sendEmail({
      email: newUser.email,
      subject: 'Your email verification link',
      message,
    });

    res.status(201).json({
      status: 'success',
      message: 'Signup successful! Please verify your email.',
    });
  } catch (error) {
    console.error('Error during signup:', error);

    if (error.code === 11000) {  
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already registered!',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid data submitted during signup',
        error: error.message,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Error signing up user',
    });
  }
};

exports.login = async (req, res, next) => {
  const { email, password, captchaToken, twoFactorToken } = req.body;

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

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, passwordConfirm } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const loginToken = signToken(user._id);
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
      token: loginToken
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

exports.protectedRoute = (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Hello, ${req.user.name}`);
  } else {
    res.status(401).send('Unauthorized');
  }
};

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
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