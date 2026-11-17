# Coursera Final Project — Submission Guide

The application and its actual terminal outputs are in the public fork:
https://github.com/Ershanchik/expressBookReviews

## What to paste for each graded question

Open the linked file, click **Raw**, select all with Ctrl+A, and paste the **command and its output**, not the GitHub URL, into the text field in Coursera.

| Task | Required evidence | GitHub file |
|---|---|---|
| 1 | Fork verification | [githubrepo](evidence/githubrepo) |
| 2 | Retrieve every book | [getallbooks](evidence/getallbooks) |
| 3 | Search by ISBN | [getbooksbyISBN](evidence/getbooksbyISBN) |
| 4 | Search by author | [getbooksbyauthor](evidence/getbooksbyauthor) |
| 5 | Search by title | [getbooksbytitle](evidence/getbooksbytitle) |
| 6 | Display the book's initial review list | [getbookreview](evidence/getbookreview) |
| 7 | Register a user | [register](evidence/register) |
| 8 | Log in | [login](evidence/login) |
| 9 | Add / update a review | [reviewadded](evidence/reviewadded) |
| 10 | Delete your review | [deletereview](evidence/deletereview) |
| 11 | Submit the URL of the implemented general.js | [general.js](router/general.js) |

For Task 11 paste this *URL* rather than the full source:
https://github.com/Ershanchik/expressBookReviews/blob/main/final_project/router/general.js

Async / Axios evidence is also available if your version of the rubric has additional questions:
[asyncbooks](evidence/asyncbooks), [asyncisbn](evidence/asyncisbn),
[asyncauthor](evidence/asyncauthor), [asynctitle](evidence/asynctitle).

### Verification

The [GitHub Actions workflow](https://github.com/Ershanchik/expressBookReviews/actions)
installs the real app, runs automated tests and uses actual `curl` commands to save the outputs.
The example login JWT is redacted to avoid putting usable credentials in a public repository.

For a future run on your own computer, follow `final_project/README.md` and run
`npm install`, `npm test`, and `npm run evidence`.

Do not paste GitHub repository URLs into Questions 1–10: those require command text and output.
