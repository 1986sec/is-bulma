const stripe = require('stripe')(process.env.STRIPE_SECRET);
const User = require('../models/User');

exports.buyPremium = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      success_url: process.env.FRONTEND_URL + '/premium/success',
      cancel_url: process.env.FRONTEND_URL + '/premium/cancel',
      customer_email: req.user.email
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ mesaj: 'Ödeme işlemi başarısız', hata: err.message });
  }
};

exports.premiumCallback = async (req, res) => {
  // Stripe webhook ile premium güncelleme işlemi burada yapılır
  res.json({ mesaj: 'Premium callback (demo)' });
}; 