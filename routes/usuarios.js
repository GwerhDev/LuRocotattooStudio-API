const express = require('express');
const router = express.Router();
let passport = require('../config/passport')
let adminPassport = require('../config/adminPassport')
const { registrarse, iniciarSesion, cerrarSesion, unUsuario, usuarios, editarUsuario, eliminarUsuario, verificarToken, verificarMail } = require('../controllers/usuarioController')

router.get('/', usuarios);
router.put('/', passport.authenticate('jwt', {session:false}), editarUsuario);
router.post('/registrarse', registrarse);
router.get('/token', passport.authenticate('jwt', {session:false}), verificarToken);
router.post('/iniciarsesion', iniciarSesion);
router.post('/cerrarsesion', cerrarSesion);
router.get('/:id', unUsuario);
router.delete('/:id', adminPassport.authenticate('jwt', {session:false}), eliminarUsuario);
router.get('/acc/:code', verificarMail)


module.exports = router;