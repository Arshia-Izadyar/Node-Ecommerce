const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

const genResponse = require("../utils/genResponse");
const { accessTokenKey, refreshTokenKey } = require("../constants/constants");

async function optionalAuthenticate(req, res, next) {
  let authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }
  let token = authHeader.split(" ")[1];

  try {
    const { userId, type, role, id } = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithm: "HS256" },
    );
    if (type !== accessTokenKey) {
      req.user = null;
      return next();
    }
    req.user = { userId: userId, role: role, id: id };
    return next();
  } catch (err) {
    req.user = null;
    next();
  }
}

module.exports = { optionalAuthenticate };
