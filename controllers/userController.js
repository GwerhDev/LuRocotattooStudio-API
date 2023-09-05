const Usuario = require('../models/Usuario')
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const jwt = require('jsonwebtoken');
const { CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE, REFRESH_TOKEN } = require('../config');
const { createToken, decodeToken } = require('../integrations/jwt');
require('dotenv').config()

const oauth2Client = new OAuth2(
    CLIENT_ID_GOOGLE,
    CLIENT_SECRET_GOOGLE,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
});

async function refreshAccessTokenIfNeeded() {
    const { expiry_date } = oauth2Client.credentials;
  
    // If the access token has expired or will expire in the next minute
    if (expiry_date && expiry_date <= Date.now() + 60 * 1000) {
      try {
        const token = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials({ access_token: token.credentials.access_token });
        console.log('Tokens renovados correctamente');
      } catch (error) {
        console.error('Error al renovar los tokens:', error);
      }
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: 'lurocotattoostudio23@gmail.com',
        clientId: CLIENT_ID_GOOGLE,
        clientSecret: CLIENT_SECRET_GOOGLE,
        refreshToken: REFRESH_TOKEN,
        accessToken: oauth2Client.getAccessToken(),
        expires: 1484314697598
    }
});

async function sendEmail(recipe, code) {
    try {
        const mailOptions = {
            from: 'lurocotattoostudio23@gmail.com',
            to: recipe,
            subject: 'Verificación de cuenta',
            text: `Por favor, haz clic en el siguiente enlace para verificar tu cuenta: http://localhost:3000/auth/verifyemail/${code}`
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo electrónico enviado:', info.response);
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
    }
}

const loginwithgoogle = async (req, res) => {
    const { token } = req.body
    try {
        const decoded = await decodeToken(token);
        console.log(decoded)
        const response = await createToken(decoded.id, 3)
        return res.status(200).send(response)
    } catch (error) {
        console.log(error)
        return res.status(500).send({ error: 'Error del servidor '})
    }
}

const signup = async (req, res) => {
    let { name, lastname, email, password } = req.body;

    if (!name) {
        throw new Error("El nombre es requerido");
    } else if (!lastname) {
        throw new Error("el apellido es requerido");
    } else if (!email) {
        throw new Error("El mail es requerido");
    } else if (!password) {
        throw new Error("La contraseña es requerida");
    } else {
        const exists = await Usuario.findOne({ email: email });
        if (exists) throw new Error("El mail ya está en uso.");
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const verifytoken = [...Array(30)].map(() => Math.floor(Math.random() * 36).toString(36)).join('')
        const user = new Usuario({
            nombre: name,
            apellido: lastname,
            email: email,
            password: hashedPassword,
            registro: 'email',
            foto: (Math.floor(Math.random() * 3) + 1).toString(),
            role: email === 'lurocotattoostudio23@gmail.com' ? 'admin' : 'usuario',
            verifytoken: verifytoken,
            verified: 'false'
        });

        await user.save()
            .then(savedUser => {
                sendEmail(email, verifytoken)
                return res.status(200).json('Usuario creado con exito!')
            })
            .catch(error => {
                console.log(error)
                return res.status(500).json('Error del servidor ')
            });

    } catch (error) {
        return error;
    }
}

const verifyemail = async (req, res) => {
    const code = req.params.code
    const update = { verifytoken: ' ', verified: 'true' };

    await Usuario.findOneAndUpdate({ verifytoken: code }, update, { new: true })
  .then((user) => {
    console.log('Usuario actualizado:', user);
    return res.status(200).redirect(`http://localhost:3001/verifyemail?verified=true`);
  })
  .catch((error) => {
    console.log('Error al actualizar el usuario:', error);
    return res.status(200).redirect(`http://localhost:3001/verifyemail?verified=false`);
  });
}

const login = async (req, res) => {

    try {
        const user = await Usuario.findOne({email: req.body.email})
        const match = await bcrypt.compare(req.body.password, user.password);
        if (!match) return res.status(400).json("Contraseña incorrecta.");
      
        const nombre = user.nombre;
        const apellido = user.apellido;
        const email = user.email;
        const role = user.role;
        const foto = user.foto
        const verified = user.verified

        const payload = {
            nombre, apellido, email, role, foto, verified, id: user._id
        }

        const token = createToken(payload, 3);

        return res.status(200).json(token)
    } catch (error) {
        console.log(error)
        return res.status(500).json('error del servidor ')
    }
}

const getUser = async (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'No se proporcionó un token' });
    }
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
    return res.status(200).json(decoded)

    } catch (error) {
        return res.status(401).json({ message: 'Token inválido' });
    }
}

const updateUserPhoto = async (req, res) => {
    try {
        const user = await Usuario.findOneAndUpdate({email: req.body.email}, {foto: req.body.foto}, {new: true})
        const nombre = user.nombre;
        const apellido = user.apellido;
        const email = user.email;
        const role = user.role;
        const foto = user.foto
        const verified = user.verified

        const payload = {
            nombre, apellido, email, role, foto, verified
        }
        return res.status(200).json(payload)
    } catch (error) {
        console.log(error)
        return res.status(400).json('Error al actualizar tu foto de perfil')
    }
    
}

module.exports = {
    signup,
    loginwithgoogle,
    verifyemail,
    login,
    updateUserPhoto,
    getUser
}

refreshAccessTokenIfNeeded()