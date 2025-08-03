import validator from 'validator';
import type { RawLeadData, ValidationResult, ValidatedLeadData } from '../types/index.js';

export function validateLeadData(data: RawLeadData): ValidationResult {
  const errors: string[] = [];
  const cleanedData: ValidatedLeadData = {};

  if (!data.email || !validator.isEmail(data.email)) {
    errors.push('Valid email is required');
  } else {
    const normalizedEmail = validator.normalizeEmail(data.email);
    if (normalizedEmail) {
      cleanedData.email = normalizedEmail;
    }
  }

  if (data.name && typeof data.name === 'string') {
    cleanedData.name = validator.escape(data.name.trim());
  }

  if (data.company && typeof data.company === 'string') {
    cleanedData.company = validator.escape(data.company.trim());
  }

  if (data.phone && typeof data.phone === 'string') {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      cleanedData.phone = cleanPhone;
    }
  }

  if (!data.telegramId || typeof data.telegramId !== 'string') {
    errors.push('Telegram ID is required');
  } else {
    const telegramId = data.telegramId.toString().trim();
    if (telegramId.startsWith('@')) {
      cleanedData.telegramId = telegramId.substring(1);
    } else if (/^\d+$/.test(telegramId)) {
      cleanedData.telegramId = telegramId;
    } else {
      cleanedData.telegramId = telegramId;
    }
  }

  if (data.source && typeof data.source === 'string') {
    cleanedData.source = validator.escape(data.source.trim());
  }

  if (data.utmSource && typeof data.utmSource === 'string') {
    cleanedData.utmSource = validator.escape(data.utmSource.trim());
  }

  if (data.utmMedium && typeof data.utmMedium === 'string') {
    cleanedData.utmMedium = validator.escape(data.utmMedium.trim());
  }

  if (data.utmCampaign && typeof data.utmCampaign === 'string') {
    cleanedData.utmCampaign = validator.escape(data.utmCampaign.trim());
  }

  return {
    isValid: errors.length === 0,
    errors,
    cleanedData,
  };
}