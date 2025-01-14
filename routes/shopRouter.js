const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const authController = require('../controllers/authController');


// Public routes for shop
router.get('/', authController.checkAuth ,shopController.getIndex);
router.get('/products/:productId', shopController.getDetails);
router.get('/products-list', authController.checkAuth ,shopController.getProductsList);

// Protect cart and order routes with authentication
router.post('/cart', authController.authentication , shopController.postCart);
router.get('/cart', authController.authentication, shopController.getCart);
router.post('/cart-delete-item', authController.authentication, shopController.postCartDeleteProduct);
router.post('/create-order', authController.authentication, shopController.postOrder);
router.get('/orders', authController.authentication, shopController.getOrder);

module.exports = router;
