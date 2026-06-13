class CsrfError extends Error {
  constructor(message = "Invalid CSRF token") {
    super(message);
    this.name = "CsrfError";
    this.code = "BAD_CSRF_TOKEN";
    this.status = 403;
  }
}

module.exports = CsrfError;
