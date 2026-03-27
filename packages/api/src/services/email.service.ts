// Mama Fua — Email Service (SendGrid)
// KhimTech | 2026

import { logger } from '../lib/logger';

export interface SendEmailOptions {
  to: string;
  subject: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
  textContent?: string;
  categories?: string[];
}

export interface EmailDeliveryResult {
  delivered: boolean;
  provider: 'sendgrid';
  reason?: string;
}

const SENDGRID_ENDPOINT = 'https://api.sendgrid.com/v3/mail/send';

export async function sendTransactionalEmail(
  options: SendEmailOptions
): Promise<EmailDeliveryResult> {
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    logger.warn('[Email] SendGrid API key missing; skipping email delivery');
    return { delivered: false, provider: 'sendgrid', reason: 'provider_not_configured' };
  }

  if (process.env.NODE_ENV === 'test') {
    logger.info(`[Email:test] ${options.to} | ${options.subject}`);
    return { delivered: false, provider: 'sendgrid', reason: 'test_environment' };
  }

  const payload: Record<string, unknown> = {
    from: { email: 'noreply@mamafua.co.ke', name: 'Mama Fua' },
    reply_to: { email: 'support@mamafua.co.ke', name: 'Mama Fua Support' },
    personalizations: [
      {
        to: [{ email: options.to }],
        subject: options.subject,
        ...(options.dynamicTemplateData
          ? { dynamic_template_data: options.dynamicTemplateData }
          : {}),
      },
    ],
    categories: options.categories ?? ['transactional'],
  };

  if (options.templateId) {
    payload['template_id'] = options.templateId;
  } else {
    payload['content'] = [
      {
        type: 'text/plain',
        value: options.textContent ?? options.subject,
      },
    ];
  }

  const response = await fetch(SENDGRID_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error(`[Email] SendGrid error ${response.status}: ${errorBody}`);
    return { delivered: false, provider: 'sendgrid', reason: `provider_error_${response.status}` };
  }

  logger.info(`[Email] Delivered to ${options.to}`);
  return { delivered: true, provider: 'sendgrid' };
}
