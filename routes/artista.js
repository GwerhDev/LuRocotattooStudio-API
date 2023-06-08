var express = require('express');
var router = express.Router();
const artistsControllers = require('../controllers/artistController');
//let adminPassport = require('../config/adminPassport')
//const { todosArtistas, unArtista, agregarArtista, editarArtista, eliminarArtista } = require('../controllers/artistaController')


//router.post('/', adminPassport.authenticate('jwt',{ session: false}), agregarArtista)

//router.put('/:id', adminPassport.authenticate('jwt',{ session: false}), editarArtista)
//router.delete('/:id', adminPassport.authenticate('jwt',{ session: false}), eliminarArtista)

router.get('/', artistsControllers.allArtists)
router.get('/:id', artistsControllers.oneArtist)
router.post('/newartist', artistsControllers.addNewArtist)
router.delete('/:artistId', artistsControllers.removeArtist)
router.put('/:artistId', artistsControllers.editArtist)

module.exports = router