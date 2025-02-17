const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Allow access to login and register pages without authentication
router.get('/login', authController.getLoginPage);
router.post('/login',  authController.postLogin);
router.get('/register', authController.getRegisterPage);
router.post('/register', authController.postRegisterUser);
router.get('/dashboard', authController.authentication, authController.dashboardPage);
router.get('/verify/:token', authController.validToken);
router.get('/login/forgetPass', authController.getForgetPassPage);
router.post('/login/forgetPass', authController.postForgetPass);
router.get('/login/newPass/:token', authController.getNewPassPage);
router.post('/login/newPass', authController.postNewPass);
router.get('/logout', authController.logout);

module.exports = router;
