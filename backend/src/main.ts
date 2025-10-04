import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthController } from './api/auth/auth.controller';
import { ExpensesController } from './api/expenses/expenses.controller';
import { UsersController } from './user/users.controller';

// This is the entry point of your application
async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3001;

  // --- MIDDLEWARE SETUP ---
  app.use(cors({
    origin: 'http://localhost:5173', // Allow frontend to connect
    credentials: true,
  }));

  app.use(express.json());
  app.use(cookieParser());

  // A simple test route to make sure the server is alive
  app.get('/api', (req, res) => {
    res.send('Expense Management API is running!');
  });

  // Optional: Friendly root route
  app.get('/', (req, res) => {
    res.send('Welcome to the Expense Management API!');
  });

  // API Routes
  app.use('/api/auth', AuthController);
  app.use('/api/expenses', ExpensesController);
  app.use('/api/users', UsersController);

  // Start the server and listen for requests
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

bootstrap();