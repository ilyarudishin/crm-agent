class GroupCreationQueue {
  private queue: any[] = [];
  private processing: boolean = false;

  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async addToQueue(leadData) {
    const queueItem = {
      id: `group_${Date.now()}`,
      leadData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.queue.push(queueItem);
    
    // Immediately notify team about new group needed
    await this.notifyTeamForManualCreation(queueItem);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return {
      success: true,
      queueId: queueItem.id,
      position: this.queue.length,
    };
  }

  async notifyTeamForManualCreation(queueItem) {
    const TelegramBot = (await import('node-telegram-bot-api')).default;
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
    const adminId = process.env.TELEGRAM_ADMIN_USER_ID;

    const message = `
🆘 <b>GROUP CREATION REQUIRED</b>

<b>New lead needs unique support group:</b>

👤 <b>Name:</b> ${queueItem.leadData.name || 'N/A'}
📧 <b>Email:</b> ${queueItem.leadData.email}
💬 <b>Telegram:</b> ${queueItem.leadData.telegramId}
🆔 <b>Queue ID:</b> ${queueItem.id}

<b>📋 Instructions:</b>
1️⃣ Create group: "Support - ${queueItem.leadData.name || queueItem.leadData.email}"
2️⃣ Add user: ${queueItem.leadData.telegramId}
3️⃣ Add team members
4️⃣ Reply with: /completed ${queueItem.id} [group_id]

📄 <b>Notion:</b> ${queueItem.leadData.notionUrl || 'Not available'}

⏰ <i>Created: ${queueItem.createdAt}</i>
    `.trim();

    try {
      await bot.sendMessage(adminId, message, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Creating Group', callback_data: `creating_${queueItem.id}` },
              { text: '❌ Skip This Lead', callback_data: `skip_${queueItem.id}` }
            ]
          ]
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error notifying team:', error);
      return { success: false, error: error.message };
    }
  }

  async markCompleted(queueId, groupId, groupName) {
    const item = this.queue.find(q => q.id === queueId);
    if (!item) {
      return { success: false, error: 'Queue item not found' };
    }

    item.status = 'completed';
    item.groupId = groupId;
    item.groupName = groupName;
    item.completedAt = new Date().toISOString();

    // Update Notion record
    try {
      const NotionService = (await import('./notionService.js')).default;
      const notionService = new NotionService();
      
      await notionService.updateLeadStatus(
        item.leadData.leadId,
        'Telegram Group Created',
        `Group: ${groupName} (ID: ${groupId})`
      );

      // Send welcome message to the new group
      const TelegramBot = (await import('node-telegram-bot-api')).default;
      const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
      
      const welcomeMessage = `
🎉 Welcome to your personal support channel, ${item.leadData.name || 'there'}!

Our team is here to help you get started and answer any questions.

Feel free to ask us anything! 💬

Best regards,
Your Support Team
      `.trim();

      await bot.sendMessage(groupId, welcomeMessage);

      return { success: true, item };
    } catch (error) {
      console.error('Error completing queue item:', error);
      return { success: false, error: error.message };
    }
  }

  getQueueStatus() {
    return {
      pending: this.queue.filter(q => q.status === 'pending').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      total: this.queue.length,
    };
  }

  async processQueue() {
    this.processing = true;
    
    while (this.queue.some(q => q.status === 'pending')) {
      // Wait for manual completion
      await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
    
    this.processing = false;
  }
}

// Singleton instance
export default new GroupCreationQueue();