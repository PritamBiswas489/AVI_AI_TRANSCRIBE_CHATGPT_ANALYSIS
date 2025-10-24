import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "../config/redis.config.js";

// Redis-backed rate limiter for OTP by phone number
export const otpRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
  windowMs: 90 * 1000, // 90 seconds
  max: 3, // limit to 3 requests per device
  keyGenerator: (req) => req.deviceid,
  handler: (req, res) => {
    const i18n = req.headers.i18n;
    console.log(
      `Too many OTP requests from device ${req.deviceid}. IP: ${req.ip}`
    );
    res.set("Retry-After", 60); // suggest retry after 60 seconds
    res.return({
      status: 429,
      data: [],
      error: {
        message: i18n.__("TOO_MANY_OTP_REQUESTS"),
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
