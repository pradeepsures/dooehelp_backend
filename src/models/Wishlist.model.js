const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        subcategoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subcategory',
          required: true,
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Variant',
          required: true,
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wishlist', wishlistSchema);
