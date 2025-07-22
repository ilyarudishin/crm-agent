// Lead Data Types
export interface RawLeadData {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  telegramId?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ValidatedLeadData {
  email?: string;
  name?: string;
  company?: string;
  phone?: string;
  telegramId?: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface EnrichedLeadData extends ValidatedLeadData {
  ipAddress?: string;
  country?: string;
  city?: string;
  timezone?: string;
  emailDomain?: string;
  companySize?: number;
  leadScore: number;
  priority: 'High' | 'Medium' | 'Low';
  createdAt: string;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  cleanedData: ValidatedLeadData;
}

// Notion Types
export interface NotionLeadResult {
  success: boolean;
  pageId?: string;
  url?: string;
  error?: string;
}

export interface NotionUpdateResult {
  success: boolean;
  error?: string;
}

// Telegram Types
export interface TelegramValidationResult {
  success: boolean;
  isValid: boolean;
  error?: string;
  userInfo?: {
    id: number;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface TelegramContactResult {
  success: boolean;
  contactMethod?: string;
  message?: string;
  error?: string;
  telegramError?: string;
}

export interface TelegramGroupResult {
  success: boolean;
  groupId?: string;
  groupName?: string;
  contactMethod?: string;
  error?: string;
}

// Queue Types
export interface QueueItem {
  id: string;
  leadData: EnrichedLeadData & {
    leadId: string;
    notionUrl: string;
  };
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  groupId?: string;
  groupName?: string;
}

export interface QueueResult {
  success: boolean;
  queueId?: string;
  position?: number;
  error?: string;
}

export interface QueueStatus {
  pending: number;
  completed: number;
  total: number;
}

// Lead Processing Types
export interface LeadProcessingResult {
  success: boolean;
  leadId?: string;
  notionUrl?: string;
  telegramGroup?: TelegramGroupResult | null;
  enrichedData?: EnrichedLeadData;
  error?: string;
  existingLead?: unknown;
}

// Configuration Types
export interface AppConfig {
  port: number;
  nodeEnv: string;
  notion: {
    apiKey: string;
    databaseId: string;
  };
  telegram: {
    botToken: string;
  };
  webhook: {
    secret?: string | undefined;
  };
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Company Enrichment Types
export interface CompanyData {
  name?: string;
  size?: number;
}

export interface GeoLocationData {
  country: string;
  city: string;
  timezone: string;
}