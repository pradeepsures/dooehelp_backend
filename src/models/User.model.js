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

  profileImage: {
    type: String
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String,
    default: null
  },
  referredByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isReferralRewardClaimed: {
    type: Boolean,
    default: false
  },
  referralCount: {
    type: Number,
    default: 0
  },
  totalReferralEarnings: {
    type: Number,
    default: 0
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
  fcmToken: {
    type: String,
    default: null,
    index: true
  },
  deviceId: {
    type: String,
    default: null
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

// Helper to generate a unique referral code
function generateReferralCode(name) {
  const cleanName = (name || 'USER').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4);
  const prefix = cleanName.padEnd(4, 'X');
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${randomPart}`;
}

// Pre-save hook to generate a referral code
userSchema.pre('save', function () {
  if (!this.referralCode) {
    this.referralCode = generateReferralCode(this.name);
  }
});


const UserModel = mongoose.model('User', userSchema);
UserModel.generateReferralCode = generateReferralCode;

module.exports = UserModel;
