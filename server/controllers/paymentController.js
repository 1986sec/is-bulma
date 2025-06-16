const Payment = require('../models/Payment');
const User = require('../models/User');
const { validatePayment } = require('../utils/validation');
const { clearCache } = require('../utils/cache');
const { sendNotification } = require('../utils/notification');
const logger = require('../utils/logger');

// Create a new payment
exports.createPayment = async (req, res) => {
  try {
    const { error } = validatePayment(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const payment = new Payment({
      ...req.body,
      user: req.user._id,
      createdBy: req.user._id,
    });

    // Calculate end date based on duration and unit
    const endDate = new Date();
    switch (payment.durationUnit) {
      case 'day':
        endDate.setDate(endDate.getDate() + payment.duration);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + payment.duration * 7);
        break;
      case 'month':
        endDate.setMonth(endDate.getMonth() + payment.duration);
        break;
      case 'year':
        endDate.setFullYear(endDate.getFullYear() + payment.duration);
        break;
    }
    payment.endDate = endDate;

    await payment.save();
    await clearCache('payments');

    // Send notification to user
    await sendNotification({
      user: req.user._id,
      type: 'payment',
      title: 'Payment Created',
      message: `Your payment of ${payment.amount} ${payment.currency} has been created`,
      data: {
        paymentId: payment._id,
      },
    });

    logger.info(`Payment created: ${payment._id}`);
    res.status(201).json(payment);
  } catch (error) {
    logger.error(`Error creating payment: ${error.message}`);
    res.status(500).json({ error: 'Error creating payment' });
  }
};

// Update a payment
exports.updatePayment = async (req, res) => {
  try {
    const { error } = validatePayment(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    Object.assign(payment, req.body);
    payment.updatedBy = req.user._id;
    await payment.save();
    await clearCache('payments');

    logger.info(`Payment updated: ${payment._id}`);
    res.json(payment);
  } catch (error) {
    logger.error(`Error updating payment: ${error.message}`);
    res.status(500).json({ error: 'Error updating payment' });
  }
};

// Delete a payment
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await payment.remove();
    await clearCache('payments');

    logger.info(`Payment deleted: ${payment._id}`);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting payment: ${error.message}`);
    res.status(500).json({ error: 'Error deleting payment' });
  }
};

// Get a payment
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('createdBy', 'name email');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(payment);
  } catch (error) {
    logger.error(`Error getting payment: ${error.message}`);
    res.status(500).json({ error: 'Error getting payment' });
  }
};

// Get payments
exports.getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
      type,
      user,
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (user) {
      query.user = user;
    }

    const payments = await Payment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('createdBy', 'name email');

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting payments: ${error.message}`);
    res.status(500).json({ error: 'Error getting payments' });
  }
};

// Get user payments
exports.getUserPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      status,
      type,
    } = req.query;

    const query = {
      user: req.user._id,
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const payments = await Payment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(`Error getting user payments: ${error.message}`);
    res.status(500).json({ error: 'Error getting user payments' });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    payment.status = status;
    payment.updatedBy = req.user._id;
    await payment.save();
    await clearCache('payments');

    // Send notification to user
    await sendNotification({
      user: payment.user,
      type: 'payment_status',
      title: 'Payment Status Updated',
      message: `Your payment status has been updated to ${status}`,
      data: {
        paymentId: payment._id,
      },
    });

    logger.info(`Payment status updated: ${payment._id}`);
    res.json(payment);
  } catch (error) {
    logger.error(`Error updating payment status: ${error.message}`);
    res.status(500).json({ error: 'Error updating payment status' });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await payment.refundPayment(amount, reason);
    await clearCache('payments');

    // Send notification to user
    await sendNotification({
      user: payment.user,
      type: 'payment_refund',
      title: 'Payment Refunded',
      message: `Your payment has been refunded for ${amount} ${payment.currency}`,
      data: {
        paymentId: payment._id,
      },
    });

    logger.info(`Payment refunded: ${payment._id}`);
    res.json(payment);
  } catch (error) {
    logger.error(`Error refunding payment: ${error.message}`);
    res.status(500).json({ error: 'Error refunding payment' });
  }
}; 