const express = require("express");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mailer = require("../../modules/mailer");

const authConfig = require("../../config/config.json");

const router = express.Router();

function getToken(params = {}) {
  return jwt.sign(params, authConfig.secret, {
    expiresIn: 86400,
  });
}

router.post("/register", async (req, res) => {
  const { email } = req.body;
  try {
    if (await User.findOne({ email })) {
      return res.status(400).send({ error: "User already exists." });
    }
    const user = await User.create(req.body);

    user.password = undefined;

    return res.send({ user, token: getToken({ id: user.id }) });
  } catch (e) {
    res.status(400).send({ error: "Registro falhou.", message: e.message });
  }
});

router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).send({ error: "User not found." });
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.status(400).send({ error: "Invalid password." });
  }

  user.password = undefined;

  res.send({ user, token: getToken({ id: user.id }) });
});

router.post("/forgot", async (req, res) => {
  const { email } = req.body;
  console.log("email  " + email);

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send({ error: "User not found." });
    const token = crypto.randomBytes(20).toString("hex");
    const now = new Date();
    now.setHours(now.getHours() + 1);
    await User.findByIdAndUpdate(user.id, {
      $set: {
        passwordResetToken: token,
        passwordResetExpires: now,
      },
    });

    mailer.sendMail(
      {
        to: email,
        from: "daniel.atmourao@gmail.com",
        template: "auth/forgot_pass",
        context: { token },
      },
      (err) => {
        console.log(err);
        if (err) return res.status(400).send({ error: "Failed to send mail." });
        return res.send();
      }
    );
    console.log(token + "  " + now);
  } catch (err) {
    res.status(400).send({ error: "Error on recover password, try again." });
    console.log(err);
  }
});

router.post("/reset_pass", async (req, res) => {
  const { email, token, password } = req.body;
  try {
    const user = await User.findOne({ email }).select(
      "+passwordResetToken passwordResetExpires"
    );
    if (!user) return res.status(401).send({ error: "User not found." });
    if (token !== user.passwordResetToken)
      return res.status(400).send({ error: "Not valid token" });

    const now = new Date();
    if (now > user.passwordResetExpires)
      return res.status(400).send({ error: "Token is expired." });

    user.password = password;

    await user.save();
    res.send();
  } catch (err) {
    res.status(400).send({ error: "Cannot reset password" });
  }
});

module.exports = (app) => app.use("/auth", router);
