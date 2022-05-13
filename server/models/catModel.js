const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const CatSchema = new Schema({
  name: {
    type: String,
    required: true,
  },

  birthDate: {
    type: String,
    required: true
  },

  weight: {
    type: String
  },

  sterilized: {
    type: Boolean
  },

  specialCat: {
    type: Boolean
  },

  description: {
    type: String
  },

  available: {
    type: Boolean,
    default: true,
    required: true
  },

  sociable: {
    type: Number,
    default: 0,
  },

  playful: {
    type: Number,
    default: 0,
  },

  affectionate: {
    type: Number,
    default: 0,
  },

  images: [
    {
      fileName: String,
      key: String,
      size: Number,
      dest: String
    }
  ]
}, {
  timestamps: true
});

CatSchema.pre('remove', function () {
  promisify(fs.unlink)(path.resolve(__dirname, '..', '..', 'tmp', 'uploads', this.images[0].key));
});



const Cat = mongoose.model('cat', CatSchema)

module.exports = Cat;