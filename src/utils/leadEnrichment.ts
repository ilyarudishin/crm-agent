import axios from 'axios';
import type { ValidatedLeadData, EnrichedLeadData, GeoLocationData, CompanyData } from '../types/index.js';

export async function enrichLeadData(leadData: ValidatedLeadData): Promise<EnrichedLeadData> {
  const enriched: EnrichedLeadData = { ...leadData, leadScore: 0, priority: 'Low', createdAt: '' };

  try {
    const clientIP = await getClientIP();
    if (clientIP) {
      enriched.ipAddress = clientIP;
    }
    
    if (enriched.ipAddress) {
      const geoData = await getGeoLocation(enriched.ipAddress);
      if (geoData) {
        enriched.country = geoData.country;
        enriched.city = geoData.city;
        enriched.timezone = geoData.timezone;
      }
    }

    if (leadData.email && !leadData.company) {
      const domain = leadData.email.split('@')[1];
      if (domain) {
        enriched.emailDomain = domain;
      
        const companyData = await getCompanyFromDomain(domain);
        if (companyData) {
          enriched.company = companyData.name;
          enriched.companySize = companyData.size;
        }
      }
    }

    enriched.leadScore = calculateLeadScore(enriched);
    enriched.priority = getLeadPriority(enriched.leadScore);

    enriched.source = enriched.source || 'Website Form';
    enriched.createdAt = new Date().toISOString();

  } catch (error) {
    console.error('Error enriching lead data:', error);
  }

  return enriched;
}

async function getClientIP(): Promise<string | null> {
  try {
    const response = await axios.get<{ ip: string }>('https://api.ipify.org?format=json', {
      timeout: 3000,
    });
    return response.data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return null;
  }
}

async function getGeoLocation(ip: string): Promise<GeoLocationData | null> {
  try {
    const response = await axios.get<{
      status: string;
      country: string;
      city: string;
      timezone: string;
    }>(`http://ip-api.com/json/${ip}`, {
      timeout: 3000,
    });
    
    if (response.data.status === 'success') {
      return {
        country: response.data.country,
        city: response.data.city,
        timezone: response.data.timezone,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting geo location:', error);
    return null;
  }
}

async function getCompanyFromDomain(domain: string): Promise<CompanyData | null> {
  if (isPersonalEmail(domain)) {
    return null;
  }

  try {
    const response = await axios.get<{
      name: string;
      metrics?: {
        employees: number;
      };
    }>(`https://company.clearbit.com/v1/domains/find?domain=${domain}`, {
      timeout: 5000,
      headers: {
        'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY || ''}`,
      },
    });

    return {
      name: response.data.name,
      size: response.data.metrics?.employees,
    };
  } catch (error) {
    console.error('Error getting company data:', error);
    return null;
  }
}

function isPersonalEmail(domain: string): boolean {
  const personalDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com', 'yandex.com',
  ];
  return personalDomains.includes(domain.toLowerCase());
}

function calculateLeadScore(leadData: EnrichedLeadData): number {
  let score = 0;

  if (leadData.email) score += 10;
  if (leadData.name) score += 5;
  if (leadData.company && leadData.emailDomain && !isPersonalEmail(leadData.emailDomain)) score += 20;
  if (leadData.phone) score += 15;
  if (leadData.telegramId) score += 10;
  
  if (leadData.utmSource) score += 5;
  if (leadData.utmMedium === 'organic') score += 10;
  if (leadData.utmMedium === 'paid') score += 5;

  if (leadData.companySize) {
    if (leadData.companySize > 100) score += 15;
    else if (leadData.companySize > 50) score += 10;
    else if (leadData.companySize > 10) score += 5;
  }

  return Math.min(score, 100);
}

function getLeadPriority(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}