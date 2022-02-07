const mongoose = require('mongoose');
const path = require('path')
mongoose.Promise = global.Promise;
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});


mongoose.connect(process.env.MONGODB_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
    })
// .then(() => console.log('Conectou no MongoDB com sucesso!'))
// .catch((err) => console.log(err));

mongoose.connection.on('connected', function () {
    console.log(`Database connection open to ${mongoose.connection.host} ${mongoose.connection.name}`);
});

mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});