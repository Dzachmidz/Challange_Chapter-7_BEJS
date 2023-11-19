const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendEmail, getHtml } = require("../utils/nodemailer");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  register: async (req, res, next) => {
    try {
      const { name, email, password, password_confirmation } = req.body;

      const existUser = await prisma.user.findUnique({ where: { email } });

      if (existUser) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "Email already exists",
        });
      }

      if (password !== password_confirmation) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "Password do not match",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          notifications: {
            create: {
              title: `Halo ${name}!`,
              content: "welcome to my simple application !",
            },
          },
        },
      });

      res.redirect("/login");
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "Invalid Email or Password",
        });
      }

      const decryptedPassword = await bcrypt.compare(password, user.password);

      if (!decryptedPassword) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "Invalid Email or Password",
        });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);

      res.redirect(`/home?token=${token}`);
    } catch (error) {
      next(error);
    }
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

      const token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);
      const url = `http://localhost:3000/reset-password?token=${token}`;

      const html = await getHtml("forgot.ejs", {
        name: user.name,
        url,
      });
      sendEmail(email, "Test", html);

      res.status(200).json({
        status: true,
        message: "The email has been sent to the recipient",
        data: url
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const user = req.user;
      const { new_password, new_password_confirmation } = req.body;

      if (new_password !== new_password_confirmation) {
        return res.status(400).json({
          status: false,
          message: "Bad Request",
          error: "The new password is not the same",
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
          content: "The new password has been updated successfully, in the future, be more careful in remembering the password!",
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
        message: "Password successfull updated",
      });
    } catch (error) {
      next(error);
    }
  }
};
