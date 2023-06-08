const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    artist: {type: String},
    client: {type: String},
    email: {type: String},
    phone: {type: String},
    description: {type: String},
    date: {type: Date},
    hour: {type: Array},
    accepted: {type: Boolean}
})

const Appointment = mongoose.model(
    'appointment',
    schema
)

module.exports = Appointment