const Artista = require('../models/Artista')
const busboy = require('busboy');
const fs = require('fs');
const os = require("os");
const path = require('path');
const { google } = require('googleapis');
const { CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE, REFRESH_TOKEN } = require('../config');
const { OAuth2 } = google.auth;
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "ddds6vljg",
    api_key: "546733639133346",
    api_secret: "3QEVgh_Rxc_IVO44KgrmnmI8VSg",
});

const oauth2Client = new OAuth2(
    CLIENT_ID_GOOGLE,
    CLIENT_SECRET_GOOGLE,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    //access_token: ACCESS_TOKEN_DRIVE,
    refresh_token: REFRESH_TOKEN,
    //scope: 'https://www.googleapis.com/auth/drive'
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

refreshAccessTokenIfNeeded()
    .then(() => {
        console.log(oauth2Client.credentials.access_token)
    })
    .catch(error => {
        console.error('Error al verificar los tokens:', error);
    });

cloudinary.config({
    cloud_name: "ddds6vljg",
    api_key: "546733639133346",
    api_secret: "3QEVgh_Rxc_IVO44KgrmnmI8VSg",
});

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

const createFolderForArtistPendingTattoos = async (nombre) => {
    const folderMetadata = {
        name: `${nombre} tattoos pendientes`, //nombre carpeta
        mimeType: 'application/vnd.google-apps.folder'
    };

    try {
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        console.log(`Carpeta creada con ID: ${folder.data.id}`);
        return folder.data.id
    } catch (error) {
        console.log(error)
    }
}

const createFolderForArtistTattoos = async (nombre) => {

    console.log('el nombre: ', nombre)
    const folderMetadata = {
        name: `${nombre} tattoos`, //nombre carpeta
        mimeType: 'application/vnd.google-apps.folder'
    };

    try {
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        console.log(`Carpeta creada con ID: ${folder.data.id}`);

        return folder.data.id
    } catch (error) {
        console.log(error)
    }
}

const removeFoldersFromArtist = async (tattoosFolderId, pendingTattoosFolderId) => {
    console.log(tattoosFolderId, pendingTattoosFolderId)
    const folderIds = [tattoosFolderId, pendingTattoosFolderId];

    Promise.all(folderIds.map(id => {
        return drive.files.delete({
            fileId: id
        });
    }))
        .then(() => {
            console.log('Carpetas eliminadas con éxito.');
        })
        .catch(err => {
            console.log(`Error eliminando carpetas: ${err}`);
        });
}

const editFolderForArtist = async (tattoosFolderId, pendingTattoosFolderId, nombreArtista) => {

    drive.files.update({
        fileId: pendingTattoosFolderId,
        resource: {
            name: `${nombreArtista} tattoos pendientes`
        }
    }, (err, file) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Nombre de la carpeta actualizado a ${file.data.name}`);
        }
    });

    drive.files.update({
        fileId: tattoosFolderId,
        resource: {
            name: `${nombreArtista} tattoos`
        }
    }, (err, file) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Nombre de la carpeta actualizado a ${file.data.name}`);
        }
    });
}

const allArtists = async (req, res) => {
    let artistas
    try {
        artistas = await Artista.find()
        if (artistas) {
            res.status(200).json({
                message: 'Estos son todos los artistas',
                response: artistas,
                success: true
            })
        } else {
            res.status(404).json({
                message: "No se encontraron artistas",
                success: false
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Error del servidor.',
            success: false
        })
    }
}

const oneArtist = async (req, res) => {
    const { id } = req.params
    try {
        let artista = await Artista.findOne({ _id: id })
        if (artista) {
            res.status(200).json({
                message: 'Artista encontrado',
                response: artista,
                success: true
            })
        } else {
            res.status(404).json({
                message: 'Artista no encontrado',
                success: false
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Error del servidor.',
            success: false
        })
    }
}

const addNewArtist = async (req, res) => {

    const form = busboy({ headers: req.headers });

    let nombre;
    let descripcion;
    let horarioslaborales;
    let image;

    let isFileProcessed = false;
    let isFormClosed = false;

    try {
        form.on('field', (fieldname, val) => {
            if (fieldname === 'nombre') {
                nombre = val;
            } else if (fieldname === 'descripcion') {
                descripcion = val;
            } else if (fieldname === 'horarioslaborales') {
                horarioslaborales = val.split(",");
            }
        });

        form.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            const saveTo = path.join(os.tmpdir(), `artist-image-${filename.filename}`);
            // const saveToPath = path.join(__dirname, 'uploads', filename);
            file.pipe(fs.createWriteStream(saveTo));
            result = await cloudinary.uploader.upload(saveTo);
            image = result.secure_url;
            isFileProcessed = true;
            if (isFormClosed) {
                createArtist();
            }
        });

        form.on('close', async () => {
            isFormClosed = true;
            if (isFileProcessed) {
                createArtist();
            }
        });

        req.pipe(form);

        const createArtist = async () => {
            try {
                const folderIdPending = await createFolderForArtistPendingTattoos(nombre)
                const folderId = await createFolderForArtistTattoos(nombre)
                const newArtist = new Artista({
                    nombre: nombre,
                    imagen: image,
                    descripcion: descripcion,
                    horarioslaborales: horarioslaborales,
                    pendingTattoosFolderId: folderIdPending,
                    tattoosFolderId: folderId
                });

                newArtist.save(async (err) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error al crear artista.');
                    } else {
                        res.status(200).json({
                            message: 'Artista creado con exito!',
                            response: newArtist,
                            success: true
                        })
                    }
                });
            } catch (error) {
                console.log(error)
            }
        };
    } catch (e) {
        console.log(e)
    }
}

const removeArtist = async (req, res) => {
    const { artistId } = req.params
    try {
        let artist = await Artista.findOne({ _id: artistId })
        await removeFoldersFromArtist(artist.tattoosFolderId, artist.pendingTattoosFolderId)
        await Artista.findOneAndDelete({ _id: artistId })
        let artists = await Artista.find()
        res.status(200).json({
            message: "Artista eliminado con exito!",
            response: artists,
            success: true
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Error del servidor.",
            success: false
        })
    }
}

const editArtist = async (req, res) => {
    //recibe todas las caracteristicas del artista(ver modelo, TODAS)
    //busca por id y actualiza con todas las caracteristicas
    const { artistId } = req.params

    const form = busboy({ headers: req.headers });

    let nombre;
    let descripcion;
    let horarioslaborales;
    let imagen;
    let oldImage = false;
    let artist;
    let isFileProcessed = false;
    let isFormClosed = false;

    try {
        form.on('field', (fieldname, val) => {
            console.log(fieldname, val)
            if (fieldname === 'nombre') {
                nombre = val;
            } else if (fieldname === 'descripcion') {
                descripcion = val;
            } else if (fieldname === 'horarioslaborales') {
                horarioslaborales = val.split(",");
            } else if (fieldname === 'oldImage') {
                imagen = val;
                oldImage = true;
            }
        });
        form.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            const saveTo = path.join(os.tmpdir(), `artist-image-${filename.filename}`);
            file.pipe(fs.createWriteStream(saveTo));
            try {
                let result = await cloudinary.uploader.upload(saveTo);
                console.log('cloudinary result:', result);
                imagen = result.secure_url;
                isFileProcessed = true;
                if (isFormClosed) {
                    editArtistt();
                }
            } catch (error) {
                console.log(error);
                res.status(500).json('Error del servidor');
            }

        })
        form.on('close', async () => {

            isFormClosed = true;
            if (isFileProcessed) {
                try {
                    await editArtistt();
                } catch (error) {
                    console.log(error);
                    res.status(500).json('Error del servidor');
                }
            } else if (oldImage) {
                try {
                    await editArtistt();
                } catch (error) {
                    console.log(error);
                    res.status(500).json('Error del servidor');
                }
            }
        })

        req.pipe(form);

        const editArtistt = async () => {
            try {
                artist = await Artista.findOne({ _id: artistId })
                await editFolderForArtist(artist.tattoosFolderId, artist.pendingTattoosFolderId, nombre)

                const editedArtist = {
                    nombre: nombre,
                    descripcion: descripcion,
                    horarioslaborales: horarioslaborales,
                    imagen: imagen,
                    pendingTattoosFolderId: artist.pendingTattoosFolderId,
                    tattoosFolderId: artist.tattoosFolderId
                }

                await Artista.findOneAndUpdate({ _id: artistId }, editedArtist, { new: true })
                    .then(async () => {
                        const artists = await Artista.find()
                        res.status(200).json({
                            message: 'Artista editado con exito!',
                            response: artists,
                            success: true
                        })
                    }).catch(err => console.log(err))
            } catch (error) {
                console.log(error)
            }
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Error del servidor',
            success: false
        })
    }
}


module.exports = {
    allArtists,
    oneArtist,
    addNewArtist,
    removeArtist,
    editArtist
}

refreshAccessTokenIfNeeded()