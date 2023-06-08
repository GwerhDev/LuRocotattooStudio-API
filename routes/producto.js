var express = require('express')
var router = express.Router()
// let adminPassport = require('../config/adminPassport')
// const {crearProducto, unProducto, eliminarProducto, productos} = require('../controllers/productoController')
//router.delete('/:id', adminPassport.authenticate('jwt',{ session: false}), eliminarProducto)
//router.post('/', adminPassport.authenticate('jwt',{ session: false}), crearProducto)
const productController = require('../controllers/productController')

router.get('/', productController.getProducts)
router.get('/:id', productController.getOneProduct)
router.post('/', productController.addProduct)
router.delete('/:id', productController.removeProduct)
router.put('/:productId', productController.editProduct)

module.exports = router