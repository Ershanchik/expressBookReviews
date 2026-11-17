'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('./config.js');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
const JWT_SECRET = config.jwtSecret;
const SESSION_SECRET = config.sessionSecret;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/customer', session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// A logged-in user may send a Bearer token or use the session created at login.
app.use('/customer/auth', (req, res, next) => {
  const bearer = req.headers.authorization || '';
  const token = bearer.startsWith('Bearer ')
    ? bearer.slice(7)
    : req.session?.authorization?.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

app.use('/customer', customer_routes);
app.use('/', genl_routes);
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((error, req, res, next) => {
  console.error('Request failed:', error.message);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Book review server listening on port ${PORT}`));
}

module.exports = app;
