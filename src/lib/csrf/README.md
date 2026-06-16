# CSRF middleware

Synchronizer Token Pattern CSRF protection for Express apps using `express-session`.

Do not use this if your application uses `hmpo-form-wizard` (it provides its own CSRF implementation).

## Setup

Pass a `csrf` option to `bootstrap.setup`. It mounts _after_ session middleware.

```js
commonExpress.bootstrap.setup({
  csrf: { secret: appConfig.CSRF_SECRET },
  // ...
});
```

`secret` is a non-empty string provided by the CRI front (e.g. from env).

## Templates

The current token is available on `res.locals.csrfToken`. Render it as a hidden field in any form that uses an unsafe request (see behaviour):

```njk
<form method="post" action="/submit">
  <input type="hidden" name="_csrf" value="{{ csrfToken }}">
  {# ...fields... #}
</form>
```

## Behaviour

- `GET` / `HEAD` / `OPTIONS`: generates a token, sets `res.locals.csrfToken`.
- `POST` / `PUT` / `PATCH` / `DELETE`: requires a valid token in `req.body._csrf` or the `x-csrf-token` header (priority: body -> header).
- On error: `next(err)` with a `CsrfError` (`status: 403`, `code: 'BAD_CSRF_TOKEN'`).

## Rotating the secret

`secret` accepts an array. Tokens are signed with the first entry and verified against any entry. This pattern allows any consumer to roll out a new secret across replicas without rejecting tokens that were created before the rollout completed.

Two deploys are required for a successful rotation:

1. Open the window
   - Deploy with `secret: [newSecret, oldSecret]`. Wait for all old tasks to fully drain. During this window every task signs with `newSecret` and tokens created by replicas still on `oldSecret` continue to work.
2. Close the window
   - Deploy with `secret: newSecret`. Old tokens are now rejected.

## Client-side fetch

Read the token from the rendered page and send it as a header:

```js
fetch("/api/thing", {
  method: "POST",
  headers: { "x-csrf-token": csrfToken },
  body: JSON.stringify(payload),
});
```
