import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import passport from 'passport';
import 'dotenv/config';
import { localStrategy } from './modules/auth/strategies/local.strategy.js';
import { jwtStrategy } from './modules/auth/strategies/jwt.strategy.js';
import errorHandler from './middlewares/errorHandler.js';
import environment from './config/environment.js';
import { globalLimiter } from './middlewares/rateLimit.js';

const app = express();

app.use(passport.initialize());

passport.use('local', localStrategy);
passport.use('jwt', jwtStrategy);

// Security
app.use(helmet());
app.use(compression());

// CORS

const allowedOrigins = [
    environment.clientUrl,
    'https://pizza.pao.io.vn',
    'https://paopizza.ngb.id.vn',
].filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1', globalLimiter, router);
app.use(errorHandler);
export default app;
