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

router.get('/google', passport.authenticate('google-login', {
    scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
}))

router.get('/google/login/callback/', passport.authenticate('google-login', {
    successRedirect: `/auth/google/login/callback/success`,
    failureRedirect: '/auth/google/login/callback/failure'
}))

router.get('/google/login/callback/failure', async (req, res) => {
    return res.redirect(`http://localhost:3001/`);
})


router.get('/google/login/callback/success', async (req, res) => {
    if (!req.session.passport.user) {
        return res.status(500).json('Error del servidorrrrrrrrrrrrrrrr')
    }
    try {
        const user = await Usuario.findOneAndUpdate(
            { email: req.session.passport.user.emails[0]?.value },
            { token: req.session.passport.user.accessToken },
            { new: true }
        );
        console.log(user)
        if (user) {
            const payload = {
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                role: user.role,
                foto: user.foto,
                verified: user.verified,
                id: user._id
            };
            const tokenjwt = jwt.sign(payload, SECRET_KEY, { expiresIn: '3h' });
            return res.redirect(`http://localhost:3001/auth?token=${tokenjwt}`);
        } else {
            const newUser = new Usuario({
                nombre: req.session.passport.user.name.givenName,
                apellido: req.session.passport.user.name.familyName,
                email: req.session.passport.user.emails[0]?.value,
                registro: 'google',
                foto: req.session.passport.user.photos[0]?.value,
                role: req.session.passport.user.emails[0]?.value === 'lurocotattoostudio23@gmail.com' ? 'admin' : 'usuario',
                token: req.session.passport.user.accessToken,
                verified: 'true'
            });
            await newUser.save();
            const payload = {
                nombre: newUser.nombre,
                apellido: newUser.apellido,
                email: newUser.email,
                role: newUser.role,
                foto: newUser.foto,
                verified: newUser.verified,
                id: newUser._id
            };
            const tokenjwt = await jwt.sign(payload, SECRET_KEY, { expiresIn: '3h' });
            return res.redirect(`http://localhost:3001/auth?token=${tokenjwt}`);
        }
    } catch (error) {
        console.log(error)
        return res.status(500).redirect(`http://localhost:3001/`);
    }
})

router.post('/loginwithgoogle', userController.loginwithgoogle)

router.post('/signup', userController.signup)

router.get('/verifyemail/:code', userController.verifyemail)

router.post('/login', userController.login)

router.post('/updatephoto', userController.updateUserPhoto)

router.post('/getuserbytoken', userController.getUser)

module.exports = router