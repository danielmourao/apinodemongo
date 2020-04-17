const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const { host, port, user, pass } = require("../config/mail.json");
const path = require("path");

var transport = nodemailer.createTransport({
  host,
  port,
  auth: { user, pass },
});

const handlebarOptions = {
  viewEngine: {
    extName: ".html",
    partialsDir: path.resolve("./src/resources/mail/"),
    layoutsDir: path.resolve("./src/resources/mail/"),
    defaultLayout: path.resolve("./src/resources/mail/auth/forgot_pass.html"),
  },
  viewPath: path.resolve("./src/resources/mail/"),
  extName: ".html",
};

transport.use("compile", hbs(handlebarOptions));

/* transport.use(
  "compile",
  hbs({
    viewEngine: "handlebars",
    viewPath: path.resolve("../resources/mail/"),
    extName: ".html",
  })
); */

module.exports = transport;
