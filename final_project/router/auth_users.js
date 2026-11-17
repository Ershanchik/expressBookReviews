'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const books = require('./booksdb.js');
const regd_users = express.Router();

const users = [];
const JWT_SECRET = process.env.JWT_SECRET || 'coursework-only-jwt-secret-change-in-production';

const isValid = (username) =>
  users.some((user) => user.username === username);

const hashPassword = (password, salt) =>
  crypto.scryptSync(password, salt, 64);

const registerUser = (username, password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  users.push({
    username,
    salt,
    passwordHash: hashPassword(password, salt).toString('hex')
  });
};

const authenticatedUser = (username, password) => {
  const user = users.find((item) => item.username === username);
  if (!user) return false;
  const expected = Buffer.from(user.passwordHash, 'hex');
  const actual = hashPassword(password, user.salt);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

regd_users.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({
    message: 'User logged in successfully',
    accessToken
  });
});

// A registered user can create or replace only their own review.
regd_users.put('/auth/review/:isbn', (req, res) => {
  const { isbn } = req.params;
  const book = books[isbn];
  if (!book) return res.status(404).json({ message: 'Book not found' });
  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || !review.trim()) {
    return res.status(400).json({ message: 'Review text is required' });
  }
  book.reviews[req.user.username] = review.trim();
  return res.status(200).json({
    message: 'Review added or updated successfully',
    reviews: book.reviews
  });
});

regd_users.delete('/auth/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({ message: 'Book not found' });
  if (!Object.prototype.hasOwnProperty.call(book.reviews, req.user.username)) {
    return res.status(404).json({ message: 'Your review was not found' });
  }
  delete book.reviews[req.user.username];
  return res.status(200).json({
    message: 'Review deleted successfully',
    reviews: book.reviews
  });
});

module.exports = {
  authenticated: regd_users,
  isValid,
  authenticatedUser,
  registerUser,
  users
};
