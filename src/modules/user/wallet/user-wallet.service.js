const User = require('../../../models/User.model');
const UserWalletHistory = require('../../../models/UserWalletHistory.model');
const AppError = require('../../../core/AppError');

class UserWalletService {
  /**
   * Get user wallet summary (balance and total credits/debits)
   */
  async getWalletSummary(userId) {
    const user = await User.findById(userId).select('walletBalance name phoneNumber referralCode');
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const currentBalance = Number(user.walletBalance) || 0;

    // Aggregate totals from history
    const [stats] = await UserWalletHistory.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalCredited: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'credit'] }, '$amount', 0] }
          },
          totalDebited: {
            $sum: { $cond: [{ $eq: ['$transactionType', 'debit'] }, '$amount', 0] }
          },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    return {
      walletBalance: currentBalance,
      referralCode: user.referralCode,
      totalCredited: stats ? Math.round(stats.totalCredited * 100) / 100 : 0,
      totalDebited: stats ? Math.round(stats.totalDebited * 100) / 100 : 0,
      totalTransactions: stats ? stats.totalTransactions : 0
    };
  }

  /**
   * Get paginated user wallet transactions
   */
  async getWalletHistory(userId, query = {}) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: user._id };
    if (query.type && ['credit', 'debit'].includes(query.type)) {
      filter.transactionType = query.type;
    }

    const [total, transactions] = await Promise.all([
      UserWalletHistory.countDocuments(filter),
      UserWalletHistory.find(filter)
        .populate('referralUserId', 'name phoneNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new UserWalletService();
