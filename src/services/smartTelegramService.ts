import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import type { EnrichedLeadData } from '../types/index.js';

class SmartTelegramService {
  private bot: TelegramBot;

  constructor() {
    // Use shared bot instance without polling to avoid conflicts
    this.bot = new TelegramBot(config.telegram.botToken, { polling: false });
    console.log('📡 SmartTelegramService: Using bot without polling (shared with SmartGroupAssistant)');
  }

  async handleNewLead(leadData: EnrichedLeadData) {
    console.log(`🔄 Processing Telegram for lead: ${leadData.email}`);
    
    if (!leadData.telegramId) {
      await this.notifyAdminOnly(leadData);
      return { success: true, method: 'admin_only' };
    }

    // Try direct message first
    const dmResult = await this.tryDirectMessage(leadData);
    
    // Always notify admin about new lead
    await this.notifyAdminWithGroupRequest(leadData, dmResult.success);
    
    return dmResult;
  }

  async tryDirectMessage(leadData: EnrichedLeadData) {
    try {
      const username = leadData.telegramId.replace('@', '');
      
      const message = `
🎉 Hi ${leadData.name || 'there'}!

Thanks for your interest! We've received your signup.

Our team will create a private support group for you shortly where we can discuss your needs in detail.

📧 Email: ${leadData.email}
🏢 Company: ${leadData.company || 'Not provided'}

Looking forward to working with you! 🚀
      `.trim();

      await this.bot.sendMessage(`@${username}`, message);
      
      return {
        success: true,
        method: 'direct_message',
        message: 'Welcome message sent'
      };
    } catch (error) {
      console.log(`❌ Cannot send DM to @${leadData.telegramId}:`, error.message);
      return {
        success: false,
        method: 'dm_failed',
        error: 'User cannot receive direct messages'
      };
    }
  }

  async notifyAdminWithGroupRequest(leadData: EnrichedLeadData, dmSent: boolean) {
    const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
    if (!adminId) return;

    const dmStatus = dmSent ? '✅ Direct message sent' : '❌ User cannot receive DMs';
    
    const notification = `
🆕 <b>NEW LEAD ALERT!</b>

👤 <b>Name:</b> ${leadData.name || 'N/A'}
📧 <b>Email:</b> ${leadData.email}
💬 <b>Telegram:</b> @${leadData.telegramId}
🏢 <b>Company:</b> ${leadData.company || 'N/A'}
📊 <b>Score:</b> ${leadData.leadScore}/100
⭐ <b>Priority:</b> ${leadData.priority}

${dmStatus}

<b>🎯 NEXT ACTION:</b>
Create group: "Support - ${leadData.name || leadData.email}"
Add: @${leadData.telegramId} + yourself

<i>Lead submitted at ${new Date().toLocaleString()}</i>
    `.trim();

    try {
      await this.bot.sendMessage(adminId, notification, { 
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📝 Creating Group', callback_data: 'creating_group' },
              { text: '✅ Group Created', callback_data: 'group_done' }
            ],
            [
              { text: '❓ How to Create Group', callback_data: 'create_group_help' },
              { text: '💬 Open Lead Chat', url: `https://t.me/${leadData.telegramId.replace('@', '')}` }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }

  async notifyAdminOnly(leadData: EnrichedLeadData) {
    const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
    console.log(`🔍 Debug: Admin ID is ${adminId}`);
    console.log(`🔍 Debug: Bot token exists: ${!!config.telegram.botToken}`);
    
    if (!adminId) {
      console.error('❌ No TELEGRAM_ADMIN_USER_ID provided');
      return;
    }

    const notification = `
🆕 <b>NEW LEAD (No Telegram)</b>

👤 <b>Name:</b> ${leadData.name || 'N/A'}
📧 <b>Email:</b> ${leadData.email}
🏢 <b>Company:</b> ${leadData.company || 'N/A'}
📊 <b>Score:</b> ${leadData.leadScore}/100
⭐ <b>Priority:</b> ${leadData.priority}

💬 <b>No Telegram provided</b> - follow up via email

<i>Lead submitted at ${new Date().toLocaleString()}</i>
    `.trim();

    try {
      console.log(`📤 Attempting to send notification to admin ${adminId}`);
      await this.bot.sendMessage(adminId, notification, { parse_mode: 'HTML' });
      console.log('✅ Admin notification sent successfully');
    } catch (error) {
      console.error('❌ Error notifying admin:', error);
    }
  }
}

export default SmartTelegramService;