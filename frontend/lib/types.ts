export type EmailStatus = "SCHEDULED" | "PROCESSING" | "SENT" | "FAILED";

export interface Sender {
  id: string;
  email: string;
  name: string | null;
}

export interface ScheduledEmailRow {
  id: string;
  recipient: string;
  subject: string;
  bodyHtml: string;
  scheduledFor: string;
  status: EmailStatus;
  sentAt: string | null;
  previewUrl: string | null;
  sender: Sender;
}

export interface EmailListResponse {
  rows: ScheduledEmailRow[];
  total: number;
}

export interface UploadListResponse {
  emails: string[];
  count: number;
  invalidRows: number;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  content: string; // base64
}
