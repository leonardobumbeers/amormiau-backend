const User = require('../models/userModel');
const Cat = require('../models/catModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

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
    if (!user) throw new Error("You need to be logged in to access this route")
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

exports.signup = async (req, res, next) => {
  try {

    const { name, email, password, cpf, rg, birthDate, phone, address, city, state, role } = req.body

    let user = await User.findOne({ email });
    if (user) {
      throw new Error('User already exists');
    }
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      cpf: cpf,
      rg: rg,
      birthDate: birthDate,
      phone: phone,
      address: address,
      city: city,
      state: state,
      cats: [],
      role: role || "basic"
    });
    const accessToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
    newUser.accessToken = accessToken;
    await newUser.save();
    res.json({
      data: newUser,
      message: "You have signed up successfully"
    }).status(200)
  } catch (e) {
    next(e);
  }
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user)
      throw new Error('Incorrect email or password')
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword) throw new Error('Incorrect email or password')
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
    await User.findByIdAndUpdate(user._id, { accessToken })
    res.status(200).json({
      data: { email: user.email, role: user.role },
      accessToken
    })
  } catch (e) {
    next(e);
  }
}

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('cats')
    res.status(200).json({ data: users });
  } catch (e) {
    next(e);
  }
}

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).populate('cats')
    if (!user) throw new Error('User not found');
    res.status(200).json({
      data: user
    });
  } catch (e) {
    next(e)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const updatedEmail = req.body.email;
    const updatedPassword = req.body.password;
    const updatedRole = req.body.role;
    const updatedCats = req.body.cats;
    const hashedPassword = await hashPassword(updatedPassword);
    const userId = req.params.userId;

    const user = await User.findById(userId)
    if (!user) throw new Error('User not found');

    var userNew = await User.findById(userId)
      .then(user => {
        user.role = updatedRole || "basic";
        user.email = updatedEmail;
        user.password = hashedPassword;
        user.cats = updatedCats;
        return user.save()
      })

    res.status(200).json({
      data: userNew,
      message: "User has been updated successfully!"
    });
  } catch (e) {
    next(e)
  }
}


exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    res.status(200).json({
      data: null,
      message: 'User has been deleted'
    });
  } catch (e) {
    next(e)
  }
}



