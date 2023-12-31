require("dotenv").config();
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const { google } = require("googleapis");
const {
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_SENDER_EMAIL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} = process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET
);

// set credentials by refresh token
oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

module.exports = {
  sendEmail: async (to, subject, html) => {
    const accessToken = await oauth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GOOGLE_SENDER_EMAIL,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    transport.sendMail({ to, subject, html });
  },

  getHtml: (filename, data) => {
    return new Promise((resolve, reject) => {
      const path = `${__dirname}/../views/${filename}`;

      ejs.renderFile(path, data, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  },
};
