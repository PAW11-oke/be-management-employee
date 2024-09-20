const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Please enter your name"],
  },
  email: { 
    type: String, 
    required: [true, "Please enter your email"], 
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"],
  },
  password: { 
    type: String, 
    required: [true, "Please enter your password"],
    minlength: [8, "Password should be at least 8 characters long"],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same",
    },
  },
  googleId: { type: String, default: null },
  twoFactorSecret: { type: String, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
  isTwoFactorEnabled: { type: Boolean, default: false },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockoutTime: Date, 

  isVerified: {
    type: Boolean,
    default: false, 
  },
  emailVerificationToken: String,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined; // Remove confirmPassword field before saving
  next();
});

// Method to compare user password with database password
userSchema.methods.comparePasswordToDB = async function(password, passwordDB) {
  return await bcrypt.compare(password, passwordDB);
}

// Method to check if password was changed after JWT was issued
userSchema.methods.isPasswordChanged = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    console.log(this.passwordChangedAt, JWTTimestamp);
  }
  return false;
}

// Method to create password reset token
userSchema.methods.createResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

  console.log(resetToken, this.passwordResetToken);

  return resetToken;
}

// Check if user is locked due to too many login attempts
userSchema.methods.isLocked = function () {
  return this.lockoutTime && this.lockoutTime > Date.now();
};

// Increment login attempts counter
userSchema.methods.incrementLoginAttempts = function () {
  this.loginAttempts += 1;
};

// Reset login attempts after successful login
userSchema.methods.resetLoginAttempts = function () {
  this.loginAttempts = 0;
  this.lockoutTime = undefined;
};

module.exports = mongoose.model("User", userSchema);