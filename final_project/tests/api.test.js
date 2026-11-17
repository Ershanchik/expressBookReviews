'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index.js');

test('IBM Book Review: public API, authentication, reviews and Axios', async (t) => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  process.env.API_BASE_URL = base;

  async function request(path, method = 'GET', body, token) {
    const response = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, data: await response.json() };
  }

  try {
    await t.test('all books are available', async () => {
      const result = await request('/');
      assert.equal(result.status, 200);
      assert.equal(Object.keys(result.data).length, 10);
      assert.equal(result.data['1'].author, 'Chinua Achebe');
    });

    await t.test('lookup by ISBN, author, title, and review', async () => {
      const isbn = await request('/isbn/1');
      assert.equal(isbn.status, 200);
      assert.equal(isbn.data.title, 'Things Fall Apart');

      const author = await request('/author/Chinua%20Achebe');
      assert.equal(author.status, 200);
      assert.deepEqual(Object.keys(author.data), ['1']);

      const title = await request('/title/Things%20Fall%20Apart');
      assert.equal(title.status, 200);
      assert.deepEqual(Object.keys(title.data), ['1']);

      const reviews = await request('/review/1');
      assert.equal(reviews.status, 200);
      assert.deepEqual(reviews.data, {});

      assert.equal((await request('/isbn/9999')).status, 404);
      assert.equal((await request('/review/9999')).status, 404);
    });

    await t.test('registration, login, review ownership, update, delete', async () => {
      const alice = { username: 'alice_test', password: 'test-password-one' };
      const bob = { username: 'bob_test', password: 'test-password-two' };
      assert.equal((await request('/register', 'POST', alice)).status, 201);
      assert.equal((await request('/register', 'POST', alice)).status, 409);
      assert.equal((await request('/register', 'POST', bob)).status, 201);
      assert.equal((await request('/customer/login', 'POST', {
        username: alice.username, password: 'incorrect'
      })).status, 401);

      const aliceLogin = await request('/customer/login', 'POST', alice);
      const bobLogin = await request('/customer/login', 'POST', bob);
      assert.equal(aliceLogin.status, 200);
      assert.ok(aliceLogin.data.accessToken);
      assert.equal(bobLogin.status, 200);

      assert.equal((await request('/customer/auth/review/1', 'PUT', {
        review: 'unauthorized'
      })).status, 401);

      const added = await request('/customer/auth/review/1', 'PUT', {
        review: 'An excellent read!'
      }, aliceLogin.data.accessToken);
      assert.equal(added.status, 200);
      assert.equal(added.data.reviews[alice.username], 'An excellent read!');

      const updated = await request('/customer/auth/review/1', 'PUT', {
        review: 'Updated after reading again'
      }, aliceLogin.data.accessToken);
      assert.equal(updated.status, 200);
      assert.equal(updated.data.reviews[alice.username], 'Updated after reading again');

      assert.equal((await request('/customer/auth/review/1', 'DELETE', undefined,
        bobLogin.data.accessToken)).status, 404);

      const deleted = await request('/customer/auth/review/1', 'DELETE', undefined,
        aliceLogin.data.accessToken);
      assert.equal(deleted.status, 200);
      assert.deepEqual(deleted.data.reviews, {});
    });

    await t.test('Axios Promise/async endpoints return real data', async () => {
      const [books, isbn, author, title, missing] = await Promise.all([
        request('/asyncbooks'),
        request('/asyncisbn/1'),
        request('/asyncauthor/Chinua%20Achebe'),
        request('/asynctitle/Things%20Fall%20Apart'),
        request('/asyncisbn/9999')
      ]);
      assert.equal(books.status, 200);
      assert.equal(Object.keys(books.data).length, 10);
      assert.equal(isbn.data.title, 'Things Fall Apart');
      assert.equal(author.data['1'].author, 'Chinua Achebe');
      assert.equal(title.data['1'].title, 'Things Fall Apart');
      assert.equal(missing.status, 404);
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) =>
      error ? reject(error) : resolve()));
  }
});
