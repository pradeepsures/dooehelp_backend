const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
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
    status: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// Index for performance querying on date & type combinations
slotSchema.index({ date: 1, slotType: 1 });

module.exports = mongoose.model('Slot', slotSchema);
