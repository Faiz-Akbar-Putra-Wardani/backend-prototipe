const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");

const login = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.body.email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true, // ← TAMBAHKAN INI untuk ambil role dari database
      },
    });

    if (!user) {
      return res.status(404).json({
        meta: { success: false, message: "User not found" },
      });
    }

    const validatedPassword = await bcrypt.compare(req.body.password, user.password);

    if (!validatedPassword) {
      return res.status(401).json({
        meta: { success: false, message: "Invalid password" },
      });
    }

    // ← TAMBAHKAN role di JWT token (opsional tapi recommended)
    const token = jwt.sign(
      { 
        id: user.id,
        role: user.role // ← Simpan role di JWT
      }, 
      process.env.JWT_SECRET, 
      {
        expiresIn: "12h",
      }
    );

    const { password, ...userWithoutPassword } = user;

    return res.status(200).json({
      meta: { success: true, message: "Login successful" },
      data: {
        user: userWithoutPassword, // ← Sekarang termasuk role
        token,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      meta: {
        success: false,
        message: "Internal server error",
      },
      errors: error.message,
    });
  }
};

module.exports = { login };
