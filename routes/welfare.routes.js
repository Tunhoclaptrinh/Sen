const express = require('express');
const router = express.Router();
const welfareController = require('../controllers/welfare.controller');
const { protect } = require('../middleware/auth.middleware');

// All welfare routes are protected
router.use(protect);

router.get('/vouchers', welfareController.getVouchers);
router.get('/my-vouchers', welfareController.getMyVouchers);
router.post('/vouchers/:voucherId/redeem', welfareController.redeemVoucher);
router.post('/exchange', welfareController.exchangeResource);

module.exports = router;
