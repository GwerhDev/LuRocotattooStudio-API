const express = require('express')
const router = express.Router()
const tattoosController = require('../controllers/tattoosController')
// let adminPassport = require('../config/adminPassport')
//const { nuevoTatuaje, eliminarTatuaje, todosTatuajes, tatuajeArtista, unTatuaje } = require('../controllers/tatuajeController')
//router.post('/', adminPassport.authenticate('jwt',{ session: false}), nuevoTatuaje)
//router.get('/', todosTatuajes)
//router.delete('/:id', adminPassport.authenticate('jwt',{ session: false}), eliminarTatuaje)
//router.get('/:id', unTatuaje)

router.get('/artista/:idArtist', tattoosController.getTattosByArtist)
router.post('/uploadmytattoos', tattoosController.uploadMyTattoos)
router.get('/getpendings', tattoosController.getPendingTattoos)
router.post('/accept', tattoosController.acceptTattoo)
router.get('/getjobs/:idArtist', tattoosController.getJobs)

module.exports = router