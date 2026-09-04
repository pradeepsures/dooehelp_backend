const referAndEarnRepository = require('./refer-earn.repository');
const User = require('../../../models/User.model');
const UserWalletHistory = require('../../../models/UserWalletHistory.model');
const AppError = require('../../../core/AppError');

class UserReferAndEarnService {
  /**
   * Get active Refer and Earn dynamic configuration
   */
  async getActiveConfig() {
    const config = await referAndEarnRepository.findOne({ status: 'active', isDeleted: false });
    if (!config) return null;
    return config.toObject ? config.toObject() : config;
  }

  /**
   * Validate a referral code against active campaign and referrer status
   */
  async validateReferralCode(referralCode, candidatePhoneNumber = null) {
    if (!referralCode || typeof referralCode !== 'string') {
      throw new AppError('Referral code is required', 400, 'INVALID_REFERRAL');
    }

    const code = referralCode.trim().toUpperCase();

    // 1. Check active configuration
    const config = await referAndEarnRepository.findOne({ status: 'active', isDeleted: false });
    if (!config) {
      throw new AppError('Referral program is currently inactive or not available', 400, 'REFERRAL_INACTIVE');
    }

    // 2. Find the referring user by referral code
    const referrer = await User.findOne({
      referralCode: { $regex: new RegExp(`^${code}$`, 'i') },
      isDeleted: false
    });

    if (!referrer) {
      throw new AppError('Invalid referral code', 400, 'INVALID_REFERRAL');
    }

    // 4. Prevent self-referral by phone number
    if (candidatePhoneNumber && referrer.phoneNumber === candidatePhoneNumber) {
      throw new AppError('You cannot use your own referral code', 400, 'SELF_REFERRAL');
    }

    // 5. Check if the referring user is active / not expired
    if (referrer.status === false || referrer.isDeleted === true) {
      throw new AppError('Referral code has expired or is no longer valid', 400, 'REFERRAL_EXPIRED');
    }

    return {
      isValid: true,
      config,
      referrer
    };
  }

  /**
   * Process referral reward for direct 2-user flow:
   * Referrer (A) receives referrerBonus (e.g. 50)
   * New User (B) receives referredUserBonus (e.g. 25)
   */
  async processReferralReward({ newUser, referrerCode }) {
    if (!newUser || !referrerCode) return null;

    // Check if new user already claimed referral bonus
    if (newUser.isReferralRewardClaimed) {
      return null;
    }

    // Validate referral code and active program
    const { config, referrer } = await this.validateReferralCode(referrerCode, newUser.phoneNumber);

    const referrerBonus = Number(config.referrerBonus) || 0;
    const referredUserBonus = Number(config.referredUserBonus) || 0;

    // 1. Credit New User's Wallet
    const newUserPrevBalance = Number(newUser.walletBalance) || 0;
    const newUserNewBalance = Math.round((newUserPrevBalance + referredUserBonus) * 100) / 100;

    newUser.walletBalance = newUserNewBalance;
    newUser.isReferralRewardClaimed = true;
    newUser.referredBy = referrer.referralCode;
    newUser.referredByUserId = referrer._id;
    await newUser.save();

    await UserWalletHistory.create({
      userId: newUser._id,
      transactionType: 'credit',
      amount: referredUserBonus,
      previousBalance: newUserPrevBalance,
      currentBalance: newUserNewBalance,
      description: `Referral welcome bonus for joining with code ${referrer.referralCode}`,
      source: 'referral',
      referralUserId: referrer._id,
      referralCode: referrer.referralCode,
      date: new Date()
    });

    // 2. Credit Direct Referrer's Wallet
    const referrerPrevBalance = Number(referrer.walletBalance) || 0;
    const referrerNewBalance = Math.round((referrerPrevBalance + referrerBonus) * 100) / 100;

    referrer.walletBalance = referrerNewBalance;
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    referrer.totalReferralEarnings = (referrer.totalReferralEarnings || 0) + referrerBonus;
    await referrer.save();

    await UserWalletHistory.create({
      userId: referrer._id,
      transactionType: 'credit',
      amount: referrerBonus,
      previousBalance: referrerPrevBalance,
      currentBalance: referrerNewBalance,
      description: `Referral reward for inviting ${newUser.name || newUser.phoneNumber}`,
      source: 'referral',
      referralUserId: newUser._id,
      referralCode: referrer.referralCode,
      date: new Date()
    });

    // 3. Trigger push notifications safely
    try {
      const notificationService = require('../../../services/notification.service');
      
      // Notify referrer
      notificationService.sendToUser(referrer._id, {
        title: 'Referral Reward Received! 🎉',
        body: `You earned ₹${referrerBonus}! ${newUser.name || 'A friend'} joined using your referral code. Wallet balance: ₹${referrerNewBalance}`,
        data: {
          type: 'REFERRAL_CREDIT',
          amount: String(referrerBonus),
          currentBalance: String(referrerNewBalance)
        }
      }).catch(err => console.error('Referral push error (referrer):', err.message));

      // Notify new user
      notificationService.sendToUser(newUser._id, {
        title: 'Welcome Bonus Credited! 🎁',
        body: `₹${referredUserBonus} referral bonus has been added to your DoorHelp wallet. Wallet balance: ₹${newUserNewBalance}`,
        data: {
          type: 'REFERRAL_CREDIT',
          amount: String(referredUserBonus),
          currentBalance: String(newUserNewBalance)
        }
      }).catch(err => console.error('Referral push error (new user):', err.message));
    } catch (pushErr) {
      console.error('Notification dispatch error:', pushErr.message);
    }

    return {
      success: true,
      referrerBonus,
      referredUserBonus,
      referrerNewBalance,
      newUserNewBalance
    };
  }

  /**
   * Get personal referral stats for logged-in user
   */
  async getMyReferralStats(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // Ensure user has a referral code
    if (!user.referralCode) {
      const namePrefix = (user.name || 'USER').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      user.referralCode = `${namePrefix}${randomNum}`;
      await user.save();
    }

    const config = await this.getActiveConfig();

    // Fetch list of users referred by this user
    const referredUsers = await User.find({
      referredByUserId: user._id,
      isDeleted: false
    })
      .select('name phoneNumber createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const maskedReferredUsers = referredUsers.map(u => ({
      name: u.name || 'DoorHelp User',
      phoneNumber: u.phoneNumber ? u.phoneNumber.slice(0, 2) + '******' + u.phoneNumber.slice(-2) : '',
      joinedAt: u.createdAt
    }));

    return {
      referralCode: user.referralCode,
      walletBalance: user.walletBalance || 0,
      referralCount: user.referralCount || 0,
      totalReferralEarnings: user.totalReferralEarnings || 0,
      program: config ? {
        title: config.title,
        referrerBonus: config.referrerBonus,
        referredUserBonus: config.referredUserBonus,
        description: config.description,
        status: config.status
      } : null,
      shareMessage: config
        ? `Join DoorHelp using my referral code ${user.referralCode} and get ₹${config.referredUserBonus} in your wallet!`
        : `Join DoorHelp using my referral code ${user.referralCode}!`,
      referredUsers: maskedReferredUsers
    };
  }

  /**
   * Apply referral code for an authenticated user (e.g. on referral screen after OTP login)
   */
  async applyReferralCode(userId, referralCode) {
    if (!referralCode || typeof referralCode !== 'string') {
      throw new AppError('Referral code is required', 400, 'INVALID_REFERRAL');
    }

    const trimmedCode = referralCode.trim().toUpperCase();

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    // 1. Check if user already claimed referral or already has a referrer
    if (user.isReferralRewardClaimed || user.referredBy) {
      throw new AppError('You have already applied a referral code', 400, 'ALREADY_CLAIMED');
    }

    // 2. Prevent applying own referral code
    if (user.referralCode && user.referralCode.toUpperCase() === trimmedCode) {
      throw new AppError('You cannot use your own referral code', 400, 'SELF_REFERRAL');
    }

    // 3. Process referral reward (validates program active, referrer existence and status)
    const rewardResult = await this.processReferralReward({
      newUser: user,
      referrerCode: trimmedCode
    });

    if (!rewardResult) {
      throw new AppError('Unable to apply referral code', 400, 'REFERRAL_FAILED');
    }

    // Re-fetch fresh user
    const freshUser = await User.findById(userId);

    return {
      message: `Referral code applied successfully! ₹${rewardResult.referredUserBonus} has been credited to your wallet.`,
      creditedAmount: rewardResult.referredUserBonus,
      walletBalance: freshUser.walletBalance,
      isReferralRewardClaimed: true,
      referredBy: freshUser.referredBy
    };
  }
}

module.exports = new UserReferAndEarnService();
