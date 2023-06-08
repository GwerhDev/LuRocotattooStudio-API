const passport = require('passport');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const {CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE} = process.env

passport.deserializeUser(function(user, done) {
  done(null, user);
  
});
passport.serializeUser((user, done) => {
  done(null, user);
});
  
passport.use(new GoogleStrategy({
    clientID: '965988115349-q7b96rcn93qltjvh91t322fr109t7k6r.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: `http://localhost:3000/auth/google/callback`,
  },
    function(accessToken, refreshToken, profile, done) {
       return done(null, { ...profile, accessToken });
  }
));


module.exports = passport