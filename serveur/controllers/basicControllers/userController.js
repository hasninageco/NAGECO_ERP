const user = require("../../models/hr/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { decrypt } = require("../../utils/passwordCrypto");
require('dotenv').config();

const normalizeBoolean = (value) => {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) return true;
    if (["0", "false", "no", "n"].includes(normalized)) return false;
    if (normalized === "null") return null;
  }
  return undefined;
};


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

    // Handle bcrypt, VB-encrypted, and plaintext passwords safely.
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
      // Try VB-compatible decrypt first, then fallback to plaintext.
      const decryptedStored = decrypt(stored);
      isMatch = decryptedStored === password || stored === password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is not set in environment");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const readText = (...values) => {
      for (const value of values) {
        if (value === null || value === undefined) continue;
        const text = String(value).trim();
        if (text) return text;
      }
      return '';
    };

    const userId = data.USER_ID || data.id || data.UserId || data.userId;
    const loginUser = readText(data.login_user, data?.dataValues?.login_user, email);
    const nameUser = readText(data.Name_user, data?.dataValues?.Name_user, loginUser);
    const refEmp = readText(data.ref_emp, data.Ref_emp, data?.dataValues?.ref_emp, data?.dataValues?.Ref_emp);
    // Token expiration: default to 7 days, configurable via env JWT_EXPIRES_IN (e.g., '7d')
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    const actionUser = data.Action_user || '';
    const webPermissions = readText(
      data.Web_Permissions,
      data.web_permissions,
      data?.dataValues?.Web_Permissions,
      data?.dataValues?.web_permissions
    );
    const userSN = {
      USER_ID: userId,
      Name_user: nameUser,
      login_user: loginUser,
      ref_emp: refEmp,
      Ref_emp: refEmp,
      Web_Permissions: webPermissions,
      web_permissions: webPermissions,
    };
    const token = jwt.sign(
      { id: userId, email: loginUser, actionUser, webPermissions, userSN, ref_emp: refEmp },
      secret,
      { expiresIn }
    );

    res.status(200).json({
      message: "exist",
      token,
      actionUser,
      webPermissions,
      userSN,
      ref_emp: refEmp,
      Ref_emp: refEmp,
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "fail" });
  }
};

exports.listUsers = async (_req, res) => {
  try {
    const data = await user.findAll({
      attributes: { exclude: ["pwd_user"] },
      order: [["USER_ID", "ASC"]],
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error("List users error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params || {};
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ message: "Request body is required" });
  }

  const payload = {};
  const textFields = [
    "Name_user",
    "login_user",
    "Action_user",
    "Web_Permissions",
    "ref_emp",
    "COST_CENTER_TO_MANAGE",
    "WhareHouse_To_Manage",
  ];

  for (const field of textFields) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      payload[field] = req.body[field];
    }
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "State")) {
    const normalizedState = normalizeBoolean(req.body.State);
    if (normalizedState === undefined) {
      return res.status(400).json({ message: "State must be boolean, 0/1, or null" });
    }
    payload.State = normalizedState;
  }

  if (Object.prototype.hasOwnProperty.call(req.body, "ACCEPT_MODIFY")) {
    const normalizedAcceptModify = normalizeBoolean(req.body.ACCEPT_MODIFY);
    if (normalizedAcceptModify === undefined) {
      return res.status(400).json({ message: "ACCEPT_MODIFY must be boolean, 0/1, or null" });
    }
    payload.ACCEPT_MODIFY = normalizedAcceptModify;
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ message: "No valid fields were provided for update" });
  }

  try {
    const [updatedRows] = await user.update(payload, {
      where: { USER_ID: userId },
    });

    if (!updatedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await user.findOne({
      where: { USER_ID: userId },
      attributes: { exclude: ["pwd_user"] },
    });

    return res.status(200).json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
};
 