import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/email.js";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const generateTokenAndSetCookie = (res, user) => {
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
  res.cookie("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
  return token
};

export const getUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export const signup = async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      throw new Error("All fields are required");
    }

    const userAlreadyExists = await prisma.user.findUnique({ where: { email } });
    if (userAlreadyExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nameParts = fullName.split(" ");
    const prenom = nameParts.slice(0, -1).join(" ") || fullName;
    const nom = nameParts[nameParts.length - 1] || "Unknown";

    const verificationToken = Math.floor(100000 + Math.random() * 900000);
    
    
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        statut: "ACTIVE",
        role: "PARTICIPANT",
        statutInscription: "PENDING",
        privileges: [],
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), 
        lastLogin: new Date()
      },
    });

    await sendVerificationEmail(user.email, verificationToken);

    generateTokenAndSetCookie(res, user);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: { ...user, password: undefined }, 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    generateTokenAndSetCookie(res , user);

    user.lastLogin = new Date();
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: user.lastLogin } });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: { ...user, password: undefined }, 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required"
      });
    }

    
    const user = await prisma.user.findFirst({
      where: { verificationToken: code },
    });

    
    if (!user) {
      
      return res.status(400).json({
        success: false,
        message: "No user found with the given verification token.",
      });
    }

    
    if (user.verificationTokenExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Token expired.",
      });
    }

    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
      },
    });


    
    await sendWelcomeEmail(user.email, user.nom);
    generateTokenAndSetCookie(res,user);
    
    res.status(200).json({
      success: true,
      message: "Email verified successfully. /n Welcome email sent.",
      user: { ...user, password: undefined },
    });

  } catch (error) {
    console.error("Error during email verification:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const resetToken = Math.random().toString(36).substring(2, 15); // simple token generator
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // expires in 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: resetToken, resetPasswordExpiresAt: user.resetPasswordExpiresAt },
    });

    await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

    res.status(200).json({ success: true, message: "Password reset link sent to your email" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: token, resetPasswordExpiresAt: { gt: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpiresAt: null },
    });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
	res.clearCookie("token");
	res.status(200).json({ success: true, message: "Logged out successfully" });
};