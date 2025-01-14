const express = require("express");
const router = express.Router();
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');

// Protect all admin routes with authentication
router.use(authController.authentication);

router.get('/addProduct', adminController.getAddProductPage);
router.post('/addProduct', adminController.postAddProduct);
router.get('/products', adminController.getAdminProducts);
router.get('/edit-product/:productId', adminController.getEditProduct);
router.post('/edit-product', adminController.postEditProduct);
router.post('/delete-product', adminController.postDeleteProduct);

module.exports = router;
