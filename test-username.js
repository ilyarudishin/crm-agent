// Test if we can find your username
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

async function testUsername() {
  try {
    console.log('🔍 Testing username @itstheilyashow...');
    
    // Try different formats
    const formats = ['itstheilyashow', '@itstheilyashow', '1194123244'];
    
    for (const format of formats) {
      try {
        console.log(`Testing format: "${format}"`);
        const chat = await bot.getChat(format);
        console.log('✅ Found:', chat.username || chat.first_name);
        break;
      } catch (error) {
        console.log(`❌ Failed with "${format}":`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUsername();