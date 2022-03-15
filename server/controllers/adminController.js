const User = require('../models/userModel');
const Cat = require('../models/catModel');
const jwt = require('jsonwebtoken');
const userController = require('../controllers/userController');
const multer = require("multer");
const multerConfig = require("../util/multer");
const { roles } = require('../roles');

exports.grantAccess = function (action, resource) {
  return async (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);
      if (!permission.granted) throw new Error("You don't have enough permission to perform this action");
      next()
    } catch (error) {
      next(error)
    }
  }
}

exports.allowIfLoggedin = async (req, res, next) => {
  try {
    const user = res.locals.loggedInUser;
    if (!user) throw new Error("You need to be logged in to access this route");
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

exports.registerCat = async (req, res, next) => {
  try {

    const { name, birthDate, weight, sterilized, specialCat, description, available } = req.body
    const images = {} = req.files;

    console.log(JSON.stringify(images, null, 2));
    if(images.length === 0) throw new Error('No images were uploaded')
    

    const newCat = new Cat({
      name: name,
      birthDate: birthDate,
      weight: weight,
      sterilized: sterilized,
      specialCat: specialCat,
      available: available || true,
      description: description,
      images: []

    });

    for(let image of images){
      newCat.images.push({
        fileName: image.originalname,
        key: image.key,
        size: image.size,
        dest: image.destination
      })
    }

    await newCat.save();
    res.json({
      data: newCat,
      message: "Cat is registered successfully"
    })
  } catch (e) {
    next(e)
  }
}

exports.getCats = async (req, res, next) => {
  try {
    const cats = await Cat.find();
    res.status(200).json({ data: cats })
  } catch (e) {
    next(e)
  };
}


exports.getCat = async (req, res, next) => {
  try {
    const catId = req.params.catId;
    const cat = await Cat.findById(catId)
    if (!cat) throw new Error("Cat not found");
    res.status(200).json({
      data: cat
    });
  } catch (e) {
    next(e)
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
    const cat = await Cat.findById(catId)
    if (!cat) throw new Error("Cat not found");

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


  } catch (e) {
    next(e)
  }
}

exports.adoptCat = async (req, res, next) => {
  try {

    const catId = req.params.catId;
    const userId = req.body.userId


    await User.findOneAndUpdate({ cats: { $in: [catId] } }, { $set: { cats: [] } })
    const user = await User.findById(userId)
    if(!user) throw new Error('User not found')

    const cat = await User.findById(catId)
    if (!cat) throw new Error("Cat not found");

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

  } catch (e) {
    next(e)
  }
}

exports.deleteCat = async (req, res, next) => {
  try {
    const catId = req.params.catId;
    const cat = await Cat.findById(catId);
    if (!cat) throw new Error("Cat not found");
    await Cat.findByIdAndRemove(catId);
    res.status(200).json({
      data: null,
      message: "Cat is deleted successfully"
    });
  } catch (e) {
    next(e)
  }
}
