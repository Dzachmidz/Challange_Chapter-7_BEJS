const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = process.env;

module.exports = {
  notFoundHandler: (req, res, next) => {
    res.status(404).json({
      status: false,
      message: "Not Found",
    });
    next();
  },

  internalServerErrorHandler: (err, req, res, next) => {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: err.message,
    });
  },
  restrict: (req, res, next) => {
    let { authorization } = req.headers;
    if (!authorization) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
        err: "missing token on header!",
        data: null,
      });
    }

    jwt.verify(authorization, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
          err: err.message,
          data: null,
        });
      }

      req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!req.user.is_verified) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
          err: "you need to verify your email account first to continue",
          data: null,
        });
      }
      next();
    });
  },
};
