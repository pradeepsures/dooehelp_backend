const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    required: true,
  },
  page: {
    type: String,
    enum: ['privacy_policy', 'terms_and_conditions', 'about'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Ensure only one page type exists per user type (e.g., only one privacy_policy for user)
cmsSchema.index({ type: 1, page: 1 }, { unique: true });

module.exports = mongoose.model('Cms', cmsSchema);
