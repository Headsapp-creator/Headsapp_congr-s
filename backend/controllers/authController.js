import axios from "axios";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
const prisma = new PrismaClient();

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL;
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";


const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

export const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Step 1: Check local database first
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Step 2: If not found locally, check the external API
      const response = await axios.post(EXTERNAL_API_URL, { email, password });

      if (!response.data.success) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const userData = response.data.user;

      // Step 3: Hash the password before storing it in the database
      const hashedPassword = await bcrypt.hash(password, 10);

      user = await prisma.user.create({
        data: {
          id: userData.id,
          nom: userData.nom,
          prenom: userData.prenom,
          email: userData.email,
          statut: userData.statut,
          role: userData.role,
          privileges: userData.privileges || [],
          statutInscription: userData.statutInscription || "PENDING",
          biographie: userData.biographie || null,
          specialite: userData.specialite || null,
          experience: userData.experience || 0,
          password: hashedPassword, // Store the hashed password
        },
      });
    }

    // Step 4: Ensure password comparison with bcrypt
    if (!user.password) {
      return res.status(401).json({ error: "Password is missing" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Step 5: Generate secure JWT
    const token = generateToken(user);

    return res.json({ token, user });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Authentication service error" });
  }
};


export const register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Split full name into first name (prenom) and last name (nom)
    const nameParts = fullName.split(" ");
    const prenom = nameParts.slice(0, -1).join(" ") || fullName;
    const nom = nameParts[nameParts.length - 1] || "Unknown";

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        nom,
        prenom,
        email,
        password: hashedPassword, // Store the hashed password
        statut: "ACTIVE",
        role: "PARTICIPANT", // Default role
        privileges: [],
        statutInscription: "PENDING",
        biographie: null,
        specialite: null,
        experience: 0,
      },
    });

    // Generate JWT
    const token = generateToken(newUser);

    return res.status(201).json({ token, user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Registration service error" });
  }
};