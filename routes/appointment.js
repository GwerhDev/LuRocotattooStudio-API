const express = require('express')
const router = express.Router()
const appointmentsControllers = require('../controllers/appointmentsController')

router.post('/create', appointmentsControllers.createAppointment)
router.post('/getbymonth', appointmentsControllers.getAppointments)

module.exports = router