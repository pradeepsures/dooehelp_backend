const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
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

// Remove sensitive or unnecessary fields from JSON responses
bannerSchema.methods.toJSON = function () {
  const banner = this.toObject();
  delete banner.__v;
  delete banner.isDeleted;
  return banner;
};

module.exports = mongoose.model('Banner', bannerSchema);
