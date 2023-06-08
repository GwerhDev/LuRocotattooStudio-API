const Usuario = require('../models/Usuario')
const express = require('express')
const session = require('express-session');
const router = express.Router();
const userController = require('../controllers/userController')
router.use(session({
    secret: 'dsfasdfaergfeqgvdcv',
    resave: false,
    saveUninitialized: false
}));
require('../config/passport2')
const passport = require('passport')

router.use(passport.initialize())
router.use(passport.session());

router.get('/google', passport.authenticate('google', {
    scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
}))
router.get('/google/callback', passport.authenticate('google', {
    successRedirect: `http://localhost:3000/auth/callback/success`,
    failureRedirect: 'http://localhost:3000/auth/callback/failure'
}))

router.get('/callback/success', async (req, res) => {
    if (!req.user) {
        // res.redirect(`/callback/failure`);
        return res.status(500).json('Error del servidor ')
    }

    console.log(req.user)

    const accessToken = req.user.accessToken;

    await Usuario.findOneAndUpdate({ email: req.user.emails[0].value }, { token: req.user.accessToken }, { new: true })
        .then(user => {
            if (user) {
                // User updated successfully, updated user object returned
                return res.redirect(`http://localhost:3001/auth?token=${accessToken}`)
            } else {
                // User not found or not updated
                const user = new Usuario({
                    nombre: req.user.name.givenName,
                    apellido: req.user.name.familyName,
                    email: req.user.emails[0].value,
                    registro: 'google',
                    foto: req.user.photos[0].value,
                    role: req.user.emails[0].value === 'lurocotattoostudio23@gmail.com' ? 'admin' : 'usuario',
                    token: req.user.accessToken,
                    verified: 'true'
                });

                user.save()
                    .then(savedUser => {
                        return res.redirect(`http://localhost:3001/auth?token=${accessToken}`)
                    })
                    .catch(error => {
                        return res.status(500).json('Error del servidor ', error)
                    });
            }
        })
        .catch(error => {
            return res.status(500).json('Error del servidor ', error)
        });

});

router.post('/loginwithgoogle', userController.loginwithgoogle)

router.post('/signup', userController.signup)

router.get('/verifyemail/:code', userController.verifyemail)

router.post('/login', userController.login)

router.post('/updatephoto', userController.updateUserPhoto)

module.exports = router