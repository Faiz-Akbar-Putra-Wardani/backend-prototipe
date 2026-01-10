const rateLimit = require("express-rate-limit");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Terlalu banyak permintaan, silahkan coba lagi nanti',
  standardHeaders: true, 
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Terlalu banyak percobaan login, silahkan coba lagi nanti',
  skipSuccessfulRequests: true,
});

const crudLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Terlalu banyak request, tunggu sebentar',
});

const publicLimiter = rateLimit({
 windowMs: 5 * 60 * 1000, 
  max: 100, 
  message: 'Terlalu banyak request, silahkan tunggu sebentar',
  standardHeaders: true,
  legacyHeaders: false,
});

const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 20,
  message: 'Terlalu banyak pengecekan tracking, tunggu sebentar',
});

module.exports = { 
  generalLimiter, 
  loginLimiter, 
  crudLimiter,
  publicLimiter,
  trackingLimiter
};
