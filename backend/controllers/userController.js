import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

export const updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { statut, role } = req.body;
  
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
  
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { statut, role, updatedAt: new Date() },
      });
  
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
};
  
  export const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
  
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
  
      await prisma.user.delete({ where: { id } });
  
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
};
