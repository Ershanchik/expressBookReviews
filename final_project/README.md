# IBM Book Review Application — Final Project

Node.js and Express REST API for an online bookshop. This project builds on the
original IBM `expressBookReviews/final_project` starter. It uses the sample book
JSON data provided by the course.

## Install and run

Requires Node.js 20 or newer.

```bash
cd final_project
npm install
npm start
```

The API listens on http://localhost:5000 by default.
You can set `PORT`, `JWT_SECRET`, and `SESSION_SECRET` in the environment.
For local coursework the signing keys are generated randomly at startup when
missing; for deployed applications set persistent strong environment secrets.

## Public endpoints

| Method | Route | Function |
|---|---|---|
| GET | `/` | All available books |
| GET | `/isbn/:isbn` | Book details by ISBN |
| GET | `/author/:author` | Find all books by author |
| GET | `/title/:title` | Find all books by title |
| GET | `/review/:isbn` | Read reviews |
| POST | `/register` | Create a user |
| POST | `/customer/login` | Receive a JWT |
| GET | `/asyncbooks` | Axios + async/await list |
| GET | `/asyncisbn/:isbn` | Axios + async/await ISBN |
| GET | `/asyncauthor/:author` | Axios + async/await author |
| GET | `/asynctitle/:title` | Axios + async/await title |

## Authenticated endpoints

Send `Authorization: Bearer <accessToken>` after login.

| Method | Route | Function |
|---|---|---|
| PUT | `/customer/auth/review/:isbn` | Add or edit your own review |
| DELETE | `/customer/auth/review/:isbn` | Delete your own review |

Example login:

```bash
curl -X POST http://localhost:5000/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"sample-passphrase"}'
curl -X POST http://localhost:5000/customer/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"demo","password":"sample-passphrase"}'
```

## Automated tests and assignment evidence

```bash
npm test
npm run evidence
```

The `evidence` command runs the real server at http://127.0.0.1:5117,
uses `curl`, and saves each command with its response to `evidence/`.
GitHub Actions also runs the tests and uploads evidence by committing it to the fork.

See [Coursera submission guide](SUBMISSION_GUIDE.md) for all tasks.

**Coursework note:** books, accounts and reviews are held in memory and are reset
when the server restarts, as in the original IBM starter. The Express session
memory store is also appropriate only for this classroom demo, not production.
