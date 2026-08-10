const mongoose = require('mongoose');

function arrayLimit(val) {
  return val.length <= 6;
}

const vendorSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: false
  },
  email: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    default: 'vendor',
    enum: ['vendor']
  },
  profileImage: {
    type: String
  },
  governmentId: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 6']
  },
  addressProof: {
    type: [String]
  },
  professionalCertificate: {
    type: [String]
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  yearOfExperience: {
    type: Number
  },
  categories: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Category',
    default: []
  },
  skills: {
    type: [String],
    default: []
  },
  tools: {
    type: [String],
    default: []
  },
  profileCompletion: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  onlineStatus: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  city: {
    type: String,
    default: null
  },
  address: {
    type: String,
    default: null
  },
  location: {
    lat: {
      type: Number,
      default: null
    },
    long: {
      type: Number,
      default: null
    }
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
  }
}, { timestamps: true });



module.exports = mongoose.model('Vendor', vendorSchema);
