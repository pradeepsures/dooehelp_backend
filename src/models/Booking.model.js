const mongoose = require('mongoose');

const bookingItemSchema = new mongoose.Schema({
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  }
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null,
    },
    items: [bookingItemSchema],
    serviceTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAndFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    slotType: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true,
    },
    address: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAddress',
      required: true,
      cast: function(v) {
        if (!v) return v;
        if (v && typeof v === 'string' && !/^[0-9a-fA-F]{24}$/.test(v)) {
          return null;
        }
        try {
          return new mongoose.Types.ObjectId(v);
        } catch (err) {
          return null;
        }
      }
    },
    location: {
      lat: { type: Number, default: null },
      long: { type: Number, default: null },
    },
    paymentMode: {
      type: String,
      enum: ['online', 'cash'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: ['pending', 'assigned', 'accepted', 'declined', 'completed', 'cancelled', 'scheduled', 'active'],
      default: 'pending',
    },
    beforeWorkImage: {
      type: [String],
      default: [],
    },
    afterWorkImage: {
      type: [String],
      default: [],
    },
    startOtp: {
      type: String,
      default: null,
    },
    startOtpExpiresAt: {
      type: Date,
      default: null,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    declinedVendors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
