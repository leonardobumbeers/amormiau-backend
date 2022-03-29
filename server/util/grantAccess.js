var User = require('../models/userModel');
require("dotenv/config");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


const grantAccess = new Promise((resolve, reject) => {
    // make a connection 
    mongoose.connect(process.env.MONGODB_URL,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })

    // get reference to database
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', () => {
        // random number
        const random = Math.floor(Math.random() * 1000);

        const user = new User({
            name: 'Admin',
            email: random + process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD_HASHED,
            cpf: random,
            rg: random,
            role: 'admin',
            // accessToken: accessToken
        });
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30d"
        });
        user.accessToken = accessToken;
        user.save().then((result) => {
            db.close();
            resolve(result);
        }).catch((err) => {
            console.log('err: ' + err);
            db.close();
            reject(err);
        })

    })
})

const clearDatabase = async () => {

    mongoose.connect(process.env.MONGODB_URL,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        })

    // get reference to database
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    await User.deleteMany({}).then(() => {
        db.close();
    }).catch((err) => {
        console.log('err: ' + err);
        db.close();
    })
}

module.exports = { grantAccess, clearDatabase };






