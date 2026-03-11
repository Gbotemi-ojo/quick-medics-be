import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport'; 
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// --- DEBUG: LOG CREDENTIALS (MASKED) ---
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
console.log("========================================");
console.log(`[Email Service] SMTP_HOST: ${process.env.SMTP_HOST}`);
console.log(`[Email Service] SMTP_USER: ${user ? user : '*** MISSING ***'}`);
console.log(`[Email Service] SMTP_PASS: ${pass ? '*** PRESENT ***' : '*** MISSING ***'}`);
console.log("========================================");

interface ExtendedOptions extends SMTPTransport.Options {
  family?: number;
}

const isSecure = process.env.SMTP_PORT === '465' || process.env.SMTP_SECURE === 'true';

const transportOptions: ExtendedOptions = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, 
  logger: true,
  debug: true
};

const transporter = nodemailer.createTransport(transportOptions);

export const verifySmtpConnection = async () => {
    try {
        console.log("Testing SMTP Connection...");
        await transporter.verify();
        console.log("✅ SMTP Connection Successful! Server is ready to take messages.");
    } catch (error) {
        console.error("❌ SMTP Connection FAILED:");
        console.error(error);
    }
};

const loadTemplate = (templateName: string, replacements: Record<string, string>) => {
    const templatePath = path.join(process.cwd(), 'src', 'templates', templateName);
    
    try {
        let html = fs.readFileSync(templatePath, 'utf8');
        for (const key in replacements) {
            html = html.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
        }
        return html;
    } catch (error) {
        console.error(`Error loading template ${templateName}:`, error);
        return ""; 
    }
};

export const sendOtpEmail = async (to: string, otp: string) => {
  const htmlContent = loadTemplate('otp.html', { otp });
  const mailOptions = {
    from: `"${process.env.SENDER_NAME || 'Quick Medics'}" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your Security Code',
    html: htmlContent || `<p>Your OTP Code is: <strong>${otp}</strong></p>`,
  };
  try { await transporter.sendMail(mailOptions); return true; } catch (e) { return false; }
};

export const sendOrderConfirmationEmail = async (to: string, orderDetails: any) => {
  const { customerName, orderId, totalAmount, items, address } = orderDetails;
  const itemsHtml = items.map((item: any) => `<tr><td>${item.productName}</td><td>x${item.qty}</td><td style="text-align:right">₦${Number(item.price).toLocaleString()}</td></tr>`).join('');

  const htmlContent = loadTemplate('receipt.html', {
    customerName,
    orderId: orderId.toString(),
    totalAmount: Number(totalAmount).toLocaleString(),
    address,
    itemsHtml 
  });

  const mailOptions = {
    from: `"${process.env.SENDER_NAME || 'Quick Medics'}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Receipt for Order #${orderId}`,
    html: htmlContent,
  };
  try { await transporter.sendMail(mailOptions); } catch (e) { console.error("Receipt Email Failed:", e); }
};

export const sendTrainingApplicationEmail = async (applicationData: any) => {
  const { fullName, email, phone, address, educationLevel, motivation } = applicationData;
  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;

  // 1. Load HTML Version
  const htmlContent = loadTemplate('training-application.html', {
    fullName,
    email,
    phone,
    address,
    educationLevel,
    motivation
  });

  // 2. Create Text Version (CRITICAL FOR ANTI-SPAM)
  const textContent = `
    New Pharmacy Assistant Application
    ----------------------------------
    Name: ${fullName}
    Email: ${email}
    Phone: ${phone}
    Address: ${address}
    Education: ${educationLevel}
    
    Motivation:
    ${motivation}
  `;

  const mailOptions = {
    from: `"${process.env.SENDER_NAME || 'Quick Medics'}" <${process.env.SMTP_USER}>`,
    to: ownerEmail, 
    subject: `New Training Application: ${fullName}`,
    html: htmlContent,
    text: textContent, // <--- This line drastically lowers spam score
    replyTo: email 
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`>>> Application sent to ${ownerEmail}. ID: ${info.messageId}`);
    return true;
  } catch (e) {
    console.error("Training Email Failed:", e);
    throw e; 
  }
};
