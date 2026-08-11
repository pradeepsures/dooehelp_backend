const BaseRepository = require('../../../core/BaseRepository');
const Booking = require('../../../models/Booking.model');

class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking, 'booking');
  }

  async findByBookingId(bookingId) {
    return this.findOne({ bookingId });
  }
}

module.exports = new BookingRepository();
