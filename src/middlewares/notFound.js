const { StatusCodes } = require("http-status-codes");

module.exports = function (req, res) {
  return res
    .status(StatusCodes.NOT_FOUND)
    .json({ data: null, error: "NotFound", success: false });
};
