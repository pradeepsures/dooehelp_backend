const BaseService = require('../../../core/BaseService');
const vendorRepository = require('./vendor.repository');
const AppError = require('../../../core/AppError');
const jwt = require('jsonwebtoken');

class VendorAuthService extends BaseService {
  constructor() {
    super(vendorRepository, 'vendor');
  }

  generateOTP() {
    return '1234';
  }

  generateAuthTokens(vendor) {
    const secret = process.env.JWT_SECRET || 'supersecret_doorhelp_key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';

    const accessToken = jwt.sign({ _id: vendor._id.toString(), role: vendor.role }, secret, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ _id: vendor._id.toString(), role: vendor.role }, refreshSecret, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async sendOtp(phoneNumber) {
    this.logger.info({ phoneNumber }, 'sendOtp vendor initiated');

    let vendor = await this.repository.findByPhone(phoneNumber);

    const otp = "1234"; // Static OTP for testing
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (!vendor) {
      vendor = await this.create({ phoneNumber, otp, otpExpiresAt });
      this.logger.info({ vendorId: vendor._id }, 'New vendor created during OTP generation');
    } else {
      vendor = await this.repository.updateById(vendor._id, { otp, otpExpiresAt });
    }

    console.log(`[MOCK SMS VENDOR] OTP for ${phoneNumber} is: ${otp}`);

    return { message: 'OTP sent successfully to vendor' };
  }

  async verifyOtp(phoneNumber, otp) {
    this.logger.info({ phoneNumber }, 'verifyOtp vendor initiated');

    const vendor = await this.repository.findByPhone(phoneNumber);
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    }

    if (vendor.otp !== otp) {
      throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
    }

    if (new Date() > new Date(vendor.otpExpiresAt)) {
      throw new AppError('OTP has expired', 400, 'OTP_EXPIRED');
    }

    const { accessToken, refreshToken } = this.generateAuthTokens(vendor);

    const updatedVendor = await this.repository.updateById(vendor._id, {
      $unset: { otp: 1, otpExpiresAt: 1 }
    });

    return { vendor: updatedVendor, accessToken, refreshToken };
  }

  async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token is required', 400, 'TOKEN_REQUIRED');
    }

    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';
      const decoded = jwt.verify(token, refreshSecret);

      const vendor = await this.repository.findById(decoded._id);
      if (!vendor) {
        throw new AppError('Vendor not found', 404, 'NOT_FOUND');
      }

      const { accessToken } = this.generateAuthTokens(vendor);
      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }
}

module.exports = new VendorAuthService();
