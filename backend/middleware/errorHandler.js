function errorHandler(err, req, res, next) {
  console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'internal_error',
    message: err.message || 'Unexpected error',
  });
}

module.exports = errorHandler;
