const User = require('../models/userModel');
const Cat = require('../models/catModel');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');

const { roles } = require('../roles');
const { updateMany } = require('../models/userModel');

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function validatePassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

exports.grantAccess = function (action, resource) {
  return async (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) {
        return res.status(401).json({
          error: "You don't have enough permission to perform this action"
        });
      }
      next()
    } catch (error) {
      next(error)
    }
  }
}

exports.allowIfLoggedin = async (req, res, next) => {
  try {
    const user = res.locals.loggedInUser;
    if (!user)
      return res.status(401).json({
        error: "You need to be logged in to access this route"
      });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

exports.registerCat = async (req, res) => {
  try {

    const { name, birthDate, weight, sterilized, specialCat, description } = req.body

    const newCat = new Cat({
      name: name,
      birthDate: birthDate,
      weight: weight,
      sterilized: sterilized,
      specialCat: specialCat,
      available: true,
      description: description
    });
    await newCat.save();
    res.json({
      data: newCat,
      message: "Cat is registered successfully"
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal error, please try again' });
  }
}

exports.getCats = async (req, res, next) => {
  const cats = await Cat.find();
  res.status(200).json({ data: cats });
}


exports.getCat = async (req, res, next) => {
  try {
    const catId = req.params.userId;
    const cat = await User.findById(catId).populate('user');
    if (!cat) return next(new Error('Cat does not exist'));
    res.status(200).json({
      data: cat
    });
  } catch (error) {
    next(error)
  }
}


exports.updateCat = async (req, res, next) => {
  try {
    const updatedName = req.body.name;
    const updatedBirthDate = req.body.birthDate;
    const updatedWeight = req.body.weight;
    const updatedSterilized = req.body.sterilized;
    const updatedSpecialCat = req.body.specialCat;
    const updatedDescription = req.body.description;
    const updatedAvailable = req.body.available;


    const catId = req.params.catId;


    var catNew = await Cat.findById(catId)
      .then(cat => {
        cat.name = updatedName;
        cat.birthDate = updatedBirthDate;
        cat.weight = updatedWeight;
        cat.sterilized = updatedSterilized;
        cat.specialCat = updatedSpecialCat;
        cat.description = updatedDescription;
        cat.available = updatedAvailable;
        return cat.save()
      })

    res.status(200).json({
      data: catNew,
      message: "Cat is updated successfully"
    });


  } catch (error) {
    res.status(400).json(error);
  }
}

exports.adoptCat = async (req, res, next) => {
  try {

    const catId = req.params.catId;
    const userId = req.body.userId

    
    await User.findOneAndUpdate({ cats: {$in: [catId] }}, { $set: { cats: []}})


    var catNew = await Cat.findById(catId)
      .then(cat => {    
        cat.available = false;
        return cat.save()
      })
      var userNew = await User.findById(userId)
      .then(user => {         
        user.cats = catId;
        return user.save()
      })

    res.status(200).json({
      data: catNew, userNew,
      message: "Cat and User updated successfully"
    });

  } catch (error) {
    next(error)
  }
}
