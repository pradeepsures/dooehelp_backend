const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startingPrice: {
      type: Number,
      min: 0,
      default: 0,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

subcategorySchema.virtual('variants', {
  ref: 'Variant',
  localField: '_id',
  foreignField: 'subCategoryId',
});

module.exports = mongoose.model('Subcategory', subcategorySchema);

