// Quick debug script to check your Notion database structure
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

async function debugDatabase() {
  try {
    console.log('🔍 Checking your Notion database...\n');
    
    // Get database structure
    const database = await notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID,
    });
    
    console.log('✅ Database found!');
    console.log('📝 Database title:', database.title[0]?.plain_text || 'Untitled');
    
    console.log('\n🏗️ Column structure:');
    Object.entries(database.properties).forEach(([name, property]) => {
      console.log(`  - "${name}": ${property.type}`);
    });
    
    console.log('\n🧪 Testing a simple query...');
    
    // Try to query the database
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 1
    });
    
    console.log('✅ Database query successful!');
    console.log(`📊 Current records: ${response.results.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'object_not_found') {
      console.log('\n💡 Possible issues:');
      console.log('  - Database ID is wrong');
      console.log('  - Integration not connected to database');
      console.log('  - Database was deleted');
    }
  }
}

debugDatabase();