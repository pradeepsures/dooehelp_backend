const mongoose = require('mongoose');

const platformFeeSchema = new mongoose.Schema(
  {
    platformFee: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    gst: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PlatformFee', platformFeeSchema);
