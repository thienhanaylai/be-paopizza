import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import router from './routes/index.js';
import passport from 'passport';
import 'dotenv/config';
import { localStrategy } from './modules/auth/strategies/local.strategy.js';
import { jwtStrategy } from './modules/auth/strategies/jwt.strategy.js';
import errorHandler from './middlewares/errorHandler.js';
const app = express();

app.use(passport.initialize());

passport.use('local', localStrategy);
passport.use('jwt', jwtStrategy);

// Security
app.use(helmet());
app.use(compression());
app.use(
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true }),
);

// CORS
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1', router);
app.use(errorHandler);
export default app;
