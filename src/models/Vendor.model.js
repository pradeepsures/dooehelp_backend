const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: false
  },
  role: {
    type: String,
    default: 'vendor',
    enum: ['vendor']
  },
  otp: {
    type: String
  },
  otpExpiresAt: {
    type: Date

}},{ timestamps: true });

vendorSchema.methods.toJSON = function () {
  const vendor = this.toObject();
  delete vendor.otp;
  delete vendor.otpExpiresAt;
  return vendor;
};

module.exports = mongoose.model('Vendor', vendorSchema);
