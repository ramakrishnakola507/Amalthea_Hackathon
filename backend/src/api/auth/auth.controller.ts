import { Router } from 'express';
import { AuthService } from './auth.service';

const router = Router();
const authService = new AuthService();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.cookie('token', result.token, { httpOnly: true }); // Securely store token in a cookie
    res.json(result);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

export const AuthController = router;