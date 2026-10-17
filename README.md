# Field Kit / Download Vault

Synthetic download catalogue for Dev-Void acceptance. Plain Node HTTP, native binary Buffer responses and a real browser interface; no packages or credentials.

Run `npm start` (PORT defaults to 3000). `/api/files` lists three generated binary assets: 257, 131329 and 1048593 bytes. Bytes include NUL and invalid UTF-8; generation is deterministic and changes with `policy.js` release. Files are generated in memory, no persistent storage claim.

Supported: GET/HEAD; one byte range including open-ended/suffix ranges; unsatisfiable 416; If-Range; strong If-Match; weak If-None-Match; Last-Modified/If-Modified-Since; Unicode Content-Disposition. Multiple or malformed ranges are ignored with a full 200 response. Range applies only to GET. Browser catalogue includes ordinary file downloads and reconstruction of the handbook from two responses, reporting a SHA-256 digest.

Deployment uses the platform compiler with fallback disabled. The acceptance harness and immutable evidence live in the Ship lane evidence directory; release changes are separate source commits.
