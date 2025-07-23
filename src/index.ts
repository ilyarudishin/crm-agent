import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateConfig } from './config/config.js';
import webhooksRouter from './routes/webhooks.js';
import adminRouter from './routes/admin.js';
import groupsRouter, { setSmartGroupAssistant } from './routes/groups.js';
import SmartGroupAssistant from './services/smartGroupAssistant.js';

const app = express();

try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhooksRouter);
app.use('/api/admin', adminRouter);
app.use('/api/groups', groupsRouter);

app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CRM Agent API is running',
    version: '1.0.0',
    endpoints: {
      health: '/api/webhooks/health',
      leadWebhook: '/api/webhooks/lead',
    },
  });
});

// Test endpoint to check if bot can send messages
app.get('/test-bot', async (req: Request, res: Response) => {
  try {
    const TelegramBot = (await import('node-telegram-bot-api')).default;
    const testBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });
    
    await testBot.sendMessage('1194123244', 'Test message from /test-bot endpoint');
    res.json({ success: true, message: 'Test message sent!' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Initialize Smart Group Assistant with error handling
try {
  console.log('🤖 Initializing Smart Group Assistant...');
  const smartGroupAssistant = new SmartGroupAssistant();
  setSmartGroupAssistant(smartGroupAssistant);
  console.log('✅ Smart Group Assistant initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Smart Group Assistant:', error);
  console.log('⚠️ Continuing without Smart Group Assistant...');
}

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 CRM Agent server running on port ${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/webhooks/health`);
  console.log(`🤖 Smart Group Assistant initialized`);
});

export default app;