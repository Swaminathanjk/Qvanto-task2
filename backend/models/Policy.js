const mongoose = require('mongoose');

const approvalLogSchema = new mongoose.Schema({
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approverName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected'],
    required: true
  },
  comment: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const policySchema = new mongoose.Schema({
  policyId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  premiumAmount: {
    type: Number,
    required: true,
    min: 0
  },
  productType: {
    type: String,
    required: true,
    enum: ['life', 'health', 'auto', 'home', 'business']
  },
  status: {
    type: String,
    enum: ['draft', 'pending_underwriter', 'pending_manager', 'approved', 'rejected'],
    default: 'draft'
  },
  fraudCheck: {
    passed: {
      type: Boolean,
      default: false
    },
    checkedAt: {
      type: Date,
      default: null
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  approvalLogs: [approvalLogSchema],
  // Additional fields for better tracking
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the updatedAt field before saving
policySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Policy', policySchema);
