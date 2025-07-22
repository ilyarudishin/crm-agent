# CRM Agent

A Node.js service that automatically processes website leads, adds them to Notion CRM, creates Telegram support groups, and sends welcome messages.

## Features

- ✅ **Notion CRM Integration**: Automatically adds leads to your Notion database
- ✅ **Telegram Automation**: Creates private support groups for valid Telegram users
- ✅ **Welcome Messages**: Sends personalized welcome messages to new leads
- ✅ **Lead Enrichment**: Automatically enriches lead data with geo-location and company info
- ✅ **Team Notifications**: Alerts your team about new leads
- ✅ **Data Validation**: Validates and sanitizes incoming lead data

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the TypeScript Project

```bash
npm run build
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `NOTION_API_KEY`: Your Notion integration API key
- `NOTION_DATABASE_ID`: Your Notion CRM database ID
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token

Optional variables:
- `TEAM_TELEGRAM_CHAT_ID`: Team chat for notifications
- `CLEARBIT_API_KEY`: For company data enrichment
- `WEBHOOK_SECRET`: For webhook security

### 2. Notion Database Setup

Create a Notion database with these properties:
- **Name** (Title)
- **Email** (Email)
- **Telegram ID** (Text)
- **Status** (Select: New Lead, Contacted, Telegram Group Created, etc.)
- **Source** (Text)
- **Created Date** (Date)
- **Phone** (Phone)
- **Company** (Text)
- **Notes** (Text)

### 3. Telegram Bot Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get the bot token
3. Add the bot to your team chat (optional)
4. Get the chat ID for team notifications

### 4. Start the Server

Development (with TypeScript watching):
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## API Endpoints

### POST /api/webhooks/lead

Process a new lead submission.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "telegramId": "@johndoe",
  "source": "Website Form",
  "utmSource": "google",
  "utmMedium": "organic"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead processed successfully",
  "data": {
    "leadId": "notion-page-id",
    "notionUrl": "https://notion.so/...",
    "telegramGroup": {
      "groupId": "telegram-group-id",
      "groupName": "Support - John Doe"
    }
  }
}
```

### GET /api/webhooks/health

Health check endpoint.

## Website Integration

Add this to your website form:

```javascript
async function submitLead(formData) {
  try {
    const response = await fetch('http://your-server:3000/api/webhooks/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Show success message
      console.log('Lead submitted successfully');
    } else {
      // Handle error
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}
```

## How It Works

1. **Lead Submission**: Website form submits lead data to `/api/webhooks/lead`
2. **Validation**: Data is validated and sanitized
3. **Enrichment**: Lead data is enriched with IP location and company info
4. **Notion Creation**: Lead is added to your Notion CRM database
5. **Telegram Processing**: If valid Telegram ID provided:
   - Creates a private support group
   - Adds the lead to the group
   - Sends welcome message
6. **Team Notification**: Alerts your team about the new lead

## Lead Scoring

The system automatically calculates a lead score based on:
- Email provided: +10 points
- Name provided: +5 points
- Business email (not personal): +20 points
- Phone number: +15 points
- Telegram ID: +10 points
- UTM tracking data: +5-10 points
- Company size: +5-15 points

## Error Handling

The system handles various error scenarios:
- Invalid email addresses
- Duplicate leads (based on email)
- Invalid Telegram IDs
- Notion API errors
- Telegram API errors

## Security

- Input validation and sanitization
- Rate limiting recommended for production
- Environment variables for sensitive data
- Optional webhook secret validation