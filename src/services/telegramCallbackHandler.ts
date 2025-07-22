import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import NotionService from './notionService.js';

class TelegramCallbackHandler {
  private bot: TelegramBot;
  private notionService: NotionService;

  constructor() {
    this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
    this.notionService = new NotionService();
    this.setupCallbackHandlers();
  }

  private setupCallbackHandlers() {
    // Handle button clicks
    this.bot.on('callback_query', async (callbackQuery) => {
      const chatId = callbackQuery.message?.chat.id;
      const messageId = callbackQuery.message?.message_id;
      const data = callbackQuery.data;

      if (!chatId || !messageId) return;

      try {
        switch (data) {
          case 'creating_group':
            await this.handleCreatingGroup(chatId, messageId, callbackQuery);
            break;
          case 'group_done':
            await this.handleGroupCompleted(chatId, messageId, callbackQuery);
            break;
          case 'create_group_help':
            await this.showGroupCreationHelp(chatId, callbackQuery);
            break;
        }
      } catch (error) {
        console.error('Error handling callback:', error);
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: 'Error processing request',
          show_alert: true
        });
      }
    });
  }

  private async handleCreatingGroup(chatId: number, messageId: number, callbackQuery: any) {
    // Update button to show "In Progress"
    await this.bot.editMessageReplyMarkup({
      inline_keyboard: [[
        { text: '⏳ Creating Group...', callback_data: 'creating_progress' },
        { text: '✅ Group Created', callback_data: 'group_done' },
        { text: '❓ Help Me Create', callback_data: 'create_group_help' }
      ]]
    }, {
      chat_id: chatId,
      message_id: messageId
    });

    await this.bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Marked as in progress! Click "Help Me Create" for step-by-step guide.',
    });
  }

  private async handleGroupCompleted(chatId: number, messageId: number, callbackQuery: any) {
    // Update buttons to show completed
    await this.bot.editMessageReplyMarkup({
      inline_keyboard: [[
        { text: '✅ Group Created Successfully!', callback_data: 'completed' }
      ]]
    }, {
      chat_id: chatId,
      message_id: messageId
    });

    // Send confirmation message
    await this.bot.sendMessage(chatId, `
🎉 <b>Group Creation Completed!</b>

Great job! The lead now has their private support group.

<b>Next steps:</b>
• Send welcome message in the group
• Start conversation with the lead
• Update deal status as needed

<i>Lead processing complete ✅</i>
    `, { parse_mode: 'HTML' });

    await this.bot.answerCallbackQuery(callbackQuery.id, {
      text: 'Marked as completed! Great work! 🎉',
    });
  }

  private async showGroupCreationHelp(chatId: number, callbackQuery: any) {
    const helpMessage = `
🔧 <b>How to Create the Support Group:</b>

<b>Step 1:</b> Create New Group
• Open Telegram
• Tap "New Group" 
• Name it: "Support - [Lead Name]"

<b>Step 2:</b> Add the Lead
• Search for their username
• Add them to the group

<b>Step 3:</b> Send Welcome Message
• "Hi [Name]! Welcome to your support group!"
• "Our team is here to help with any questions"

<b>Step 4:</b> Click "✅ Group Created" when done

<b>💡 Pro Tip:</b> Pin the welcome message!
    `;

    await this.bot.sendMessage(chatId, helpMessage, { 
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Got it, Group Created!', callback_data: 'group_done' }
        ]]
      }
    });

    await this.bot.answerCallbackQuery(callbackQuery.id);
  }
}

export default TelegramCallbackHandler;