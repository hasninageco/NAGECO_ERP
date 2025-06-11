const user = require("../../models/hr/user");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();


// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const data = await user.findOne({ where: { login_user: email } });

    if (!data) {
      return res.status(404).json({ message: "NOTexist" });
    }

    //const isMatch = await bcrypt.compare(password, data.pwd_user); // compare with hashed



    if (data.pwd_user === password) {
      isMatch = true;
    }
    


    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id: data.id, email: data.login_user },
      process.env.JWT_SECRET, // secret key
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "exist", token });
  } catch (e) {
    
    res.status(500).json({ message: "fail" });
  }
};
 