class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code || undefined;
    this.details = details;
  }
}

module.exports = { HttpError };
