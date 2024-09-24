const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/UserModels'); 

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/user/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ $or: [{ email: profile.emails[0].value }, { googleId: profile.id }] });

        if (!user) {
            return done(null, false, { message: 'Please sign up manually.' });
        }

        if (!user.googleId && user.isVerified) {  
            user.googleId = profile.id;
            await user.save();
        }

        return done(null, user);  
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);  // Gunakan _id dari MongoDB
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log("Deserialize user:", id);  
        const user = await User.findById(id);  
        if (!user) {
            console.log("User not found");
            return done(null, false);
        }
        console.log("User found:", user); 
        done(null, user);
    } catch (err) {
        console.log("Error during deserialization:", err);  
        done(err, null);
    }
});
