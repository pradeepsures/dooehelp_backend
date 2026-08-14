const catchAsync = require('../../core/catchAsync');
const User = require('../../models/User.model');
const Vendor = require('../../models/Vendor.model');
const Booking = require('../../models/Booking.model');
const { sendSuccess } = require('../../core/response');

exports.getOverviewStats = catchAsync(async (req, res) => {
  // 1. Core counters
  const totalUsers = await User.countDocuments({ isDeleted: false });
  const totalVendors = await Vendor.countDocuments({ isDeleted: false });
  const totalJobsCompleted = await Booking.countDocuments({ bookingStatus: 'completed' });
  const totalActiveBookings = await Booking.countDocuments({ bookingStatus: 'active' });
  
  // Total pending, assigned, accepted, cancelled for comparison
  const totalPendingBookings = await Booking.countDocuments({ bookingStatus: 'pending' });
  const totalAssignedBookings = await Booking.countDocuments({ bookingStatus: 'assigned' });
  const totalAcceptedBookings = await Booking.countDocuments({ bookingStatus: 'accepted' });
  const totalCancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });

  // 2. Earnings aggregation (Total Earnings of completed bookings)
  const earningsResult = await Booking.aggregate([
    {
      $match: {
        bookingStatus: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$grandTotal' }
      }
    }
  ]);
  const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

  // 3. Time based earnings groupings (charts)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  
  // Start of this year
  const startOfYear = new Date(currentYear, 0, 1);
  // Start of this month
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  
  // Start of this week (Monday)
  const tempDate = new Date(today);
  const day = tempDate.getDay();
  const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const startOfWeek = new Date(tempDate.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  // Aggregation - Weekly Earnings (by day of week)
  const weeklyEarningsRaw = await Booking.aggregate([
    {
      $match: {
        bookingStatus: 'completed',
        date: { $gte: startOfWeek }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        earnings: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  // $dayOfWeek returns 1 (Sunday) to 7 (Saturday)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyEarnings = daysOfWeek.map((dayName, idx) => {
    const match = weeklyEarningsRaw.find(w => w._id === (idx + 1));
    return {
      day: dayName,
      earnings: match ? match.earnings : 0,
      count: match ? match.count : 0
    };
  });

  // Aggregation - Monthly Earnings (by day of month)
  const monthlyEarningsRaw = await Booking.aggregate([
    {
      $match: {
        bookingStatus: 'completed',
        date: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: { $dayOfMonth: '$date' },
        earnings: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthlyEarnings = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const match = monthlyEarningsRaw.find(m => m._id === i);
    monthlyEarnings.push({
      day: i.toString(),
      earnings: match ? match.earnings : 0,
      count: match ? match.count : 0
    });
  }

  // Aggregation - Yearly Earnings (by month)
  const yearlyEarningsRaw = await Booking.aggregate([
    {
      $match: {
        bookingStatus: 'completed',
        date: { $gte: startOfYear }
      }
    },
    {
      $group: {
        _id: { $month: '$date' },
        earnings: { $sum: '$grandTotal' },
        count: { $sum: 1 }
      }
    }
  ]);

  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearlyEarnings = monthsOfYear.map((monthName, idx) => {
    const match = yearlyEarningsRaw.find(m => m._id === (idx + 1));
    return {
      month: monthName,
      earnings: match ? match.earnings : 0,
      count: match ? match.count : 0
    };
  });

  const responseData = {
    totalUsers,
    totalVendors,
    totalJobsCompleted,
    totalActiveBookings,
    totalPendingBookings,
    totalAssignedBookings,
    totalAcceptedBookings,
    totalCancelledBookings,
    totalEarnings,
    charts: {
      weekly: weeklyEarnings,
      monthly: monthlyEarnings,
      yearly: yearlyEarnings
    }
  };

  sendSuccess(res, responseData, 'Admin dashboard stats retrieved successfully');
});
