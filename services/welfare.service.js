const db = require('../config/database');
const notificationService = require('./notification.service');

class WelfareService {
  /**
   * Lấy danh sách voucher hiện có
   */
  async getAvailableVouchers() {
    const vouchers = await db.findMany('vouchers', { isActive: true });
    return { success: true, data: vouchers };
  }

  /**
   * Lấy danh sách voucher của user
   */
  async getUserVouchers(userId) {
    const userVouchers = await db.findMany('user_vouchers', { userId: parseInt(userId) });
    
    // Enrich with voucher details
    const enriched = await Promise.all(userVouchers.map(async (uv) => {
      const voucher = await db.findById('vouchers', uv.voucherId);
      return { ...uv, voucher };
    }));

    return { success: true, data: enriched };
  }

  /**
   * Quy đổi tài nguyên sang P-coin
   */
  async exchangeResource(userId, fromCurrency, amount) {
    const progress = await db.findOne('game_progress', { userId: parseInt(userId) });
    if (!progress) throw new Error('User progress not found');

    // Exchange Rates (Mocked for now)
    const rates = {
      'coins': 0.1, // 10 coins = 1 P-coin
      'petals': 1   // 1 petal = 1 P-coin
    };

    const rate = rates[fromCurrency];
    if (!rate) throw new Error('Invalid currency type');

    if ((progress[fromCurrency] || 0) < amount) {
      throw new Error('Insufficient funds');
    }

    const pcoinGain = Math.floor(amount * rate);
    if (pcoinGain <= 0) throw new Error('Amount too low for exchange');

    // Update Progress
    const updatedData = {
      [fromCurrency]: progress[fromCurrency] - amount,
      // P-coin is stored in game_progress (as per existing db.json shop reference)
      // If P-coin wasn't there, we'd add it, but based on shop.controller, it seems to be a currency
      pcoin: (progress.pcoin || 0) + pcoinGain
    };

    await db.update('game_progress', progress.id, updatedData);

    // Create History entry
    const historyEntry = await db.create('welfare_history', {
      userId: parseInt(userId),
      type: 'exchange',
      details: {
        fromCurrency,
        fromAmount: amount,
        toCurrency: 'pcoin',
        toAmount: pcoinGain,
        rate
      },
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      data: {
        pcoinGained: pcoinGain,
        newBalance: updatedData.pcoin,
        historyId: historyEntry.id
      }
    };
  }

  /**
   * Đổi Voucher
   */
  async redeemVoucher(userId, voucherId) {
    const voucher = await db.findById('vouchers', voucherId);
    if (!voucher || !voucher.isActive) throw new Error('Voucher not found or inactive');

    if (voucher.remainingQuantity <= 0) throw new Error('Voucher out of stock');

    const progress = await db.findOne('game_progress', { userId: parseInt(userId) });
    if (!progress) throw new Error('User progress not found');

    // Check price
    const price = voucher.price;
    const currency = voucher.currencyType; // e.g., 'coins', 'petals', 'pcoin'

    if ((progress[currency] || 0) < price) {
      throw new Error(`Insufficient ${currency}`);
    }

    // Deduct and Update
    await db.update('game_progress', progress.id, {
      [currency]: progress[currency] - price
    });

    // Update Voucher Quantity
    await db.update('vouchers', voucher.id, {
      remainingQuantity: voucher.remainingQuantity - 1
    });

    // Generate Voucher Code
    const code = `${voucher.provider.toUpperCase().replace(/\s/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create User Voucher
    const userVoucher = await db.create('user_vouchers', {
      userId: parseInt(userId),
      voucherId: parseInt(voucherId),
      code,
      redeemedAt: new Date().toISOString(),
      isUsed: false,
      createdAt: new Date().toISOString()
    });

    // Notify user
    try {
      await notificationService.notify(
        userId,
        'Đổi quà thành công! 🎁',
        `Bạn đã đổi thành công voucher "${voucher.title}". Kiểm tra mã quà tặng trong mục Phúc Lợi!`,
        'reward',
        userVoucher.id
      );
    } catch (e) {
      console.error('Notification failed', e);
    }

    return {
      success: true,
      data: {
        userVoucherId: userVoucher.id,
        code,
        message: 'Redeemed successfully'
      }
    };
  }

  // Admin Methods
  async getWelfareStats() {
    const vouchers = await db.findAll('vouchers');
    const redemptions = await db.findAll('user_vouchers');
    const history = await db.findAll('welfare_history');

    return {
      success: true,
      data: {
        totalVouchers: vouchers.length,
        totalRedemptions: redemptions.length,
        totalExchanges: history.filter(h => h.type === 'exchange').length,
        activeVouchers: vouchers.filter(v => v.isActive).length
      }
    };
  }
}

module.exports = new WelfareService();
