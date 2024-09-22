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
    minlength: [8, "Password should be at least 8 characters long"],
    select: false,
  },
  googleId: { type: String, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
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

// Middleware untuk hashing password sebelum menyimpan
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method untuk membandingkan password
userSchema.methods.comparePasswordToDB = async function(password) {
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.createResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token berlaku selama 10 menit
  return resetToken;
}

userSchema.methods.isLocked = function() {
  return this.lockoutTime && this.lockoutTime > Date.now();
};


userSchema.methods.incrementLoginAttempts = async function() {
  this.loginAttempts += 1;
  await this.save({ validateBeforeSave: false }); // Ensure changes are saved
};


userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockoutTime = undefined;
};

module.exports = mongoose.model("User", userSchema);