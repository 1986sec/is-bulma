import Stripe from 'stripe';
import { config } from './config.js';
import { logger } from './logger.js';

class PaymentManager {
  constructor() {
    this.currency = 'usd';
    this.paymentMethods = {
      card: 'card',
      bankTransfer: 'bank_transfer',
      paypal: 'paypal',
    };
  }

  // Ödeme yöntemi oluştur
  async createPaymentMethod(type, details) {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type,
        ...details,
      });

      logger.info('Ödeme yöntemi oluşturuldu:', {
        type,
        id: paymentMethod.id,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Ödeme yöntemi oluşturma hatası:', {
        type,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme yöntemi ekle
  async attachPaymentMethod(paymentMethodId, customerId) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      logger.info('Ödeme yöntemi eklendi:', {
        paymentMethodId,
        customerId,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Ödeme yöntemi ekleme hatası:', {
        paymentMethodId,
        customerId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme yöntemi kaldır
  async detachPaymentMethod(paymentMethodId) {
    try {
      const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

      logger.info('Ödeme yöntemi kaldırıldı:', {
        paymentMethodId,
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Ödeme yöntemi kaldırma hatası:', {
        paymentMethodId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme yöntemlerini listele
  async listPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      logger.info('Ödeme yöntemleri listelendi:', {
        customerId,
        count: paymentMethods.data.length,
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Ödeme yöntemleri listeleme hatası:', {
        customerId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme oluştur
  async createPayment(amount, currency, paymentMethodId, customerId) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        payment_method: paymentMethodId,
        customer: customerId,
        confirm: true,
      });

      logger.info('Ödeme oluşturuldu:', {
        amount,
        currency,
        paymentMethodId,
        customerId,
        id: paymentIntent.id,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Ödeme oluşturma hatası:', {
        amount,
        currency,
        paymentMethodId,
        customerId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme onayla
  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      logger.info('Ödeme onaylandı:', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Ödeme onaylama hatası:', {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme iptal et
  async cancelPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

      logger.info('Ödeme iptal edildi:', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Ödeme iptal etme hatası:', {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödeme bilgilerini al
  async getPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      logger.info('Ödeme bilgileri alındı:', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Ödeme bilgileri alma hatası:', {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }

  // Ödemeleri listele
  async listPayments(customerId) {
    try {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
      });

      logger.info('Ödemeler listelendi:', {
        customerId,
        count: paymentIntents.data.length,
      });

      return paymentIntents.data;
    } catch (error) {
      logger.error('Ödemeleri listeleme hatası:', {
        customerId,
        error: error.message,
      });
      throw error;
    }
  }

  // İade oluştur
  async createRefund(paymentIntentId, amount) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });

      logger.info('İade oluşturuldu:', {
        paymentIntentId,
        amount,
        id: refund.id,
      });

      return refund;
    } catch (error) {
      logger.error('İade oluşturma hatası:', {
        paymentIntentId,
        amount,
        error: error.message,
      });
      throw error;
    }
  }

  // İade bilgilerini al
  async getRefund(refundId) {
    try {
      const refund = await stripe.refunds.retrieve(refundId);

      logger.info('İade bilgileri alındı:', {
        refundId,
        status: refund.status,
      });

      return refund;
    } catch (error) {
      logger.error('İade bilgileri alma hatası:', {
        refundId,
        error: error.message,
      });
      throw error;
    }
  }

  // İadeleri listele
  async listRefunds(paymentIntentId) {
    try {
      const refunds = await stripe.refunds.list({
        payment_intent: paymentIntentId,
      });

      logger.info('İadeler listelendi:', {
        paymentIntentId,
        count: refunds.data.length,
      });

      return refunds.data;
    } catch (error) {
      logger.error('İadeleri listeleme hatası:', {
        paymentIntentId,
        error: error.message,
      });
      throw error;
    }
  }
}

const payment = new PaymentManager();
export { payment };
export default payment; 