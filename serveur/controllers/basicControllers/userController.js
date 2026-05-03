const user = require("../../models/hr/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();


// Login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const data = await user.findOne({ where: { login_user: email } });

    if (!data) {
      return res.status(404).json({ message: "NOTexist" });
    }

    // Handle both hashed and plain text passwords safely
    let isMatch = false;
    const stored = data.pwd_user || "";
    if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
      // bcrypt hash
      try {
        isMatch = await bcrypt.compare(password, stored);
      } catch (cmpErr) {
        console.error("bcrypt compare error:", cmpErr);
        return res.status(500).json({ message: "Authentication error" });
      }
    } else {
      // plaintext fallback
      isMatch = stored === password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not set in environment");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const userId = data.USER_ID || data.id || data.UserId || data.userId;
    // Token expiration: default to 7 days, configurable via env JWT_EXPIRES_IN (e.g., '7d')
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const actionUser = data.Action_user || '';
    const token = jwt.sign(
      { id: userId, email: data.login_user, actionUser },
      secret,
      { expiresIn }
    );

    res.status(200).json({ message: "exist", token, actionUser });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "fail" });
  }
};
 