const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const { oauth2 } = require('googleapis/build/src/apis/oauth2')
const OAuth2 = google.auth.OAuth2
const htmlEmail = require('../views/htmlEmail')

const {
    GOOGLE_ID_CLIENT,
    GOOGLE_SECRET,
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_URL,
    GOOGLE_USER
} = process.env

const verificarEmail = async (email, code) => {

    const client = new OAuth2(
        GOOGLE_ID_CLIENT,
        GOOGLE_SECRET,
        GOOGLE_URL
    )
    client.setCredentials({
        refresh_token: GOOGLE_REFRESH_TOKEN
    })
    const accessToken = client.getAccessToken()
    const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: GOOGLE_USER,
            type: "OAuth2",
            clientId: GOOGLE_ID_CLIENT,
            clientSecret: GOOGLE_SECRET,
            refreshToken: GOOGLE_REFRESH_TOKEN,
            accessToken: accessToken
        },
        tls: {
            rejectUnauthorized: false
        }
    })
    const emailOptions = {
        from: GOOGLE_USER,
        to: email,
        subject: "Verificación de cuenta de Email de nuevo Usuario.",
        html: htmlEmail(email, code, "http://localhost:3000")
    }
    await transport.sendMail(emailOptions, (error, response) => {
        if(error){
            console.log(error)
        } else {
            console.log("Email enviado a " + email)
        }
    })
}

module.exports = verificarEmail