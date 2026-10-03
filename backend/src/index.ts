import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import winston from 'winston';

import paymentRoutes from './routes/payments';
import payoutRoutes from './routes/payouts';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import requestRoutes from './routes/requests';
import uploadRoutes from './routes/upload';
import merchantRoutes from './routes/merchant';
import tierRoutes from './routes/tier';
import supportRoutes from './routes/support';

dotenv.config();

// Setup Winston Logger
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());

// Universal CORS
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Kitapay Backend' });
});

app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/tier', tierRoutes);
app.use('/api/support', supportRoutes);

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Exception', { 
        message: err.message, 
        stack: err.stack, 
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    logger.info(`🚀 Kitapay Backend running on http://localhost:${PORT}`);
});
