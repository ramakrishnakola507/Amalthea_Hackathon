import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthController } from './api/auth/auth.controller';
import { ExpensesController } from './api/expenses/expenses.controller';
import { UsersController } from './api/users/users.controller';

const app = express(); // Create the app

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.get('/api', (req, res) => {
  res.send('Expense Management API is running!');
});
app.use('/api/auth', AuthController);
app.use('/api/expenses', ExpensesController);
app.use('/api/users', UsersController);

// Export the app for Vercel to use
export default app;