const User = require('../models/userModel');
require("dotenv/config");
const mongoose = require('mongoose');



// make a connection 
mongoose.connect(`${process.env.MONGODB_URL}`, { useNewUrlParser: true }, { useUnifiedTopology: true });

// get reference to database
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {

    console.log("Connection Successful!");

    const user = new User({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD_HASHED,
        role: 'admin',
        accessToken: process.env.ADMIN_ACCESS_TOKEN
    });
    user.save()


}).then(() => {
    console.log("Admin user created!")
    mongoose.connection.close();
}).catch(err => {
    console.log(err)
})
