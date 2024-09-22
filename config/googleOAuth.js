const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/UserModels');
const { signToken } = require('./jwt'); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/user/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.emails[0].value }] });

        if (!user) {
            return res.redirect('/signup');
        }

        if (!user.googleId) {
            user.googleId = profile.id;
            await user.save();
        }

        const token = signToken(user._id);
        return done(null, { user, token });
    } catch (err) {
        return done(err, null); 
    }
}));

passport.serializeUser((userData, done) => {
    done(null, userData); 
});

passport.deserializeUser(async (userData, done) => {
    try {
        const user = await User.findById(userData.user._id); 
        done(null, { user, token: userData.token }); 
    } catch (err) {
        done(err, null); 
    }
});