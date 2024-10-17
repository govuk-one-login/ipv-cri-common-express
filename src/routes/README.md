# Routes

There are two shared routes as defined in the [oauth2 router](./oauth2/index.js):

- `/oauth2/authorize` - entry point for the CRI, responsible for initialising the session on backend, and then redirecting into the first page of the CRI
- `/callback` - exit point for the CRI, responsible for redirecting back to the caller
