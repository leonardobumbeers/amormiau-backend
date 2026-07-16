const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);
require("dotenv/config");

const mongoUrl = process.env.MONGODB_URL;
let connectionPromise;

function connectDatabase() {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
    }

    if (!mongoUrl) {
        return Promise.reject(new Error('MONGODB_URL is not configured'));
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(mongoUrl, {
            serverSelectionTimeoutMS: 10000
        }).catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }

    return connectionPromise;
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

module.exports = { connectDatabase };
