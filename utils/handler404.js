const handler404 = (req, res, next) => {
  try {
    res.status(404).json({ message: "404 not found" });
  } catch (error) {
    next(error);
  }
};

module.exports = handler404;
