const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CatSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
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

  description: { 
    type: String
  },

  adoptiveUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
})

const Cat = mongoose.model('cat', CatSchema)

module.exports = Cat;