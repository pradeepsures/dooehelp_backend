const mongoose = require('mongoose');

const referAndEarnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'Refer and Earn',
      trim: true,
    },
    referrerBonus: {
      type: Number,
      required: true,
      min: 0,
    },
    referredUserBonus: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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

module.exports = mongoose.model('ReferAndEarn', referAndEarnSchema);
