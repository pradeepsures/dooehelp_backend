const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    sparse: true,
  },
  location: {
    lat: { type: Number },
    long: { type: Number }
  },
  profileImage: {
    type: String
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String
  },
  role: { 
    type: String, 
    default: 'user', 
    enum: ['user'] 
  },
  address: {
    type: String,
    default: null
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  status: {
    type: Boolean,
    default: true
  },
  isDeleted: {
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

// Pre-save hook to generate a referral code
userSchema.pre('save', function () {
  if (this.isNew && !this.referralCode) {
    const namePrefix = this.name ? this.name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') : 'USER';
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4 digit random number
    this.referralCode = `${namePrefix}${randomNum}`;
  }
});


module.exports = mongoose.model('User', userSchema);
