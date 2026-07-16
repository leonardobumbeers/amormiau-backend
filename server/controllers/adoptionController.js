const mongoose = require('mongoose');
const Adoption = require('../models/adoptionModel');
const User = require('../models/userModel');
const Cat = require('../models/catModel');

exports.requestAdoption = async (req, res, next) => {
  try {
    const cat = await Cat.findById(req.body.catId);
    if (!cat) throw new Error('Cat not found');
    if (!cat.available) throw new Error('Cat is not available for adoption');

    const existing = await Adoption.findOne({
      user: req.user._id,
      cat: cat._id,
      status: 'pending'
    });
    if (existing) throw new Error('Adoption request already pending');

    const adoption = await Adoption.create({ user: req.user._id, cat: cat._id });
    res.status(201).json({
      data: adoption,
      message: 'Adoption request submitted successfully'
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return next(new Error('Adoption request already pending'));
    }
    next(error);
  }
};

exports.getMyAdoptions = async (req, res, next) => {
  try {
    const adoptions = await Adoption.find({ user: req.user._id })
      .populate('cat')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: adoptions });
  } catch (error) {
    next(error);
  }
};

exports.getAdoptions = async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const adoptions = await Adoption.find(filter)
      .populate('cat')
      .populate('user', '-password -accessToken')
      .populate('decidedBy', 'name email role')
      .sort({ createdAt: -1 });
    res.status(200).json({ data: adoptions });
  } catch (error) {
    next(error);
  }
};

exports.decideAdoption = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { decision, reason } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      throw new Error('Adoption decision must be approved or rejected');
    }

    let decidedAdoption;
    await session.withTransaction(async () => {
      const adoption = await Adoption.findOne(
        { _id: req.params.requestId, status: 'pending' }, null, { session }
      );
      if (!adoption) throw new Error('Pending adoption request not found');

      const cat = await Cat.findById(adoption.cat, null, { session });
      const user = await User.findById(adoption.user, null, { session });
      if (!cat) throw new Error('Cat not found');
      if (!user) throw new Error('User not found');

      if (decision === 'approved') {
        if (!cat.available) throw new Error('Cat is not available for adoption');
        cat.available = false;
        if (!user.cats.some(catId => String(catId) === String(cat._id))) {
          user.cats.push(cat._id);
        }
        await cat.save({ session });
        await user.save({ session });
        await Adoption.updateMany(
          { _id: { $ne: adoption._id }, cat: cat._id, status: 'pending' },
          {
            $set: {
              status: 'rejected',
              decidedBy: req.user._id,
              decidedAt: new Date(),
              decisionReason: 'Another adoption request was approved'
            }
          },
          { session }
        );
      }

      adoption.status = decision;
      adoption.decidedBy = req.user._id;
      adoption.decidedAt = new Date();
      adoption.decisionReason = reason;
      decidedAdoption = await adoption.save({ session });
    });

    res.status(200).json({
      data: decidedAdoption,
      message: `Adoption request ${decision}`
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};
