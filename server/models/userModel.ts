const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({

  name: {
    type: String
  },

  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  cpf: {
    type: String,
    unique: true
  },

  rg: {
    type: String,
    unique: true
  },

  birthDate: {
    type: String
  },

  phone: {
    type: String
  },

  address: {
    type: String
  },

  city: {
    type: String
  },

  state: {
    type: String
  },

  role: {
    type: String,
    default: 'basic',
    enum: ["basic", "supervisor", "admin"]
  },

  cats: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'cat',
    }
  ],

  accessToken: {
    type: String
  }

}, {
  timestamps: true
});

const User = mongoose.model('user', UserSchema)

module.exports = User;