const { HttpError } = require("../utils/httpError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const body = {
    ok: false,
    message: err.message || "Server xatosi",
  };
  if (err.code) body.code = err.code;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(body);
}

module.exports = { errorHandler, HttpError };
