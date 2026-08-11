const mongoose = require('mongoose');

const saveForLaterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
        required: true,
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SaveForLater', saveForLaterSchema);
