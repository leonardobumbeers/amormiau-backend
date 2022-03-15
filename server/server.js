const express = require('express');
var logger = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path')
const User = require('./models/userModel')
const routes = require('./routes/route.js');
const adminRouter = require('./routes/admin.js');
require('../config/database.js');
require("dotenv").config({
  path: path.join(__dirname, "../.env")
});
var cors = require('cors');



const app = express();


const PORT = process.env.PORT || 3000;
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(
  "/files",
  express.static(path.resolve(__dirname, "..", "tmp", "uploads"))
);

app.use(async (req, res, next) => {
  if (req.headers["x-access-token"]) {
    try {
      const accessToken = req.headers["x-access-token"];
      const { userId, exp } = await jwt.verify(accessToken, process.env.JWT_SECRET);
      // If token has expired
      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one"
        });
      }
      res.locals.loggedInUser = await User.findById(userId);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});



app.use('/', routes);
app.use('/admin', adminRouter);
app.use(function (error, req, res, next) {
  if (error.message === "Cat already exists") {
    res.status(409).json({ error: "Cat already exists" });
  }
  if (error.message === "Cat not found") {
    res.status(404).json({ error: "Cat not found" });
  }
  if (error.message === "Cat already adopted") {
    res.status(409).json({ error: "Cat already adopted" });
  }
  if (error.message === "User already exists") {
    res.status(409).json({ error: "User already exists" });
  }
  if (error.message === "User not found") {
    res.status(404).json({ error: "User not found" });
  }
  if (error.message === "Incorrect email or password") {
    res.status(401).json({ error: "Incorrect email or password" });
  }
  if (error.message === "You need to be logged in to access this route") {
    res.status(401).json({ error: "You need to be logged in to access this route" });
  }
  if (error.message === "You don't have enough permission to perform this action") {
    res.status(401).json({ error: "You don't have enough permission to perform this action" });
  }
  if(error.message === "No images were uploaded"){
    res.status(422).json({ error: "No images were uploaded" });
  }
  res.status(500).json({ error: 'Internal server error' });
 
});





app.listen(PORT, () => {
  console.log('Server is listening on Port:', PORT)
})