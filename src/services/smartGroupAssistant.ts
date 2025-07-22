import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/config.js';
import NotionService from './notionService.js';
import MobulaKnowledgeBase from './mobulaKnowledgeBase.js';

class SmartGroupAssistant {
  private bot: TelegramBot;
  private notionService: NotionService;
  private adminId: string;
  private activeGroups: Map<number, GroupInfo> = new Map();

  constructor() {
    if (config.telegram.botToken && config.telegram.botToken !== 'dummy_for_now') {
      this.bot = new TelegramBot(config.telegram.botToken, { polling: true });
      this.setupEventHandlers();
    } else {
      console.warn('⚠️  Telegram bot disabled - no valid token provided');
    }
    this.notionService = new NotionService();
    this.adminId = process.env.TELEGRAM_ADMIN_USER_ID || '';
  }

  private setupEventHandlers() {
    // When bot is added to a new group
    this.bot.on('new_chat_members', async (msg) => {
      const newMembers = msg.new_chat_members || [];
      const botInfo = await this.bot.getMe();
      
      // Check if the bot was added
      const botAdded = newMembers.some(member => member.id === botInfo.id);
      
      if (botAdded && msg.chat.type === 'group') {
        await this.handleBotAddedToGroup(msg);
      }
    });

    // Handle all messages in groups
    this.bot.on('message', async (msg) => {
      if (msg.chat.type === 'group' && msg.text && !msg.new_chat_members) {
        await this.handleGroupMessage(msg);
      }
    });

    // Handle when someone leaves (to clean up)
    this.bot.on('left_chat_member', async (msg) => {
      if (msg.chat.type === 'group') {
        await this.handleMemberLeft(msg);
      }
    });

    // Handle callback queries from inline buttons
    this.bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallbackQuery(callbackQuery);
    });
  }

  private async handleBotAddedToGroup(msg: any) {
    const chatId = msg.chat.id;
    const chatTitle = msg.chat.title || 'Support Group';
    
    console.log(`🤖 Bot added to group: ${chatTitle} (${chatId})`);

    // Wait a moment for group to settle
    setTimeout(async () => {
      // Get group members to identify the lead
      try {
        const chatMembers = await this.bot.getChatAdministrators(chatId);
        const nonAdminMembers = await this.identifyLead(chatId);
        
        // Store group info
        const groupInfo: GroupInfo = {
          chatId,
          chatTitle,
          leadInfo: nonAdminMembers,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          status: 'active'
        };
        
        this.activeGroups.set(chatId, groupInfo);
        
        // Send welcome message
        await this.sendWelcomeMessage(chatId, groupInfo);
        
        // Notify admin
        await this.notifyAdminGroupReady(groupInfo);
        
        // Try to update Notion if we can match the lead
        await this.updateNotionForNewGroup(groupInfo);
        
      } catch (error) {
        console.error('Error handling new group:', error);
      }
    }, 2000);
  }

  private async identifyLead(chatId: number): Promise<LeadInfo | null> {
    try {
      const chatMembers = await this.bot.getChatAdministrators(chatId);
      // For now, return basic info - we'll enhance this
      return {
        userId: 0,
        username: 'unknown',
        firstName: 'Lead',
        lastName: ''
      };
    } catch (error) {
      console.error('Error identifying lead:', error);
      return null;
    }
  }

  private async sendWelcomeMessage(chatId: number, groupInfo: GroupInfo) {
    const welcomeMessage = `
🎉 <b>Welcome to your personal Mobula support channel!</b>

I'm your AI assistant here to help with:
✅ Answer questions about Mobula APIs & services
✅ Help with technical integration issues  
✅ Connect you with our expert team
✅ Track your progress & usage

<b>How to get help:</b>
• Just type your question naturally
• I'll either answer instantly or get our team
• Ask about pricing, APIs, getting started
• Use /urgent for priority support

Our team has been notified and will join shortly! 

${MobulaKnowledgeBase.getHelpfulSuggestion()}

What can I help you with today? 💬
    `;

    try {
      await this.bot.sendMessage(chatId, welcomeMessage, { 
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '❓ I have a question', callback_data: 'ask_question' },
              { text: '🚀 Getting started', callback_data: 'getting_started' }
            ],
            [
              { text: '💰 Pricing info', callback_data: 'pricing_info' },
              { text: '📊 Check my status', callback_data: 'check_status' }
            ]
          ]
        }
      });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }

  private async handleGroupMessage(msg: any) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    const userName = msg.from.first_name || 'there';

    // Skip messages from admin or bot
    if (userId.toString() === this.adminId) return;

    const groupInfo = this.activeGroups.get(chatId);
    if (!groupInfo) return;

    // Update last activity
    groupInfo.lastActivity = new Date().toISOString();

    console.log(`💬 Message in ${groupInfo.chatTitle}: ${text}`);

    // Handle different types of messages
    if (this.isQuestionMessage(text)) {
      await this.handleQuestion(chatId, text, userName);
    } else if (this.isUrgentMessage(text)) {
      await this.handleUrgentRequest(chatId, text, userName);
    } else if (this.isGreeting(text)) {
      await this.handleGreeting(chatId, userName);
    } else {
      // Default: acknowledge and potentially route to human
      await this.handleGeneralMessage(chatId, text, userName);
    }

    // Notify admin of activity
    await this.notifyAdminOfActivity(groupInfo, text, userName);
  }

  private isQuestionMessage(text: string): boolean {
    const questionWords = ['how', 'what', 'when', 'where', 'why', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does', 'will', 'whats', 'hows', 'link', 'url', '?'];
    return questionWords.some(word => text.toLowerCase().includes(word));
  }

  private isUrgentMessage(text: string): boolean {
    const urgentWords = ['urgent', 'emergency', 'asap', 'immediately', 'help', 'problem', 'issue', 'error'];
    return urgentWords.some(word => text.toLowerCase().includes(word));
  }

  private isGreeting(text: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'thanks'];
    return greetings.some(word => text.toLowerCase().includes(word));
  }

  private async handleQuestion(chatId: number, question: string, userName: string) {
    // First check Mobula knowledge base for specific answers
    const mobulaResponse = MobulaKnowledgeBase.getResponse(question);
    
    if (mobulaResponse.response) {
      await this.bot.sendMessage(chatId, `Hi ${userName}! 👋\n\n${mobulaResponse.response}\n\n${mobulaResponse.followUp || 'Is there anything else I can help with?'}`, {
        parse_mode: 'Markdown'
      });
      return;
    }
    
    if (mobulaResponse.needsHuman) {
      await this.bot.sendMessage(chatId, `Great question, ${userName}! 🤔\n\nI'm getting our team to give you the best answer. They'll respond shortly!\n\nIn the meantime, feel free to ask anything else.`);
      await this.alertAdminForQuestion(chatId, question, userName);
      return;
    }
    
    // Fallback to generic smart responses
    const responses = this.getSmartResponse(question);
    
    if (responses.autoResponse) {
      await this.bot.sendMessage(chatId, `Hi ${userName}! 👋\n\n${responses.autoResponse}\n\n${responses.followUp || 'Is there anything else I can help with?'}`);
    } else {
      await this.bot.sendMessage(chatId, `Great question, ${userName}! 🤔\n\nI'm getting our team to give you the best answer. They'll respond shortly!\n\nIn the meantime, feel free to ask anything else.`);
      
      // Alert admin
      await this.alertAdminForQuestion(chatId, question, userName);
    }
  }

  private async handleUrgentRequest(chatId: number, message: string, userName: string) {
    await this.bot.sendMessage(chatId, `🚨 ${userName}, I understand this is urgent!\n\nI'm immediately alerting our team for priority support. Someone will be with you very shortly.\n\nWhat specific help do you need right now?`);
    
    // Urgent alert to admin
    await this.bot.sendMessage(this.adminId, `
🚨 <b>URGENT SUPPORT REQUEST</b>

👤 <b>From:</b> ${userName}
💬 <b>Group:</b> ${this.activeGroups.get(chatId)?.chatTitle}
📝 <b>Message:</b> ${message}

<b>⚡ IMMEDIATE ATTENTION NEEDED</b>
    `, { parse_mode: 'HTML' });
  }

  private async handleGreeting(chatId: number, userName: string) {
    const responses = [
      `Hi ${userName}! 👋 Great to see you here!`,
      `Hello ${userName}! 😊 How can I help you today?`,
      `Hey ${userName}! 🌟 Welcome! What brings you here?`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    await this.bot.sendMessage(chatId, response);
  }

  private async handleGeneralMessage(chatId: number, message: string, userName: string) {
    // Acknowledge the message
    await this.bot.sendMessage(chatId, `Thanks for that, ${userName}! 📝\n\nI've noted this and our team will follow up. Is there anything specific I can help you with right now?`);
  }

  private getSmartResponse(question: string): { autoResponse?: string; followUp?: string } {
    const q = question.toLowerCase();
    
    if (q.includes('price') || q.includes('cost') || q.includes('pricing')) {
      return {
        autoResponse: 'Great question about pricing! 💰\n\nOur team will provide you with detailed pricing information tailored to your specific needs.',
        followUp: 'What specific services are you most interested in?'
      };
    }
    
    if (q.includes('how long') || q.includes('timeline') || q.includes('when')) {
      return {
        autoResponse: 'Excellent question about timing! ⏰\n\nTimelines depend on your specific requirements. Our team will give you accurate estimates.',
        followUp: 'What project or service are you asking about?'
      };
    }
    
    if (q.includes('start') || q.includes('begin') || q.includes('setup')) {
      return {
        autoResponse: 'Ready to get started? Awesome! 🚀\n\nOur team will walk you through the entire setup process step by step.',
        followUp: 'What would you like to start with first?'
      };
    }
    
    return {}; // No auto-response, route to human
  }

  private async notifyAdminGroupReady(groupInfo: GroupInfo) {
    await this.bot.sendMessage(this.adminId, `
✅ <b>New Support Group Ready!</b>

📁 <b>Group:</b> ${groupInfo.chatTitle}
🆔 <b>Chat ID:</b> ${groupInfo.chatId}
⏰ <b>Created:</b> ${new Date(groupInfo.createdAt).toLocaleString()}

🤖 <b>Bot Status:</b> Active and monitoring
💬 <b>Welcome message:</b> Sent

The lead is ready for support! 🎯
    `, { parse_mode: 'HTML' });
  }

  private async notifyAdminOfActivity(groupInfo: GroupInfo, message: string, userName: string) {
    // Only notify for important messages, not spam
    if (message.length > 10) {
      await this.bot.sendMessage(this.adminId, `
💬 <b>Activity in ${groupInfo.chatTitle}</b>

👤 <b>${userName}:</b> ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}

<a href="https://t.me/c/${Math.abs(groupInfo.chatId).toString().substring(4)}">👆 Open Group</a>
      `, { 
        parse_mode: 'HTML',
        disable_web_page_preview: true 
      });
    }
  }

  private async alertAdminForQuestion(chatId: number, question: string, userName: string) {
    const groupInfo = this.activeGroups.get(chatId);
    await this.bot.sendMessage(this.adminId, `
❓ <b>Question Needs Your Expertise</b>

👤 <b>From:</b> ${userName}
💬 <b>Group:</b> ${groupInfo?.chatTitle}
❔ <b>Question:</b> ${question}

<b>🎯 Please respond in the group!</b>
    `, { parse_mode: 'HTML' });
  }

  private async updateNotionForNewGroup(groupInfo: GroupInfo) {
    // Try to find matching lead in Notion and update status
    try {
      // This would need more sophisticated matching logic
      console.log(`📝 Would update Notion for group: ${groupInfo.chatTitle}`);
    } catch (error) {
      console.error('Error updating Notion:', error);
    }
  }

  private async handleMemberLeft(msg: any) {
    const chatId = msg.chat.id;
    const leftMember = msg.left_chat_member;
    
    if (leftMember.id.toString() === this.adminId) {
      // Admin left, handle accordingly
      await this.bot.sendMessage(chatId, "Our team member has stepped out but I'm still here to help! 👋");
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message?.chat?.id;
    const data = callbackQuery.data;
    const userName = callbackQuery.from?.first_name || 'there';

    try {
      await this.bot.answerCallbackQuery(callbackQuery.id);

      if (!chatId) return;

      switch (data) {
        case 'ask_question':
          await this.bot.sendMessage(chatId, `Great ${userName}! 🤔\n\nWhat's your question? I can help with:\n\n• Mobula API documentation\n• Pricing and plans\n• Getting started guides\n• Technical integration\n• Data coverage questions\n\nJust type your question naturally!`);
          break;

        case 'getting_started':
          const gettingStartedResponse = MobulaKnowledgeBase.getResponse('getting started');
          await this.bot.sendMessage(chatId, `Hi ${userName}! 🚀\n\n${gettingStartedResponse.response}\n\n${gettingStartedResponse.followUp}`, {
            parse_mode: 'Markdown'
          });
          break;

        case 'pricing_info':
          const pricingResponse = MobulaKnowledgeBase.getResponse('pricing');
          await this.bot.sendMessage(chatId, `Hi ${userName}! 💰\n\n${pricingResponse.response}\n\n${pricingResponse.followUp}`, {
            parse_mode: 'Markdown'
          });
          break;

        case 'check_status':
          await this.bot.sendMessage(chatId, `Hi ${userName}! 📊\n\nYour support channel is active and our team is monitoring.\n\n• Group created: ✅\n• AI assistant: Active 🤖\n• Team notified: ✅\n\nFeel free to ask any questions - I'm here to help!`);
          break;

        case 'human_support':
          await this.bot.sendMessage(chatId, `Connecting you with our team, ${userName}! 👨‍💻\n\nOur human experts will join this conversation shortly.\n\nIn the meantime, feel free to describe your specific needs or questions!`);
          await this.alertAdminForHumanRequest(chatId, userName);
          break;
      }
    } catch (error) {
      console.error('Error handling callback query:', error);
    }
  }

  private async alertAdminForHumanRequest(chatId: number, userName: string) {
    const groupInfo = this.activeGroups.get(chatId);
    await this.bot.sendMessage(this.adminId, `
👋 <b>Human Support Requested</b>

👤 <b>User:</b> ${userName}
💬 <b>Group:</b> ${groupInfo?.chatTitle}
🕐 <b>Time:</b> ${new Date().toLocaleString()}

<b>🎯 User wants to speak with human team!</b>
    `, { parse_mode: 'HTML' });
  }

  // Public method to get group status
  public getActiveGroups(): GroupInfo[] {
    return Array.from(this.activeGroups.values());
  }
}

interface GroupInfo {
  chatId: number;
  chatTitle: string;
  leadInfo: LeadInfo | null;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'inactive' | 'closed';
}

interface LeadInfo {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
}

export default SmartGroupAssistant;