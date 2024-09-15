const handler500 = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal Server Error, Unexpected ERROR",
    error: err.message,
  });
};

module.exports = handler500;
