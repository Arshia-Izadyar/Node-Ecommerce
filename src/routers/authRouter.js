const express = require("express");

const {
  register,
  login,
  verifyUser,
  requestVerification,
  logout,
  refresh,
} = require("../controllers/authController");
const { authenticate, authorization } = require("../middlewares/index");

const router = express.Router();

router.route("/register").post(register);
router.route("/verify").post(verifyUser);
router.route("/login").post(login);
router.route("/logout").post(authenticate, logout);
router.route("/refresh").get(refresh);
router.route("/request-verify").post(requestVerification);

module.exports = router;
