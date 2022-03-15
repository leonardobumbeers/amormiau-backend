const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

const Cat = mongoose.model('cat', CatSchema)

module.exports = Cat;