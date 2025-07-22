// Quick test to see if your Telegram bot works
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function testTelegram() {
  try {
    console.log('🤖 Testing Telegram bot...');
    
    // Test 1: Get bot info
    const botInfo = await bot.getMe();
    console.log('✅ Bot info:', botInfo.username);
    
    // Test 2: Try to send message to yourself
    const yourUserId = process.env.TELEGRAM_ADMIN_USER_ID;
    if (yourUserId) {
      await bot.sendMessage(yourUserId, '🧪 Test message from your CRM agent!');
      console.log('✅ Test message sent to your Telegram!');
    } else {
      console.log('❌ No admin user ID configured');
    }
    
  } catch (error) {
    console.error('❌ Telegram test failed:', error.message);
  }
}

testTelegram();