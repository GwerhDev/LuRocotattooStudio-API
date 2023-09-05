const mongoose = require("mongoose")

const usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: true, min: 3, max: 15},
    apellido: {type: String, required: true, min: 3, max: 15},
    email: {
        type: String,
        min: [4, 'El minimo de caracteres es 4'], 
        max: [32, 'El maximo de caracteres es 32'],
        unique: true,
        lowercase: true,
        required: true, 
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/]
        },
    password: {
        type: String,
        required: false
    },
    registro: {
        type: String,
        enum: ['google', 'email'],
        required: true,
        default: 'email'
    },
    foto: {type: String, required: true},
    from: [{type: String, required: true}],
    role: {type: String, required: true},
    verifytoken: {type: String, required: false},
    logged: {type: String, required: false},
    verified: {type: String, required: false},
    code: {type: String, required: false},
})

usuarioSchema.pre('save', function(next) {
    if (this.registro === 'email') {
      const error = new Error('Error de validación');
      if (!this.password) {
        error.message = 'La contraseña es requerida';
        return next(error);
      }
    }
    next();
  });

const ModeloUsuario = mongoose.model("usuarios", usuarioSchema);

module.exports = ModeloUsuario;