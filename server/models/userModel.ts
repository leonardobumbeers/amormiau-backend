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
    trim: true,
    unique: true,
    sparse: true
  },

  rg: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
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

  profession: { type: String },
  hadAdoptedBefore: { type: Boolean, default: false },
  previousAdoption: { type: String },
  adultsAtHome: { type: Number },
  childrenAtHome: { type: Number },
  childrenAges: { type: String },
  homeType: { type: String },
  windowsSecured: { type: String },
  otherPets: { type: String },
  whyAdopt: { type: String },
  travelCare: { type: String },
  financialConditions: { type: String },
  allergies: { type: String },
  commitment: { type: String },
  interviewComments: { type: String },

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
