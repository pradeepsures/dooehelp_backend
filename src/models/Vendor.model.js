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
  
  adharNumber: {
    type: String,
    default: null
  },
  panNumber: {
    type: String,
    default: null
  },
  adharFront: {
    type: String,
    default: null
  },
  adharBack: {
    type: String,
    default: null
  },
  panFront: {
    type: String,
    default: null
  },
  panBack: {
    type: String,
    default: null
  },
  professionalCertificate: {
    type: [String]
  },
  bankAccuntno: {
    type: String,
    default: null
  },
  ifscCode: {
    type: String,
    default: null
  },
  accountHolderName: {
    type: String,
    default: null
  },
  bankName: {
    type: String,
    default: null
  },
  passBookPhoto: {
    type: String,
    default: null
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
  localities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Locality',
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
    default: 'active'
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
  isNewUser: {
    type: Boolean,
    default: true
  },
  isCompleteProfile: {
    type: Boolean,
    default: false
  },
  isProfileApproved: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date
  }
}, { timestamps: true });



module.exports = mongoose.model('Vendor', vendorSchema);
