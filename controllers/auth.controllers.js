const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("../utils/nodemailer");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      let { name, email, password, password_confirmation } = req.body;
      if (password != password_confirmation) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "please ensure that the password and password confirmation match!",
          data: null,
        });
      }

      let userExist = await prisma.user.findUnique({ where: { email } });
      if (userExist) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "user has already been used!",
          data: null,
        });
      }

      let encryptedPassword = await bcrypt.hash(password, 10);
      let user = await prisma.user.create({
        data: {
          name,
          email,
          password: encryptedPassword,
        },
      });

      // kirim email
      let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
      let url = `http://localhost:3000/api/v1/auth/email-activation?token=${token}`;

      const html = await nodemailer.getHtml("activation-email.ejs", {
        name,
        url,
      });
      nodemailer.sendEmail(email, " Email Activation", html);

      return res.status(201).json({
        status: true,
        message: "Created",
        err: null,
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      let { email, password } = req.body;

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "invalid email or password!",
          data: null,
        });
      }

      let isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          err: "invalid email or password!",
          data: null,
        });
      }

      let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);

      return res.status(200).json({
        status: true,
        message: "OK",
        err: null,
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  whoami: (req, res, next) => {
    return res.status(200).json({
      status: true,
      message: "OK",
      err: null,
      data: { user: req.user },
    });
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "Email not found",
        });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      const url = `http://localhost:3000/reset-password?token=${token}`;

      const html = await getHTML("forgot.ejs", {
        name: user.name,
        url,
      });
      sendEmail(email, "Test", html);

      res.status(200).json({
        status: true,
        message: "Email sent",
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const user = req.user;
      const { new_password, new_confirm_password } = req.body;

      if (new_password !== new_confirm_password) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "New Password does not match",
        });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: hashedPassword,
        },
      });

      const notifications = await prisma.notifications.create({
        data: {
          title: `Pembaharuan Password`,
          content: "Password Anda telah diperbaharui! Jangan sampai lupa lagi!",
          user_id: user.id,
        },
        select: {
          title: true,
          content: true,
        },
      });

      req.io.emit(`notification_${user.id}`, notifications);

      res.status(200).json({
        status: true,
        message: "Password updated",
      });
    } catch (error) {
      next(error);
    }
  },

  deleteAllUser: async (req, res, next) => {
    try {
      await prisma.user.deleteMany();

      res.status(200).json({
        status: true,
        message: "All user deleted",
      });
    } catch (error) {
      next(error);
    }
  },
};
