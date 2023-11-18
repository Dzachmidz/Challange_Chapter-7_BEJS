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

  restrict: async (req, res, next) => {
    const authorization = req.query.token;

    if (!authorization) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
        error: "Token not found",
      });
    }

    jwt.verify(authorization, JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: false,
          message: "Unauthorized",
          error: err.message,
        });
      }

      req.user = await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          notifications: true,
        },
      });
      next();
    });
  },
};
