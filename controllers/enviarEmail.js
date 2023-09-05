const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const { oauth2 } = require('googleapis/build/src/apis/oauth2')
const OAuth2 = google.auth.OAuth2
const htmlEmail = require('../views/htmlEmail')
const { CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE, REFRESH_TOKEN } = require('../config')


const enviarEmail = async (email, code) => {

    const client = new OAuth2(
        CLIENT_ID_GOOGLE,
        CLIENT_SECRET_GOOGLE,
        GOOGLE_URL
    )
    client.setCredentials({
        refresh_token: REFRESH_TOKEN
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
        //html: htmlEmail(email, code, "http://localhost:3000")
        text: `Por favor, haz clic en el siguiente enlace para verificar tu cuenta: http://localhost:3001/verificar?codigo=${code}`
    }
    await transport.sendMail(emailOptions, (error, response) => {
        if(error){
            console.log(error)
        } else {
            console.log("Email enviado a " + email)
        }
    })
}

module.exports = enviarEmail