const User = require('../models/userModel');
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

exports.index = async (req, res) => {
  const users = await User.find().populate('cats');
  res.send(users);
}

exports.show = async (req, res) => {
  const users = await User.findById(req.params.id).populate('cats');
  res.send(users);
}

exports.signup = async (req, res, next) => {
  try {

    const { name, email, password, cpf, rg, birthDate, address, city, state, role } = req.body

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        error: "This email already exists, try a new one"
      }).end()
    }
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      cpf: cpf,
      rg: rg,
      birthDate: birthDate,
      address: address,
      city: city,
      state: state,
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
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal error, please try again' });
  }
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user)
      res.status(401).json({ error: 'Incorrect email or password' });
    const validPassword = await validatePassword(password, user.password);
    if (!validPassword) return next(new Error('Password is not correct'))
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });
    await User.findByIdAndUpdate(user._id, { accessToken })
    res.status(200).json({
      data: { email: user.email, role: user.role },
      accessToken
    })
  } catch (error) {
    next(error);
  }
}

exports.getUsers = async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({ users });
}

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return next(new Error('User does not exist'));
    res.status(200).json({
      data: user
    });
  } catch (error) {
    next(error)
  }
}

exports.updateUser = async (req, res, next) => {
  try {
    const { email, password, role, cat } = req.body
    const userId = req.params.userId;
    await User.findByIdAndUpdate(userId, { email, password, role, cat });
    const user = await User.findById(userId)
    res.status(200).json({
      data: user
    });
  } catch (error) {
    next(error)
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
  } catch (error) {
    next(error)
  }
}