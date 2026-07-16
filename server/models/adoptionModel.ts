const mongoose = require('mongoose');

const AdoptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
    index: true
  },
  cat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'cat',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true,
    index: true
  },
  decidedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  decidedAt: Date,
  decisionReason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, { timestamps: true });

AdoptionSchema.index(
  { user: 1, cat: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('adoption', AdoptionSchema);
