const BaseController = require('../utils/BaseController');
const welfareService = require('../services/welfare.service');

class WelfareAdminController extends BaseController {
  constructor() {
    super(welfareService);
  }

  getStats = async (req, res, next) => {
    try {
      const result = await this.service.getWelfareStats();
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new WelfareAdminController();
