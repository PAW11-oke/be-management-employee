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

    createSendResponse(user,201,res);
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

    if (user.isVerified !== true) {
      await sendVerificationEmail(user, req);
      return res.status(401).json({ message: 'Please verify your email before logging in. Check your inbox for a verification email.' });
    }

    const isPasswordCorrect = await user.comparePasswordToDB(password, user.password);

    if (user.isLocked()) {
      const lockoutEnd = new Date(user.VerificationExpires);
      const waitTime = Math.ceil((lockoutEnd - Date.now()) / 60000); 
      return res.status(423).json({ message: `Account locked. Try again in ${waitTime} minutes.` });
    }
    
    if (!isPasswordCorrect) {
      await user.incrementLoginAttempts();
      
      if (user.loginAttempts >= 3) {
        user.VerificationExpires = Date.now() + 10 * 60 * 1000; 
        await user.save({ validateBeforeSave: false }); 
        user.resetLoginAttempts();

        const lockoutEnd = new Date(user.VerificationExpires);
        const waitTime = Math.ceil((lockoutEnd - Date.now()) / 60000); 
        return res.status(423).json({ message: `Account locked. Try again in ${waitTime} minutes.` });      }
    
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
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Email not verified. Please verify your email first.' });
    }

    await emailVerify(user, req, 'forgotPassword');

    user.password = password; 
    await user.save(); 

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent for password reset!',
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ message: 'There was an error sending the email. Try again later!' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    console.log(token)

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() + 10 * 60 * 1000 }
    });
    console.log(hashedToken)

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
  const token = signToken(req.user._id);
  res.status(200).json({
    status: 'success',
    message: 'Login successful with Google',
    token,
    user: {
      name: req.user.name,
      email: req.user.email,
      googleId: req.user.googleId,
    },
    greeting: `Hello, ${req.user.name}`,
  });
};


exports.logout = (req, res) => {
  try {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000), // Token expires after 10 seconds
      httpOnly: true
    });

    res.status(200).json({
      status: 'success',
      message: 'User logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error logging out',
      error: error.message
    });
  }
};


exports.googleOAuthLogin = (req, res, next) => {
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
};

exports.googleOAuthCallback = (req, res, next) => {
  passport.authenticate('google', { failureRedirect: '/login' }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Google authentication failed. Please try again.' 
      });
    }
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

exports.getProtectedData = async (req, res) => {
  res.json({
    message: 'This is protected data',
    user: req.user,
  });
};

exports.deleteUser = async (req, res) => {
  try {
    // Update user to set 'active' to false instead of deleting
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      message: 'User deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const options  = {
    maxAge: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    secure: true,
    httpOnly: true,
  };
  res.cookie('jwt', token, options);

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    },
  });
}