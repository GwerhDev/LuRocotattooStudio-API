const passport = require('passport');
const { CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE } = require('../config');
require('dotenv').config();
const GoogleStrategy = require('passport-google-oauth20').Strategy;
  
passport.use('google-login',
  new GoogleStrategy(
    {
      clientID: CLIENT_ID_GOOGLE,
      clientSecret: CLIENT_SECRET_GOOGLE,
      callbackURL: `/auth/google/login/callback`,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/plus.me'
      ],
      accessType: 'offline'
    }, function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        try {
          const googleData = {
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0].value,
            accessToken: accessToken,
          }
          return done(null, googleData);
        } catch (err) {
          return done(err);
        }
      });
    }
  )
);

passport.use('google-signup',
  new GoogleStrategy(
    {
      clientID: CLIENT_ID_GOOGLE,
      clientSecret: CLIENT_SECRET_GOOGLE,
      callbackURL: `/auth/google/signup/callback`,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/plus.me'
      ],
      accessType: 'offline'
    }, function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        try {
          const userData = {
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0].value,
            accessToken: innerToken,
          }
          return done(null, userData);
        } catch (err) {
          return done(err);
        }
      });
    }
  )
);

passport.deserializeUser(function(user, done) {
  done(null, user);
  
});
passport.serializeUser((user, done) => {
  done(null, user);
});

module.exports = passport