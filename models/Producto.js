const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    nombre: {type: String},
    imagen: {type: String},
    descripcion: {type: String},
    precio: {type: Number},
    stock: {type: Number}
})


const Producto = mongoose.model(
    'productos',
    schema
)

module.exports = Producto