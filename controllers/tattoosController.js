const Tatuaje = require('../models/Tatuaje')
const busboy = require('busboy');
const fs = require('fs');
const os = require("os");
const path = require('path');
const { google } = require('googleapis');
const Artista = require('../models/Artista');
const { CLIENT_ID_GOOGLE, CLIENT_SECRET_GOOGLE, ACCESS_TOKEN, REFRESH_TOKEN } = require('../config');
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
    CLIENT_ID_GOOGLE,
    CLIENT_SECRET_GOOGLE,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/drive'
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


const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

const createFolderForArtistPendingTattoos = async (req, res) => {
    const folderMetadata = {
        name: `${req.body.artistName} tattoos pendientes`, //nombre carpeta
        mimeType: 'application/vnd.google-apps.folder'
    };

    try {
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        console.log(`Carpeta creada con ID: ${folder.data.id}`);
    } catch (error) {
        console.log(error)
    }
}

const createFolderForArtistTattoos = async (req, res) => {
    const folderMetadata = {
        name: `${req.body.artistName} tattoos`, //nombre carpeta
        mimeType: 'application/vnd.google-apps.folder'
    };

    try {
        const folder = await drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        console.log(`Carpeta creada con ID: ${folder.data.id}`);
    } catch (error) {
        console.log(error)
    }
}


const getTattosByArtist = async (req, res) => {
    const idArtist = req.params.idArtist

    try {
        const tattoos = await Tatuaje.find({ artista: idArtist })
        res.status(200).json({
            message: 'Tatuajes encontrados',
            response: tattoos,
            success: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error al obtener los tatuajes' })
    }
}

const findPendingFolderByArtist = async (artist) => {
    let artista = await Artista.findOne({ _id: artist })
    return artista.pendingTattoosFolderId
}

const addFileToArtisPendingtFolder = async ( artist, tattooFileName) => {
    // Encontrar carpeta del artista
    let pendingFolderId = await findPendingFolderByArtist(artist)
    // Agregar archivo a pending folder del artista
    const filePathTattoo = path.join(os.tmpdir(), `artist-tattoo-image-${tattooFileName}`)

    let appProperties = {
        'queueId': Date.now(),
        'artist': artist,
    }

    try {
        await drive.files.create({
            resource: {
                parents: [pendingFolderId],
                appProperties: appProperties,
                name: tattooFileName,
                mimeType: "image/jpg"
            },
            media: {
                mimeType: "image/jpg",
                body: fs.createReadStream(filePathTattoo),
            }
        });
    } catch (error) {
        console.log(error)
    }
}

const uploadMyTattoos = async (req, res) => {
    console.log('entraaaaaa')
    let artist
    let tattooFileName
    try {
        const form = busboy({ headers: req.headers });
        form.on('field', (fieldname, val) => {
            if (fieldname === 'artist') {
                artist = val;
            }
        });

        form.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            const saveTo = path.join(os.tmpdir(), `artist-tattoo-image-${filename.filename}`);
            file.pipe(fs.createWriteStream(saveTo));
            tattooFileName = filename.filename
        })
        form.on('close', async () => {
            try {
                await addFileToArtisPendingtFolder(artist, tattooFileName)
            } catch (error) {
                console.log(error);
                res.status(500).json('Error del servidor');
            }
        })
        req.pipe(form);
    } catch (error) {
        console.log(error)
    }
}

const getPendingTattoos = async (req, res) => {
    try {
        const folderName = 'Pendientes';
        const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;

        const response = await drive.files.list({
            q: folderQuery,
            fields: 'files(id)',
        });

        const folderId = response.data.files[0].id;
        const foldersResponse = await drive.files.list({
            q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id, name)',
        });

        const folders = foldersResponse.data.files;

        const files = [];

        for (const folder of folders) {
            const filesResponse = await drive.files.list({
                q: `'${folder.id}' in parents and mimeType!='application/vnd.google-apps.folder'`,
                fields: 'files(id, name, appProperties)',
            });

            const folderFiles = filesResponse.data.files.map((file) => ({
                id: file.id,
                name: file.name,
                metadata: file.appProperties,
            }));

            files.push({
                folder: folder.name,
                files: folderFiles,
            });
        }

        res.json(files);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error al obtener los archivos');
    }
}

const acceptTattoo = async (req, res) => {

    console.log(req.body)
    const { accept, id, artistname } = req.body
    const artistName = artistname.split(' ').slice(0, -1).join(' ')
    console.log(artistName)
    try {

        if(accept === false){
            await drive.files.delete({
                fileId: id,
            });
          
            console.log('Archivo eliminado con exito de Google Drive');
            res.status(200).json('tattoo rechazado.')
        }

        if(accept === true){
            const tattoosFolderId = '1wpzvR_-3hSL50uvQMwcciRSi0o5vd7Ln';

            // Obtener la carpeta del artista
            const artistFolder = await drive.files.list({
                q: `name = '${artistName}' and '${tattoosFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
                fields: 'files(id)',
            });

            if (artistFolder.data.files.length === 0) {
                console.log(`No se encontró la carpeta del artista ${artistName}`);
                res.status(400).json(`No se encontró la carpeta del artista ${artistName}`);
                return;
            }

            const artistFolderId = artistFolder.data.files[0].id;

            await drive.files.update({
                fileId: id,
                addParents: artistFolderId,
                removeParents: tattoosFolderId,
                fields: 'id, parents',
            });

            console.log('Archivo movido con éxito a la carpeta del artista en Google Drive');
            res.status(200).json('Tattoo aceptado.');
        }

        
      } catch (error) {
        console.error('Error al eliminar el archivo de Google Drive:', error.message);
      }
}

const getJobs = async (req, res) => {
    try {
      const { idArtist } = req.params;
      const artist = await Artista.findOne({ _id: idArtist });
        
      if (!artist) {
        return res.status(404).json({ error: "Artista no encontrado" });
      }
  
      const folder = artist.tattoosFolderId;
      const response = await drive.files.list({
        q: `'${folder}' in parents`,
        fields: "files(id)",
      });
  
      const files = response.data.files.map((file) => file.id);
      res.status(200).json({ files });
    } catch (error) {
      console.error("Error al obtener los trabajos del artista:", error.message);
      res.status(400).json("No se pudo obtener los trabajos del artista.");
    }
};

module.exports = {
    getTattosByArtist,
    createFolderForArtistPendingTattoos,
    createFolderForArtistTattoos,
    uploadMyTattoos,
    getPendingTattoos,
    acceptTattoo,
    getJobs
}

refreshAccessTokenIfNeeded()