const passport = require('passport');
const crypto = require("crypto");
const User = require('../models/UserModels');
const emailVerify = require('../utils/emailVerify');
const { signToken } = require('../config/jwt');

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (password.trim() !== confirmPassword.trim()) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.create({
      name,
      email,
      password, 
    });

    await emailVerify(user, req, 'signup');

    if(!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before register. Check your inbox for a verification email.' });
    }

    const token = signToken(newUser._id); 

    res.status(201).json({
      status: 'success',
      message: 'Signup successful! Please verify your email.',
      token, 
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,        
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password +isVerified');

    if (!user.isVerified) {
      await sendVerificationEmail(user, req);
      return res.status(401).json({ message: 'Please verify your email before logging in. Check your inbox for a verification email.' });
    }

    const isPasswordCorrect = await user.comparePasswordToDB(password, user.password);

    if (user.isLocked()) {
      const lockoutEnd = new Date(user.lockoutTime);
      const waitTime = Math.ceil((lockoutEnd - Date.now()) / 60000); 
      return res.status(423).json({ message: `Account locked. Try again in ${waitTime} minute(s).` });
    }
    
    if (!isPasswordCorrect) {
      await user.incrementLoginAttempts();
      
      if (user.loginAttempts >= 3) {
        user.lockoutTime = Date.now() + 1 * 60 * 1000; 
        await user.save({ validateBeforeSave: false }); 
        user.resetLoginAttempts();
        const waitTime = Math.ceil((lockoutEnd - Date.now()) / 60000); 
        return res.status(423).json({ message: `Account locked. Try again in ${waitTime} minute(s).` });      }
    
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    user.resetLoginAttempts();

    if (!user.isVerified) {
      user.isVerified = true; 
    }

    await user.save({ validateBeforeSave: false });

    res.cookie('trustedDevice', true, {
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      httpOnly: true,
    });

    const token = signToken(user._id);

    res.status(200).json({
      password: password,
      status: 'success',
      token,
      message: 'Login successful and email verified!',
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login',
    });
  }
};

exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(404).json({ message: 'No user found with that email' });
  }

  if (!user.isVerified) {
    return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
  }

  await emailVerify(user, req, 'forgotPassword');

  try {
    await sendForgotPasswordEmail(user, req);
    res.status(200).json({
      status: 'success',
      message: 'Verification email sent for password reset!',
    });
  } catch (error) {
    return next(new Error('There was an error sending the email. Try again later!'));
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired please reload login' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    user.password = password; 
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
    res.status(200).json({
      status: 'success',
      message: 'Login successful with Google',
      tokenJWT: token,
      user: {
        name: user.name,
        email: user.email,
        googleId: user.googleId,
      },
    });
    res.status(200).json(`Hello, ${req.user.name}`);
  } else {
    res.status(401).send('Unauthorized');
  }
};

exports.logout = (req, res) => {
  req.logout();
  res.redirect('/');
};

exports.googleOAuthLogin = (req, res, next) => {
  passport.authenticate('google', { scope: ['email', 'profile'] })(req, res, next);
};

exports.googleOAuthCallback = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login' }, async (err, user) => {
    if (err) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Google authentication failed. Please try again.' 
      });
    }

    const token = signToken(user._id);

  })(req, res, next);
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      VerificationToken: hashedToken,
      VerificationExpires: { $gt: Date.now()} // Pastikan token belum kedaluwarsa
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or expired' });
    }

    user.isVerified = true;
    user.VerificationToken = undefined;
    user.VerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email' });
  }
};