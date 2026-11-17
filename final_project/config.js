'use strict';

const crypto = require('crypto');

// Environment secrets are recommended. For local coursework, generate random
// per-process secrets instead of shipping known signing keys.
module.exports = {
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  sessionSecret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
};
