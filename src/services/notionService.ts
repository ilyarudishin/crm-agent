import { Client } from '@notionhq/client';
import { config } from '../config/config.js';
import type { EnrichedLeadData, NotionLeadResult, NotionUpdateResult } from '../types/index.js';

class NotionService {
  private notion: Client;
  private databaseId: string;

  constructor() {
    this.notion = new Client({
      auth: config.notion.apiKey,
    });
    this.databaseId = config.notion.databaseId;
  }

  async createLead(leadData: EnrichedLeadData): Promise<NotionLeadResult> {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: leadData.name || 'New Lead',
                },
              },
            ],
          },
          Email: {
            email: leadData.email || null,
          },
          'Telegram id': {
            rich_text: [
              {
                text: {
                  content: leadData.telegramId || '',
                },
              },
            ],
          },
          Status: {
            status: {
              name: 'New Lead',
            },
          },
          Source: {
            rich_text: [
              {
                text: {
                  content: leadData.source || 'Website Form',
                },
              },
            ],
          },
          'Created date': {
            date: {
              start: new Date().toISOString(),
            },
          },
          // Note: Company is a relation in your DB, skipping for now
          Priority: {
            select: {
              name: leadData.priority,
            },
          },
          'Lead Score': {
            number: leadData.leadScore,
          },
        },
      });

      return {
        success: true,
        pageId: response.id,
        url: `https://notion.so/${response.id.replace(/-/g, '')}`,
      };
    } catch (error) {
      console.error('Error creating lead in Notion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateLeadStatus(pageId: string, status: string, notes = ''): Promise<NotionUpdateResult> {
    try {
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            status: {
              name: status,
            },
          },
          Notes: {
            rich_text: [
              {
                text: {
                  content: notes,
                },
              },
            ],
          },
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating lead status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async searchLeadByEmail(email: string): Promise<{ success: boolean; lead?: unknown; error?: string }> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Email',
          email: {
            equals: email,
          },
        },
      });

      return {
        success: true,
        lead: response.results.length > 0 ? response.results[0] : undefined,
      };
    } catch (error) {
      console.error('Error searching lead by email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export default NotionService;