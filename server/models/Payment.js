const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'TRY'],
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  type: {
    type: String,
    enum: ['subscription', 'featured_job', 'premium_profile', 'other'],
    required: true,
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    default: 'basic',
  },
  duration: {
    type: Number,
    default: 1,
  },
  durationUnit: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    default: 'month',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer', 'other'],
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  refund: {
    amount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// İndeksler
paymentSchema.index({ user: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ endDate: 1 });

// Sanal alanlar
paymentSchema.virtual('userDetails', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
});

// Metodlar
paymentSchema.methods.toJSON = function() {
  const payment = this.toObject();
  delete payment.__v;
  return payment;
};

paymentSchema.methods.isActive = function() {
  return this.status === 'completed' && new Date() <= this.endDate;
};

paymentSchema.methods.refundPayment = async function(amount, reason) {
  if (this.status !== 'completed') {
    throw new Error('Only completed payments can be refunded');
  }

  if (amount > this.amount) {
    throw new Error('Refund amount cannot be greater than payment amount');
  }

  this.status = 'refunded';
  this.refund = {
    amount,
    reason,
    date: new Date(),
  };

  await this.save();
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 