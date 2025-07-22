import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import type { EnrichedLeadData, TelegramContactResult, TelegramGroupResult, TelegramValidationResult } from '../types/index.js';

class TelegramService {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot(config.telegram.botToken, { polling: false });
  }

  async initiateDirectContact(leadData: EnrichedLeadData): Promise<TelegramContactResult> {
    try {
      if (!leadData.telegramId) {
        return {
          success: false,
          error: 'No Telegram ID provided',
        };
      }

      // Send direct message to the lead
      const welcomeMessage = `
🎉 Welcome ${leadData.name || 'there'}!

Thank you for your interest in our services. We've received your information and our team will be in touch shortly.

To get started faster, please reply to this message or contact our support team.

Best regards,
Your Support Team
      `.trim();

      await this.bot.sendMessage(leadData.telegramId, welcomeMessage);

      return {
        success: true,
        contactMethod: 'direct_message',
        message: 'Direct message sent to lead',
      };
    } catch (error) {
      console.error('Error sending direct message:', error);
      
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ETELEGRAM') {
        return {
          success: false,
          error: 'Invalid Telegram ID or user blocked bot',
          telegramError: error && typeof error === 'object' && 'response' in error ? 
            String(error.response) : undefined,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async addToSupportGroup(leadData: EnrichedLeadData, supportGroupId: string): Promise<TelegramGroupResult> {
    try {
      if (!leadData.telegramId || !supportGroupId) {
        return {
          success: false,
          error: 'Missing Telegram ID or support group ID',
        };
      }

      // Add user to existing support group (using invite link method)
      const inviteLink = await this.bot.exportChatInviteLink(supportGroupId);
      await this.bot.sendMessage(leadData.telegramId, `Please join our support group: ${inviteLink}`);

      const welcomeMessage = `
👋 Welcome to our support group, ${leadData.name || leadData.email}!

Our team is here to help you with any questions. Feel free to ask anything!
      `.trim();

      await this.bot.sendMessage(supportGroupId, welcomeMessage);

      return {
        success: true,
        groupId: supportGroupId,
        contactMethod: 'support_group',
      };
    } catch (error) {
      console.error('Error adding to support group:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendWelcomeMessage(chatId, leadData) {
    try {
      const welcomeMessage = `
🎉 Welcome to your personal support channel, ${leadData.name || 'there'}!

I'm here to help you get started and answer any questions you might have.

Here's what you can expect:
✅ Quick responses to your questions
✅ Personalized assistance with our services
✅ Updates on your account and any new features

Feel free to ask me anything! 💬

Best regards,
Your Support Team
      `.trim();

      await this.bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'HTML',
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending welcome message:', error);
      return { success: false, error: error.message };
    }
  }

  async sendMessage(chatId, message, options = {}) {
    try {
      await this.bot.sendMessage(chatId, message, options);
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  async validateTelegramId(telegramId) {
    try {
      const chat = await this.bot.getChat(telegramId);
      return {
        success: true,
        isValid: true,
        userInfo: {
          id: chat.id,
          username: chat.username,
          firstName: chat.first_name,
          lastName: chat.last_name,
        },
      };
    } catch (error) {
      console.error('Error validating Telegram ID:', error);
      return {
        success: false,
        isValid: false,
        error: error.message,
      };
    }
  }

  async notifyTeam(message) {
    try {
      const teamChatId = process.env.TEAM_TELEGRAM_CHAT_ID;
      if (!teamChatId) {
        console.log('No team chat ID configured');
        return { success: false, error: 'No team chat configured' };
      }

      await this.bot.sendMessage(teamChatId, message, {
        parse_mode: 'HTML',
      });

      return { success: true };
    } catch (error) {
      console.error('Error notifying team:', error);
      return { success: false, error: error.message };
    }
  }
}

export default TelegramService;