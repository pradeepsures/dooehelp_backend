const express = require('express');
const pinoHttp = require('pino-http');
const { rootLogger } = require('./config/logger');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const path = require('path');

const app = express();

app.use(express.json());
// Serve the 'public' folder so uploads can be accessed
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use(pinoHttp({ logger: rootLogger }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Doorhelp API is running' });
});

// Import Routes
const userRoutes = require('./modules/user/user.routes');
const vendorRoutes = require('./modules/vendor/vendor.routes');
const adminRoutes = require('./admin/admin.routes');

// Mount Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/admin', adminRoutes);

// Any 404 handler can go here (optional but recommended)
app.use((req, res, next) => {
  const err = new Error('Route Not Found');
  err.statusCode = 404;
  next(err);
});

// 2. Attach the error handler AT THE VERY END
app.use(errorHandler);

module.exports = app;
