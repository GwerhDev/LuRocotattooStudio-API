const Appointment = require("../models/Appointment");

const createAppointment = async (req, res) => {
    const { artist, hour, date, client, email, phone, description, accepted } = req.body;
    try {
        if (artist, hour, date, client, email, phone, accepted !== null) {
            const appointment = new Appointment({ artist, hour, date, client, email, phone, description, accepted });
            await appointment.save();
            return res.status(200).json(appointment);
        }
    } catch (error) {
        console.log(error)
        return res.status(400).json({ msg: 'Error al agendar turno.' })
    }
}

const getAppointments = async (req, res) => {
    const { month } = req.body
    console.log(req.body)
    try {
        const appointments = await Appointment.find({
            $expr: {
                $eq: [{ $month: "$date" }, parseInt(month)]
            }
        });
        console.log(appointments);
        return res.status(200).json(appointments);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    createAppointment,
    getAppointments
}