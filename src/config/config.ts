import dotenv from 'dotenv';
import type { AppConfig } from '../types/index.js';

dotenv.config();

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    databaseId: process.env.NOTION_DATABASE_ID || '',
  },
  
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  },
  
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
  },
};

export const validateConfig = (): void => {
  const required = [
    'NOTION_API_KEY',
    'NOTION_DATABASE_ID', 
    'TELEGRAM_BOT_TOKEN'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};