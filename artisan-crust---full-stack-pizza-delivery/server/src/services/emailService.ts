import nodemailer, { Transporter } from 'nodemailer';
import { getLocalDB, saveLocalDB } from '../config/db.js';

export interface IEmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'verification' | 'password_reset' | 'low_stock' | 'order_confirmation';
  content: string;
  sentAt: string;
  status: 'sent' | 'simulated';
  previewUrl?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass && !host.includes('ethereal') && !user.includes('ethereal.user')) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user, pass }
      });
      return transporter;
    } catch (e) {
      console.warn('Error creating nodemailer transporter, falling back to simulated mailer:', e);
      return null;
    }
  }
  return null;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  type
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: 'verification' | 'password_reset' | 'low_stock' | 'order_confirmation';
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const mailer = getTransporter();
  const db = getLocalDB();
  const logId = 'mail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: process.env.EMAIL_FROM || '"Artisan Crust Pizza" <orders@artisancrust.com>',
        to,
        subject,
        html,
        text: text || subject
      });

      const log: IEmailLog = {
        id: logId,
        to,
        subject,
        type,
        content: html,
        sentAt: new Date().toISOString(),
        status: 'sent'
      };
      if (!db.emailLogs) db.emailLogs = [];
      db.emailLogs.unshift(log);
      saveLocalDB();

      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err) {
      console.error('Nodemailer failed, recording simulated email:', err);
    }
  }

  // Record simulated email in database so user can view it in the app's dev mailbox
  const log: IEmailLog = {
    id: logId,
    to,
    subject,
    type,
    content: html,
    sentAt: new Date().toISOString(),
    status: 'simulated'
  };
  if (!db.emailLogs) db.emailLogs = [];
  db.emailLogs.unshift(log);
  if (db.emailLogs.length > 50) db.emailLogs.pop();
  saveLocalDB();

  console.log(`[EMAIL LOGGED] Type: ${type} | To: ${to} | Subject: "${subject}"`);
  return { success: true, simulated: true };
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFEAE4; border-radius: 8px; background-color: #FAF7F2; color: #242424;">
      <h1 style="color: #E23722; font-size: 24px; margin-bottom: 16px;">Welcome to Artisan Crust, ${name}!</h1>
      <p style="font-size: 16px; line-height: 1.5; color: #4A4A4A;">
        Thank you for joining our community of handcrafted pizza lovers. Please verify your email address to activate your account and start ordering.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${verifyUrl}" style="background-color: #E23722; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 13px; color: #767676;">
        Verification Token: <code style="background: #EFEAE4; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${token}</code>
      </p>
      <p style="font-size: 13px; color: #9A9A9A;">
        This verification link will expire in 24 hours. If you did not create an account, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify your Artisan Crust Account',
    html,
    type: 'verification'
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #EFEAE4; border-radius: 8px; background-color: #FAF7F2; color: #242424;">
      <h1 style="color: #E23722; font-size: 22px; margin-bottom: 16px;">Password Reset Request</h1>
      <p style="font-size: 16px; line-height: 1.5; color: #4A4A4A;">
        We received a request to reset your password for your Artisan Crust account. Click the button below to choose a new password.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetUrl}" style="background-color: #242424; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="font-size: 13px; color: #767676;">
        Reset Code: <code style="background: #EFEAE4; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${token}</code>
      </p>
      <p style="font-size: 13px; color: #9A9A9A;">
        This link is valid for 1 hour. If you did not request a password reset, please ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset your Artisan Crust Password',
    html,
    type: 'password_reset'
  });
}

export async function sendLowStockAlertEmail(lowStockItems: Array<{ name: string; category: string; quantity: number; threshold: number }>): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@artisancrust.com';

  const rows = lowStockItems.map(item => `
    <tr style="border-bottom: 1px solid #EFEAE4;">
      <td style="padding: 10px; font-weight: 600;">${item.name}</td>
      <td style="padding: 10px; text-transform: capitalize;">${item.category}</td>
      <td style="padding: 10px; color: #E23722; font-weight: bold;">${item.quantity}</td>
      <td style="padding: 10px;">${item.threshold}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #EFEAE4; border-radius: 8px; background-color: #FAF7F2; color: #242424;">
      <h1 style="color: #E23722; font-size: 22px; margin-bottom: 12px;">⚠️ Low Stock Inventory Alert</h1>
      <p style="font-size: 15px; color: #4A4A4A; margin-bottom: 20px;">
        The automated scheduled inventory monitor has detected <strong>${lowStockItems.length}</strong> ingredient(s) at or below their low-stock thresholds.
      </p>
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; background: #FFFFFF; border-radius: 6px; overflow: hidden; border: 1px solid #EFEAE4;">
        <thead>
          <tr style="background: #F4EFEB; border-bottom: 2px solid #E23722;">
            <th style="padding: 10px;">Ingredient</th>
            <th style="padding: 10px;">Category</th>
            <th style="padding: 10px;">Current Stock</th>
            <th style="padding: 10px;">Alert Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="font-size: 13px; color: #767676; margin-top: 24px;">
        Please log into the Admin Dashboard to restock these items to prevent checkout interruptions.
      </p>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `[ALERT] Low Stock Warning: ${lowStockItems.length} ingredients need restocking`,
    html,
    type: 'low_stock'
  });
}
