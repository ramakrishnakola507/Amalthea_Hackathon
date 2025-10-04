import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();
const router = Router();

// Mock Admin-only middleware to check if the user is an admin
const adminOnly = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).send("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId as string }});
  if (user?.role !== UserRole.ADMIN) {
    return res.status(403).send("Forbidden: Admins only");
  }
  next();
};

// GET /api/users/managers - Get a list of all managers
router.get('/managers', adminOnly, async (req, res) => {
  try {
    const managers = await prisma.user.findMany({
      where: { role: UserRole.MANAGER }
    });
    res.json(managers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching managers." });
  }
});

// POST /api/users - Create a new user (Employee or Manager)
router.post('/', adminOnly, async (req, res) => {
  try {
    const { email, name, password, role, managerId } = req.body;
    const adminId = req.headers['x-user-id'] as string;

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email, name, password: hashedPassword, role, managerId,
        companyId: admin.companyId,
      }
    });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', details: error.message });
  }
});

export const UsersController = router;