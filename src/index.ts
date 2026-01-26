import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { testDatabaseConnection } from './config/database';
import apiRoutes from './routes';
import bannerRoutes from './routes/banner.routes'; 
// Import the new verification function
import { verifySmtpConnection } from './services/emailService'; 

dotenv.config();

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api';

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'], 
}));

// Body parser
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logger
app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter
app.use(API_PREFIX, apiLimiter);

// Register Routes
app.use(API_PREFIX, apiRoutes);
app.use(`${API_PREFIX}/banners`, bannerRoutes); 

// Generic error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;

// Test database connection AND SMTP, then start server
testDatabaseConnection()
  .then(() => {
    console.log("Database connection test completed successfully.");
    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);
      
      // RUN THE SMTP TEST HERE
      await verifySmtpConnection(); 
    });
  })
  .catch(error => {
    console.error("Database connection test FAILED:", error);
    process.exit(1);
  });

export default app;
