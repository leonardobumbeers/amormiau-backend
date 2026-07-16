const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
require("dotenv/config");

const mongoUrl = process.env.MONGODB_URL;

if (mongoUrl) {
    mongoose.connect(mongoUrl, {
        serverSelectionTimeoutMS: 5000
    }).catch((error) => {
        console.error('MongoDB connection failed:', error.message);
    });
} else {
    console.warn('MONGODB_URL is not configured; database endpoints are unavailable.');
}

mongoose.connection.on('connected', function () {
    console.log(`Database connection open to ${mongoose.connection.host} ${mongoose.connection.name}`);
});

mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});
