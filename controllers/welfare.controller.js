const welfareService = require('../services/welfare.service');

exports.getVouchers = async (req, res) => {
  try {
    const result = await welfareService.getAvailableVouchers();
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.getMyVouchers = async (req, res) => {
  try {
    const result = await welfareService.getUserVouchers(req.user.id);
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.redeemVoucher = async (req, res) => {
  const { voucherId } = req.params;
  try {
    const result = await welfareService.redeemVoucher(req.user.id, parseInt(voucherId));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('Insufficient') || err.message.includes('out of stock') || err.message.includes('not found')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).send('Server Error');
  }
};

exports.exchangeResource = async (req, res) => {
  const { fromCurrency, amount } = req.body;
  try {
    const result = await welfareService.exchangeResource(req.user.id, fromCurrency, parseInt(amount));
    res.json(result);
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('Insufficient') || err.message.includes('Invalid') || err.message.includes('too low')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).send('Server Error');
  }
};
