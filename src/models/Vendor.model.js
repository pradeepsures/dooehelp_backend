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
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
  }
}, { timestamps: true });



module.exports = mongoose.model('Vendor', vendorSchema);
