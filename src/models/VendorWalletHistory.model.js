const mongoose = require('mongoose');

const vendorWalletHistorySchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false,
      default: null,
      index: true
    },
    bookingCustomId: {
      type: String,
      required: false,
      default: 'ADMIN-ADJUSTMENT'
    },
    serviceName: {
      type: String,
      default: 'Admin Wallet Adjustment'
    },
    items: [
      {
        name: { type: String },
        variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
        subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 }
      }
    ],
    serviceTotal: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    userGstAmount: {
      type: Number,
      default: 0
    },
    userPaidTotal: {
      type: Number,
      default: 0
    },
    commissionRate: {
      type: Number,
      default: 0
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    platformFeeRate: {
      type: Number,
      required: true,
      default: 0
    },
    platformFeeAmount: {
      type: Number,
      required: true,
      default: 0
    },
    gstRate: {
      type: Number,
      default: 0
    },
    gstAmount: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true
    },
    previousBalance: {
      type: Number,
      required: true,
      default: 0
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0
    },
    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
      default: 'credit'
    },
    description: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('VendorWalletHistory', vendorWalletHistorySchema);
