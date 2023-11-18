const authRouter = require("express").Router();
const {
  register,
  login,
  whoami,
  forgotPassword,
  resetPassword,
  deleteAllUser,
} = require("../controllers/auth.controllers");
const { restrict } = require("../middlewares/auth.middlewares");

// user
authRouter.delete("/auth/delete-all", deleteAllUser);
authRouter.post("/whoami", restrict, whoami);

// auth
authRouter.post("/auth/register", register);
authRouter.post("/auth/login", login);
authRouter.post("/auth/forgot-password", forgotPassword);
authRouter.post("/auth/reset-password", restrict, resetPassword);

module.exports = authRouter;
