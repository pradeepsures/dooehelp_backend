const BaseService = require('../../../core/BaseService');
const userRepository = require('./user.repository');
const userReferAndEarnService = require('../refer-earn/refer-earn.service');
const AppError = require('../../../core/AppError');
const jwt = require('jsonwebtoken');

class UserAuthService extends BaseService {
  constructor() {
    super(userRepository, 'user');
  }

  generateOTP() {
    return '1234';
  }

  generateAuthTokens(user) {
    const secret = process.env.JWT_SECRET || 'supersecret_doorhelp_key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';

    // accessToken expires in 15 minutes, refreshToken expires in 7 days
    const accessToken = jwt.sign({ _id: user._id.toString(), role: user.role }, secret, { expiresIn: '7h' });
    const refreshToken = jwt.sign({ _id: user._id.toString(), role: user.role }, refreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async register(userData) {
    this.logger.info({ phoneNumber: userData.phoneNumber }, 'register initiated');

    // 1. Check if user already exists
    const existingUser = await this.repository.findByPhone(userData.phoneNumber);
    if (existingUser) {
      throw new AppError('User with this phone number already exists', 400, 'USER_EXISTS');
    }
    if (userData.email) {
      const existingEmail = await this.repository.findOne({ email: userData.email });
      if (existingEmail) {
        throw new AppError('User with this email already exists', 400, 'USER_EXISTS');
      }
    }

    // 2. Validate referral code if provided
    let referralValidation = null;
    if (userData.referredBy) {
      referralValidation = await userReferAndEarnService.validateReferralCode(
        userData.referredBy,
        userData.phoneNumber
      );
    }

    // 3. Generate OTP and save user
    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    userData.otp = otp;
    userData.otpExpiresAt = otpExpiresAt;

    const newUser = await this.create(userData);
    this.logger.info({ userId: newUser._id }, 'New user registered');

    // 4. Process referral reward if referral code was provided and validated
    if (referralValidation && userData.referredBy) {
      try {
        await userReferAndEarnService.processReferralReward({
          newUser,
          referrerCode: userData.referredBy
        });
      } catch (err) {
        this.logger.error({ err: err.message }, 'Failed to process referral reward during registration');
      }
    }

    console.log(`[MOCK SMS] OTP for ${newUser.phoneNumber} is: ${otp}`);

    // Re-fetch user to reflect any wallet updates from referral reward
    const freshUser = await this.repository.findById(newUser._id);

    return {
      message: 'User registered and OTP sent successfully',
      user: freshUser || newUser
    };
  }

  async sendOtp(phoneNumber) {
    this.logger.info({ phoneNumber }, 'sendOtp initiated');

    let user = await this.repository.findByPhone(phoneNumber);

    const otp = this.generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (!user) {
      user = await this.create({ phoneNumber, otp, otpExpiresAt });
      this.logger.info({ userId: user._id }, 'New user created during OTP generation');
    } else {
      user = await this.repository.updateById(user._id, { otp, otpExpiresAt });
    }

    console.log(`[MOCK SMS] OTP for ${phoneNumber} is: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phoneNumber, otp, deviceData = {}) {
    this.logger.info({ phoneNumber }, 'verifyOtp initiated');

    const user = await this.repository.findByPhone(phoneNumber);
    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    if (user.otp !== otp) {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    if (new Date() > new Date(user.otpExpiresAt)) {
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    // OTP is valid. Generate token.
    const { accessToken, refreshToken } = this.generateAuthTokens(user);

    // Clear OTP and update device tokens if provided
    const updatePayload = {
      $unset: { otp: 1, otpExpiresAt: 1 }
    };

    if (deviceData.fcmToken !== undefined && deviceData.fcmToken !== '') {
      updatePayload.fcmToken = deviceData.fcmToken;
    }
    if (deviceData.deviceId !== undefined && deviceData.deviceId !== '') {
      updatePayload.deviceId = deviceData.deviceId;
    }

    let updatedUser = await this.repository.updateById(user._id, updatePayload);

    // Ensure user has a referral code
    if (!updatedUser.referralCode) {
      const User = require('../../../models/User.model');
      const code = User.generateReferralCode
        ? User.generateReferralCode(updatedUser.name)
        : 'USER' + Math.floor(1000 + Math.random() * 9000);
      await User.findByIdAndUpdate(updatedUser._id, { referralCode: code });
      updatedUser.referralCode = code;
    }

    // If referredBy is passed during OTP verification and user hasn't claimed bonus yet
    const referralCodeToUse = deviceData.referredBy || (!updatedUser.isReferralRewardClaimed ? updatedUser.referredBy : null);
    if (referralCodeToUse && !updatedUser.isReferralRewardClaimed) {
      try {
        await userReferAndEarnService.processReferralReward({
          newUser: updatedUser,
          referrerCode: referralCodeToUse
        });
        updatedUser = await this.repository.findById(user._id);
      } catch (err) {
        this.logger.error({ err: err.message }, 'Referral processing error during verifyOtp');
      }
    }

    return {
      user: updatedUser,
      accessToken,
      refreshToken,
      referralCode: updatedUser.referralCode,
      isReferralRewardClaimed: updatedUser.isReferralRewardClaimed || false,
      walletBalance: updatedUser.walletBalance || 0,
      isNewUser: !updatedUser.name
    };
  }

  async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token is required', 400, 'TOKEN_REQUIRED');
    }

    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';
      const decoded = jwt.verify(token, refreshSecret);

      const user = await this.repository.findById(decoded._id);
      if (!user) {
        throw new AppError('User not found', 404, 'NOT_FOUND');
      }

      // Generate only a new access token
      const secret = process.env.JWT_SECRET || 'supersecret_doorhelp_key';
      const accessToken = jwt.sign({ _id: user._id.toString(), role: user.role }, secret, { expiresIn: '2h' });

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }
}

module.exports = new UserAuthService();
