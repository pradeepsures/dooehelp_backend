const BaseService = require('../../core/BaseService');
const vendorRepository = require('../../modules/vendor/auth/vendor.repository');
const AppError = require('../../core/AppError');

class AdminVendorService extends BaseService {
  constructor() {
    super(vendorRepository, 'admin-vendor');
  }

  async listAll(query = {}) {
    const filter = { isDeleted: false };
    if (query.status !== undefined && query.status !== '') filter.status = query.status;
    if (query.isVerified !== undefined && query.isVerified !== '') filter.isVerified = query.isVerified === 'true';

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { phoneNumber: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      sort: { createdAt: -1 },
      populate: ['categories', 'localities']
    };

    return this.getAll(filter, options);
  }

  async getOne(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false }, { populate: ['categories', 'localities'] });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    return vendor;
  }

  async approveVendor(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');

    return this.repository.updateById(id, {
      isVerified: true,
      status: 'active',
      isProfileApproved: true
    });
  }

  async rejectVendor(id) {
    const vendor = await this.repository.findOne({ _id: id, isDeleted: false });
    if (!vendor) throw new AppError('Vendor not found', 404, 'NOT_FOUND');

    return this.repository.updateById(id, {
      isVerified: false,
      status: 'inactive',
      isProfileApproved: false
    });
  }

  async adjustWalletBalance(vendorId, { amount, type, description }, adminId) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      throw new AppError('Amount must be a positive number greater than 0', 400, 'BAD_REQUEST');
    }

    if (type !== 'credit' && type !== 'debit') {
      throw new AppError('Transaction type must be either credit or debit', 400, 'BAD_REQUEST');
    }

    const Vendor = require('../../models/Vendor.model');
    const vendor = await Vendor.findOne({ _id: vendorId, isDeleted: false });
    if (!vendor) {
      throw new AppError('Vendor not found', 404, 'NOT_FOUND');
    }

    const previousBalance = Number(vendor.walletBalance) || 0;
    if (type === 'debit' && previousBalance < numAmount) {
      throw new AppError(`Cannot debit ₹${numAmount}. Vendor's current balance is only ₹${previousBalance}`, 400, 'INSUFFICIENT_BALANCE');
    }

    const currentBalance = type === 'credit'
      ? Math.round((previousBalance + numAmount) * 100) / 100
      : Math.round((previousBalance - numAmount) * 100) / 100;

    const VendorWalletHistory = require('../../models/VendorWalletHistory.model');
    const transaction = await VendorWalletHistory.create({
      vendorId: vendor._id,
      bookingCustomId: 'ADMIN-ADJUSTMENT',
      serviceName: `Admin Manual ${type.toUpperCase()}`,
      serviceTotal: numAmount,
      platformFeeRate: 0,
      platformFeeAmount: 0,
      amount: numAmount,
      previousBalance,
      currentBalance,
      transactionType: type,
      description: description || `Manual ${type} by admin`,
      date: new Date()
    });

    vendor.walletBalance = currentBalance;
    await vendor.save();

    return {
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        phoneNumber: vendor.phoneNumber,
        walletBalance: vendor.walletBalance
      },
      transaction
    };
  }
}

module.exports = new AdminVendorService();
