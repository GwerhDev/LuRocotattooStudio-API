var express = require('express');
var router = express.Router();
const productosRoutes = require('./producto')
const artistasRoutes = require('./artista')
//const usuariosRoutes = require('./usuarios')
const tatuajesRoutes = require('./tatuaje')
const carroRoutes = require('./carro')
const auth = require('./auth')
const appointment = require('./appointment')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'LUROCOTATTO'});
});

router.use('/productos', productosRoutes)
router.use('/artistas', artistasRoutes)
//router.use('/usuarios', usuariosRoutes)
router.use('/tatuajes', tatuajesRoutes)
router.use('/auth', auth)
router.use('/appointment', appointment)
router.use('/carro', carroRoutes)


module.exports = router;
