const Producto = require('../models/Producto')
const busboy = require('busboy');
const fs = require('fs');
const os = require("os");
const path = require('path');
const { isNullOrUndefined } = require('util');
const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "ddds6vljg",
    api_key: "546733639133346",
    api_secret: "3QEVgh_Rxc_IVO44KgrmnmI8VSg",
});

const getProducts = async (req, res) => {
    const query = req.query.producto
    if (query) {
        let regExp = new RegExp(`^${query}`, "i")
        query.producto = regExp
    }
    try {
        let productos

        if (!query) {
            productos = await Producto.find()
        } else {
            productos = await Producto.find({ nombre: new RegExp(query, "i") })
        }

        if (productos) {
            res.status(200).json({
                message: 'Estos son todos los productos',
                response: productos,
                success: true
            })
        } else {
            res.status(404).json({
                message: "No hay productos",
                success: false
            })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Error del servidor',
            success: false
        })
    }
}

const getOneProduct = async (req, res) => {
    const { id } = req.params
    try {
        let product = await Producto.findOne({ _id: id })
        if (product) {
            res.status(200).json({
                message: 'Producto encontrado',
                response: product,
                success: true
            })
        } else {
            res.status(404).json({
                message: 'No se encontro el producto',
                success: false
            })
        }
    } catch (error) {
        console.log(error)
        res.status(400).json({
            message: 'Error del servidor',
            success: false
        })
    }
}

const addProduct = async (req, res) => {
    const form = busboy({ headers: req.headers });

    let name;
    let image;
    let description;
    let price;
    let stock;
    let isFileProcessed = false;
    let isFormClosed = false;

    // const createProduct = async () => {
    //     try {

    //         const newProduct = new Producto({
    //             nombre: name,
    //             imagen: image,
    //             descripcion: description,
    //             precio: price,
    //             stock: stock
    //         });

    //         newProduct.save((err) => {
    //             if (err) {
    //                 console.error(err);
    //                 return res.status(500).json('Error al agregar el producto.');
    //             }
    //             return res.status(200).json({
    //                 message: 'Producto creado con exito!',
    //                 response: newProduct,
    //                 success: true
    //             })

    //         });
    //     } catch (error) {
    //         console.log(error)
    //     }

    // };

    const createProduct = async () => {
        try {
            const newProduct = new Producto({
                nombre: name,
                imagen: image,
                descripcion: description,
                precio: price,
                stock: stock
            });
            newProduct.save()
            return res.status(200).json({
                message: 'Producto creado con exito!',
                response: newProduct,
                success: true
            })
        } catch (error) {
            console.log(error)
            return res.status(500).json('error del servidor')
        }  
    }

    try {
        form.on('field', (fieldname, val) => {
            if (fieldname === 'nombre') {
                name = val;
            } else if (fieldname === 'descripcion') {
                description = val;
            } else if (fieldname === 'precio') {
                price = val;
            } else if (fieldname === 'stock') {
                stock = val;
            }
        });

        form.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            const saveTo = path.join(os.tmpdir(), `product-image-${filename.filename}`);
            // const saveToPath = path.join(__dirname, 'uploads', filename);
            file.pipe(fs.createWriteStream(saveTo));
            result = await cloudinary.uploader.upload(saveTo);
            image = result.secure_url;
            isFileProcessed = true;
            if (isFormClosed) {
                try {
                    await createProduct();
                } catch (error) {
                    console.log(error)
                }

            }
        });

        form.on('close', async () => {
            isFormClosed = true;
            if (isFileProcessed && !(!name || !description || !image || !price || !stock) ) {
                try {
                    await createProduct();
                } catch (error) {
                    console.log(error)
                }
            }

        });

        req.pipe(form);


    } catch (error) {
        console.log(error);
        return res.status(500).json('Error del servidor');
    }
};

const removeProduct = async (req, res) => {
    const { id } = req.params
    try {
        await Producto.findOneAndDelete({ _id: id })
        let products = await Producto.find()
        res.status(200).json({
            message: "Producto eliminado con exito!",
            response: products,
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

const editProduct = async (req, res) => {
    console.log('entra al back')
    const form = busboy({ headers: req.headers });

    let name;
    let image;
    let description;
    let price;
    let stock;
    let isOldImage = false
    let isFileProcessed = false;
    let isFormClosed = false;

    const editProductt = async () => {

        try {
            console.log('entra al back 2')
            const product = {
                nombre: name,
                imagen: image,
                descripcion: description,
                precio: Number(price),
                stock: Number(stock)
            };
            const { productId } = req.params

            await Producto.findOneAndUpdate({ _id: productId }, product, { new: true })
                .then(async () => {
                    const products = await Producto.find()
                    res.status(200).json({
                        message: 'Producto editado con exito!',
                        response: products,
                        success: true
                    })
                }).catch(err => console.log(err))
        } catch (error) {
            console.log(error)
        }
    };

    try {
        form.on('field', (fieldname, val) => {
            console.log(fieldname, val)
            if (fieldname === 'nombre') {
                name = val;
            } else if (fieldname === 'descripcion') {
                description = val;
            } else if (fieldname === 'precio') {
                price = val;
            } else if (fieldname === 'stock') {
                stock = val;
            } else if (fieldname === 'oldImage') {
                image = val;
                isOldImage = true;
            }
        });

        form.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            console.log('file received:', filename);
            const saveTo = path.join(os.tmpdir(), `product-image-${filename.filename}`);
            file.pipe(fs.createWriteStream(saveTo));
            try {
                let result = await cloudinary.uploader.upload(saveTo);
                console.log('cloudinary result:', result);
                image = result.secure_url;
                isFileProcessed = true;
                if (isFormClosed) {
                    editProductt();
                }
            } catch (error) {
                console.log(error);
                res.status(500).json('Error del servidor');
            }
        });

        form.on('close', async () => {
            console.log('form closed');
            console.log('isFileProcessed', isFileProcessed);
            console.log('isFormClosed', isFormClosed);
            isFormClosed = true;
            if (isFileProcessed) {
                try {
                    await editProductt();
                } catch (error) {
                    console.log(error);
                    res.status(500).json('Error del servidor');
                }
            } else if (isOldImage) {
                try {
                    await editProductt();
                } catch (error) {
                    console.log(error);
                    res.status(500).json('Error del servidor');
                }
            }
        });

        req.pipe(form);
    } catch (error) {
        console.log(error);
        return res.status(500).json('Error del servidor');
    }
}

module.exports = {
    getProducts,
    getOneProduct,
    addProduct,
    removeProduct,
    editProduct
}