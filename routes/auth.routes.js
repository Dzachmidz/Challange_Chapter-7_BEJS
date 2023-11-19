const authRouter = require("express").Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controllers");
const { restrict } = require("../middlewares/auth.middlewares");

// auth
authRouter.post("/auth/register", register);
authRouter.post("/auth/login", login);
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", restrict, resetPassword);

module.exports = authRouter;
