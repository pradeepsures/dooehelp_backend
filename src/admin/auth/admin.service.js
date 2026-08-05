const BaseService = require('../../core/BaseService');
const adminRepository = require('./admin.repository');
const AppError = require('../../core/AppError');
const jwt = require('jsonwebtoken');

class AdminService extends BaseService {
  constructor() {
    super(adminRepository, 'admin');
  }

  generateAuthTokens(admin) {
    const secret = process.env.JWT_SECRET || 'supersecret_doorhelp_key';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';
    
    const accessToken = jwt.sign({ _id: admin._id.toString(), role: admin.role }, secret, { expiresIn: '24h' });
    const refreshToken = jwt.sign({ _id: admin._id.toString(), role: admin.role }, refreshSecret, { expiresIn: '7d' });
    
    return { accessToken, refreshToken };
  }

  async register(data) {
    this.logger.info({ email: data.email }, 'register initiated');
    
    const existingAdmin = await this.repository.findByEmail(data.email);
    if (existingAdmin) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    const admin = await this.create(data);
    const { accessToken, refreshToken } = this.generateAuthTokens(admin);

    return { admin, accessToken, refreshToken };
  }

  async login(email, password) {
    this.logger.info({ email }, 'login initiated');

    // Because BaseRepository.findByEmail could lean() by default and we need the document method comparePassword, 
    // let's explicitly request a mongoose doc, or find it directly via model.
    const admin = await this.repository.model.findOne({ email });
    if (!admin) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const { accessToken, refreshToken } = this.generateAuthTokens(admin);

    return { admin, accessToken, refreshToken };
  }

  async refreshToken(token) {
    if (!token) {
      throw new AppError('Refresh token is required', 400, 'TOKEN_REQUIRED');
    }

    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'supersecret_doorhelp_refresh_key';
      const decoded = jwt.verify(token, refreshSecret);

      const admin = await this.repository.findById(decoded._id);
      if (!admin) {
        throw new AppError('Admin not found', 404, 'NOT_FOUND');
      }

      const { accessToken, refreshToken: newRefreshToken } = this.generateAuthTokens(admin);
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
    }
  }
}

module.exports = new AdminService();
