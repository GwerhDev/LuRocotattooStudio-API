const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    nombre: {type: String},
    imagen: {type: String},
    descripcion: {type: String},
    horarioslaborales: {type: Array},
    pendingTattoosFolderId: {type: String},
    tattoosFolderId: {type: String}
})

const Artista = mongoose.model(
    'artistas',
    schema
)

module.exports = Artista