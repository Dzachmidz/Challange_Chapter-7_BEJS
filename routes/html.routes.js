const { Router } = require("express");
const { restrict } = require("../middlewares/auth.middlewares");

const htmlRouter = Router();

htmlRouter.get("/", (req, res) => {
  res.render("register");
});

htmlRouter.get("/login", (req, res) => {
  res.render("login");
});

htmlRouter.get("/home", restrict, (req, res) => {
  res.render("home", { user: req.user });
});

htmlRouter.get("/reset-password", restrict, (req, res) => {
  res.render("reset-password", { token: req.query.token });
});

htmlRouter.get("/update-password", (req, res) => {
  res.render("update-password");
});

module.exports = htmlRouter;
