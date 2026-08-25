export interface EmailJobData {
  scheduledEmailId: string;
  senderId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  minDelayMs: number;
  hourlyLimit: number;
}

export const EMAIL_QUEUE_NAME = "email-send";
