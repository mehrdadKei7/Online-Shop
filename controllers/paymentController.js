const ZarinpalCheckout = require('zarinpal-checkout');
const Order = require('../models/order');

const zarinpal = ZarinpalCheckout.create('00000000-0000-0000-0000-000000000000', true); // Test Merchant ID

exports.createPayment = async (req, res, next) => {
  try {
    await req.user.populate('cart.items.productId');

    const amount = req.user.cart.items.reduce((total, item) => {
      return total + item.quantity * item.productId.price;
    }, 0);

    const description = 'Payment for order';
    const email = req.user.email;

    const response = await zarinpal.PaymentRequest({
      Amount: amount,
      CallbackURL: 'http://localhost:3000/payment/callback',
      Description: description,
      Email: email,
    });

    if (response.status === 100) {
      res.redirect(response.url);
    } else {
      throw new Error('Error in creating payment');
    }
  } catch (err) {
    console.error('Payment request failed:', err);
    res.status(500).send('Payment request failed');
  }
};

exports.paymentCallback = async (req, res, next) => {
  try {
    const { Authority, Status } = req.query;

    if (Status !== 'OK') {
      return res.status(400).send('Payment was canceled by user');
    }

    await req.user.populate('cart.items.productId');

    const amount = req.user.cart.items.reduce((total, item) => {
      return total + item.quantity * item.productId.price;
    }, 0);

    const response = await zarinpal.PaymentVerification({
      Amount: amount,
      Authority: Authority,
    });

    if (response.status === 100) {
      const order = new Order({
        user: {
          name: req.user.firstName+" "+req.user.lastName,
          userId: req.user,
        },
        products: req.user.cart.items.map(i => ({
          quantity: i.quantity,
          product: { ...i.productId._doc },
        })),
        status: 'Paid',
        refId: response.refId
      });

      await order.save();
      await req.user.clearCart();

      res.redirect('/orders');
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (err) {
    console.error('Payment callback error:', err);
    res.status(500).send('An error occurred during payment verification');
  }
};
