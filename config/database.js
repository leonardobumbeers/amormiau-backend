const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);
require("dotenv/config");


mongoose.connect(process.env.MONGODB_URL, {
    serverSelectionTimeoutMS: 5000
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
