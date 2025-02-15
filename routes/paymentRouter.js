const express = require('express');
const paymentController = require('../controllers/paymentController');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/create-payment', authController.authentication, paymentController.createPayment);
router.get('/payment/callback', paymentController.paymentCallback);

module.exports = router;