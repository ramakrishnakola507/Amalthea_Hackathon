import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// --- IMPORTS ---
// We import the controllers that define our API routes.
import { AuthController } from './api/auth/auth.controller';
import { ExpensesController } from './api/expenses/expenses.controller';
import { UsersController } from './user/users.controller';

// This is the entry point of your application
async function bootstrap() {
  const app = express();
  const port = process.env.PORT || 3001;

  // --- MIDDLEWARE SETUP ---
  // These lines set up essential features for our server.
  app.use(cors({
    origin: 'http://localhost:5173', // Allow our frontend to connect
    credentials: true,
  }));
  app.use(express.json()); // Allow the server to read JSON from request bodies
  app.use(cookieParser()); // Allow the server to read cookies

  // --- API ROUTES ---
  // This is where we tell our app to use the routes we've created.

  // A simple test route to make sure the server is alive
  app.get('/', (req, res) => {
    res.send('Expense Management API is running!');
  });
  
  // All routes starting with /api/auth will be handled by AuthController
  app.use('/api/auth', AuthController);
  
  // All routes starting with /api/expenses will be handled by ExpensesController
  app.use('/api/expenses', ExpensesController);
  app.use('/api/users', UsersController);


  // --- START THE SERVER ---
  // This command starts the server and makes it listen for requests.
  app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
  });
}

bootstrap();