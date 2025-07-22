import NotionService from './notionService.js';
import SmartTelegramService from './smartTelegramService.js';
import { enrichLeadData } from '../utils/leadEnrichment.js';
import { validateLeadData } from '../utils/validation.js';

const notionService = new NotionService();
const smartTelegramService = new SmartTelegramService();

export async function processNewLead(rawLeadData) {
  try {
    const validation = validateLeadData(rawLeadData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    const leadData = validation.cleanedData;

    const existingLead = await notionService.searchLeadByEmail(leadData.email);
    if (existingLead.success && existingLead.lead) {
      console.log(`Lead with email ${leadData.email} already exists`);
      return {
        success: false,
        error: 'Lead already exists',
        existingLead: existingLead.lead,
      };
    }

    const enrichedData = await enrichLeadData(leadData);

    const notionResult = await notionService.createLead(enrichedData);
    if (!notionResult.success) {
      return {
        success: false,
        error: `Failed to create lead in Notion: ${notionResult.error}`,
      };
    }

    // Handle Telegram with smart service
    const telegramResult = await smartTelegramService.handleNewLead(enrichedData);
    
    // Update Notion with Telegram status - using default "New Lead" to avoid validation errors
    if (telegramResult.success) {
      const statusMap = {
        'direct_message': 'Telegram Contact Initiated',
        'dm_failed': 'Telegram DM Failed',
        'admin_only': 'New Lead' // Using default status instead of non-existent option
      };
      
      const status = statusMap[telegramResult.method] || 'New Lead';
      const notes = telegramResult.method === 'admin_only' ? 
        `No Telegram provided - Method: ${telegramResult.method}` : 
        `Method: ${telegramResult.method}`;
      
      await notionService.updateLeadStatus(notionResult.pageId, status, notes);
    }

    const teamNotification = `
🆕 <b>New Lead Alert!</b>

👤 <b>Name:</b> ${enrichedData.name || 'Not provided'}
📧 <b>Email:</b> ${enrichedData.email}
🏢 <b>Company:</b> ${enrichedData.company || 'Not provided'}
📱 <b>Phone:</b> ${enrichedData.phone || 'Not provided'}
💬 <b>Telegram:</b> ${enrichedData.telegramId || 'Not provided'}
🌍 <b>Source:</b> ${enrichedData.source || 'Website Form'}

📄 <b>Notion:</b> ${notionResult.url}
💬 <b>Telegram:</b> ${telegramResult.success ? telegramResult.method : 'Failed'}

<i>Lead processed at ${new Date().toLocaleString()}</i>
    `.trim();

    // Team notification is now handled by SmartTelegramService

    return {
      success: true,
      leadId: notionResult.pageId,
      notionUrl: notionResult.url,
      telegramGroup: telegramResult?.success ? telegramResult : null,
      enrichedData,
    };
  } catch (error) {
    console.error('Error processing lead:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}