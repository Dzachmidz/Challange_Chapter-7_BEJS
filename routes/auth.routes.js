const authRouter = require("express").Router();
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  deleteAllUser,
} = require("../controllers/auth.controllers");
const { restrict } = require("../middlewares/auth.middlewares");

// user
authRouter.delete("/user/delete-all", deleteAllUser);

// auth
authRouter.post("/auth/register", register);
authRouter.post("/auth/login", login);
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", restrict, resetPassword);

module.exports = authRouter;
