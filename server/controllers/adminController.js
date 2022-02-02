const User = require('../models/userModel');
const Cat = require('../models/catModel');
const jwt = require('jsonwebtoken');

const { roles } = require('../roles')

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

    const { name, birthDate, weight, sterilized, description } = req.body

    const newCat = new Cat({
      name: name,
      birthDate: birthDate,
      weight: weight,
      sterilized: sterilized,
      description: description,
      adoptiveUser: null,
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
  const cats = await Cat.find({});
  res.status(200).json({ data: cats });
}


exports.getCat = async (req, res, next) => {
  try {
    const catId = req.params.userId;
    const cat = await User.findById(catId);
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
    let { name, birthDate, weight, sterilized, description, userId } = req.body
    userId = await User.findOne({ userId })

    const catId = req.params.catId;
    let catNew = await Cat.findOneAndUpdate(catId, {
      name: name,
      birthDate: birthDate,
      weight: weight,
      sterilized: sterilized,
      description: description,
      adoptiveUser: userId
    });
    
    userId.cat.push(catNew);
    userId.save();

    const cat = await Cat.findById(catId)
    //const cat = await User.findById(userId)
    res.status(200).json({
      data: cat,
      message: "Cat is updated successfully"
    });
  } catch (error) {
    next(error)
  }
}


const isOwner = (user, cat) => {
  if(JSON.stringify(user._id) == JSON.stringify(cat._id))
    return true;
  else
    return false;
}

