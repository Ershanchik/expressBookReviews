'use strict';

const express = require('express');
const axios = require('axios');
const books = require('./booksdb.js');
const { isValid, registerUser } = require('./auth_users.js');

const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (isValid(username.trim())) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  registerUser(username.trim(), password);
  return res.status(201).json({ message: 'User registered successfully' });
});

// Tasks 1–4: list books and filter by ISBN, author or title.
public_users.get('/', (req, res) => res.status(200).json(books));

public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book
    ? res.status(200).json(book)
    : res.status(404).json({ message: 'Book not found' });
});

public_users.get('/author/:author', (req, res) => {
  const target = req.params.author.trim().toLowerCase();
  const matches = Object.fromEntries(
    Object.entries(books).filter(([, book]) => book.author.toLowerCase() === target)
  );
  return Object.keys(matches).length
    ? res.status(200).json(matches)
    : res.status(404).json({ message: 'No books found for this author' });
});

public_users.get('/title/:title', (req, res) => {
  const target = req.params.title.trim().toLowerCase();
  const matches = Object.fromEntries(
    Object.entries(books).filter(([, book]) => book.title.toLowerCase() === target)
  );
  return Object.keys(matches).length
    ? res.status(200).json(matches)
    : res.status(404).json({ message: 'No books found with this title' });
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book
    ? res.status(200).json(book.reviews)
    : res.status(404).json({ message: 'Book not found' });
});

// Tasks 11–14: demonstrate Promises and async/await with Axios.
// These routes call the existing API over HTTP rather than accessing the book map.
// Set API_BASE_URL only when the API is reachable at a different address.
const baseUrl = () =>
  process.env.API_BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;

const forwardAsync = (path) => async (req, res) => {
  try {
    const response = await axios.get(`${baseUrl()}${path(req)}`, {
      timeout: 5000,
      proxy: false,
      validateStatus: () => true
    });
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(502).json({ message: 'Could not retrieve book information' });
  }
};

public_users.get('/asyncbooks', forwardAsync(() => '/'));
public_users.get('/asyncisbn/:isbn',
  forwardAsync((req) => `/isbn/${encodeURIComponent(req.params.isbn)}`));
public_users.get('/asyncauthor/:author',
  forwardAsync((req) => `/author/${encodeURIComponent(req.params.author)}`));
public_users.get('/asynctitle/:title',
  forwardAsync((req) => `/title/${encodeURIComponent(req.params.title)}`));

// Exported Promise/async helpers also support standalone demonstrations.
const getAllBooksAsync = async () => (await axios.get(`${baseUrl()}/`, { proxy: false })).data;
const getBookByISBNAsync = async (isbn) =>
  (await axios.get(`${baseUrl()}/isbn/${encodeURIComponent(isbn)}`, { proxy: false })).data;
const getBooksByAuthorAsync = async (author) =>
  (await axios.get(`${baseUrl()}/author/${encodeURIComponent(author)}`, { proxy: false })).data;
const getBooksByTitleAsync = async (title) =>
  (await axios.get(`${baseUrl()}/title/${encodeURIComponent(title)}`, { proxy: false })).data;

module.exports = {
  general: public_users,
  getAllBooksAsync,
  getBookByISBNAsync,
  getBooksByAuthorAsync,
  getBooksByTitleAsync
};
