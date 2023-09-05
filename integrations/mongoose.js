const mongoose = require('mongoose')

mongoose.set('strictQuery', false)
mongoose.connect(
    'mongodb+srv://LuRocoTattoo:lurocotattoo@cluster0.uhmmqpc.mongodb.net/LuRocoTattoo?',
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }
).then(() => console.log('connected to database successfully'))
.catch(error => console.log(error))